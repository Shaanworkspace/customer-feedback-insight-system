import time

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from cfa.analysis.concerns import analyze_review
from cfa.analysis.rag import find_similar
from cfa.api.deps import get_current_user, metrics
from cfa.api.pipeline import process_csv
from cfa.api.schemas import AnalyzeRequest, EmailReportRequest
from cfa.db.repo import get_analysis_by_id, get_latest_analysis, save_analysis
from cfa.notify.email import build_report_html, send_email
from cfa.ranking.priority import rank_concerns
from cfa.reporting.store import ReportStore

router = APIRouter(tags=["analyze"])

reportStore = ReportStore()


# --- Helpers: single-review analysis ---

def buildRankedConcernsForSingleReview(detectedConcerns):
    rankedInput = {
        "concerns": [
            {
                "name": concernItem["name"],
                "count": 1,
                "negative_pct": 100.0 if concernItem["sentiment"] == "negative" else 0.0,
            }
            for concernItem in detectedConcerns
        ]
    }
    return rank_concerns(rankedInput)


def getSimilarReviewsIfHistoryExists(reviewText, userId):
    latestAnalysis = get_latest_analysis(userId)
    pastReviews = (latestAnalysis or {}).get("reviews", [])
    if not pastReviews:
        return []
    return find_similar(reviewText, reviews=pastReviews, top_k=5)


@router.post("/api/v1/analyze")
def analyze_single_review(request: AnalyzeRequest, currentUser=Depends(get_current_user)):
    # Validate input
    customerReviewText = (request.review_text or "").strip()
    if not customerReviewText:
        raise HTTPException(status_code=400, detail="Please provide a review text.")

    startTime = time.time()

    try:
        analysisResult = analyze_review(customerReviewText)
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Could not analyze the review: {error}") from error

    try:
        analysisResult["ranked_concerns"] = buildRankedConcernsForSingleReview(analysisResult["concerns"])
    except Exception:
        analysisResult["ranked_concerns"] = []

    try:
        analysisResult["similar_reviews"] = getSimilarReviewsIfHistoryExists(customerReviewText, currentUser.id)
    except Exception:
        analysisResult["similar_reviews"] = []

    # Metrics for /health
    metrics["reviews_analyzed"] += 1
    metrics["total_latency_ms"] += (time.time() - startTime) * 1000

    return analysisResult


# --- Helpers: CSV upload ---

def readUploadFileSafely(uploadedFile: UploadFile):
    try:
        return uploadedFile.file.read()
    except Exception as error:
        raise HTTPException(status_code=400, detail=f"Could not read the file: {error}") from error


def decodeCsvBytesToText(csvBytes: bytes):
    try:
        return csvBytes.decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File must be a UTF-8 CSV. Please save it as UTF-8 and try again.")


def processCsvBytesToStats(csvBytes: bytes):
    try:
        return process_csv(csvBytes)
    except ValueError as error:
        # Known validation error (e.g., no reviews found)
        raise HTTPException(status_code=400, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=400, detail=f"Could not process the CSV. Make sure it has a review text column: {error}") from error


@router.post("/api/v1/upload")
async def upload_csv_file(file: UploadFile = File(...), currentUser=Depends(get_current_user)):
    # Step 1: Validate file type (keep form field name 'file' for frontend compatibility)
    uploadedFile = file
    fileName = (uploadedFile.filename or "").lower()
    if fileName and not fileName.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Please upload a CSV file (.csv).")

    # Step 2: Read bytes
    csvFileBytes = await uploadedFile.read()

    if not csvFileBytes or len(csvFileBytes.strip()) == 0:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")

    # Step 3: Decode check (for metrics)
    csvTextForMetrics = decodeCsvBytesToText(csvFileBytes)
    metrics["reviews_analyzed"] += csvTextForMetrics.count("\n")

    # Step 4: Process
    dashboardStats = processCsvBytesToStats(csvFileBytes)

    # Step 5: Save
    try:
        save_analysis(currentUser.id, uploadedFile.filename, dashboardStats)
        reportStore.save_json(currentUser.id, uploadedFile.filename or "upload", dashboardStats)
    except Exception as error:
        # Save failure should not hide the result, but we log it
        print(f"Warning: could not save analysis: {error}")

    return dashboardStats


@router.post("/api/v1/report/email")
def send_report_email(request: EmailReportRequest, currentUser=Depends(get_current_user)):
    # Find which analysis to send
    try:
        reportData = (
            get_analysis_by_id(currentUser.id, request.analysis_id)
            if request.analysis_id
            else get_latest_analysis(currentUser.id)
        )
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Could not load the report: {error}") from error

    if not reportData:
        raise HTTPException(status_code=404, detail="No analysis found for this user. Please upload a CSV first.")

    htmlReport = build_report_html(reportData)

    try:
        send_email(request.email, "Your Customer Feedback Insight Report", htmlReport)
    except RuntimeError as error:
        raise HTTPException(status_code=500, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Could not send email: {error}") from error

    return {"sent": True, "email": request.email}
