import time

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from cfa.analysis.concerns import analyze_review
from cfa.api.deps import get_current_user, metrics
from cfa.api.pipeline import process_csv
from cfa.api.schemas import AnalyzeRequest
from cfa.db.repo import get_latest_analysis, save_analysis
from cfa.ranking.priority import rank_concerns

router = APIRouter(tags=["analyze"])


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


@router.post("/api/v1/analyze")
def analyze_single_review(request: AnalyzeRequest, currentUser=Depends(get_current_user)):
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
    # No RAG — just empty similar (DB has the real reviews, frontend shows them)
    analysisResult["similar_reviews"] = []
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

    # Step 5: Save to DB only (no file store)
    try:
        save_analysis(currentUser.id, uploadedFile.filename, dashboardStats)
    except Exception as error:
        print(f"Warning: could not save analysis: {error}")

    return dashboardStats
