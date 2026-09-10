"""Upload pipeline: CSV bytes -> clean reviews -> analyze -> rank -> save.

Small helpers, easy names, each helper does one job.
Exception handling is split per step, not all inside one big try.
"""

import re
import uuid

from cfa.analysis.aggregation import ConcernAggregator
from cfa.analysis.concerns import analyze_reviews
from cfa.analysis.preprocessing import preprocess_csv
from cfa.analysis.rag import find_similar
from cfa.analysis.stats import _countries, _ratings
from cfa.ranking.priority import rank_concerns


def extractMonthTrend(customerReviews):
    """Count reviews per month (YYYY-MM) for the timeline chart."""
    monthCounts = {}
    for singleReview in customerReviews:
        reviewDate = singleReview.get("date", "")
        if not reviewDate:
            continue
        matchedMonth = re.search(r"\d{4}-\d{2}", reviewDate)
        if not matchedMonth:
            continue
        monthKey = matchedMonth.group()
        monthCounts[monthKey] = monthCounts.get(monthKey, 0) + 1
    # Return both keys for frontend compatibility (old expects count, new expects reviews)
    return [{"month": month, "count": count, "reviews": count} for month, count in sorted(monthCounts.items())]


def buildSentimentDistribution(processedReviews):
    """Count how many reviews are positive / negative / neutral / mixed."""
    distribution = {"positive": 0, "negative": 0, "neutral": 0, "mixed": 0}
    for singleReview in processedReviews:
        reviewFeeling = singleReview["sentiment"]
        distribution[reviewFeeling] = distribution.get(reviewFeeling, 0) + 1
    return distribution


def buildReviewsForStorage(cleanedRows, analysisResults):
    """Make the list that we save to the database."""
    reviewsForStorage = []
    concernAggregator = ConcernAggregator()

    for cleanedRow, analysisResult in zip(cleanedRows, analysisResults):
        overallFeeling = analysisResult["overall_sentiment"]
        rowAttributes = cleanedRow["attributes"]

        # First concern name or 'general' if none
        firstConcernName = analysisResult["concerns"][0]["name"] if analysisResult["concerns"] else "general"

        reviewRecord = {
            "review_id": str(uuid.uuid4())[:8],
            "text": cleanedRow["text"],
            "entity": firstConcernName,
            "sentiment": overallFeeling,
            "rating": cleanedRow["rating"],
            "country": cleanedRow["country"],
            "date": cleanedRow["date"],
            "reviewer": cleanedRow["reviewer"],
            "attributes": rowAttributes,
            "concerns": analysisResult["concerns"],
            "aspects": analysisResult["aspects"],
        }
        reviewsForStorage.append(reviewRecord)

        for detectedConcern in analysisResult["concerns"]:
            concernAggregator.add(detectedConcern["name"], detectedConcern["sentiment"], cleanedRow["text"])

    return reviewsForStorage, concernAggregator


def buildProofByConcern(concernAggregator):
    """Real quotes for each concern (first 3)."""
    return concernAggregator.proof()


def buildCommentsByConcern(concernAggregator, reviewsForStorage):
    """For each concern, find 5 similar real reviews."""
    reviewsById = {reviewItem["review_id"]: reviewItem for reviewItem in reviewsForStorage}
    commentsGroupedByConcern = {}

    for concernName in concernAggregator.counts:
        similarList = find_similar(concernName.replace("_", " "), top_k=5, reviews=reviewsForStorage)
        commentItems = []
        for similarEntry in similarList:
            matchedReview = reviewsById.get(similarEntry["review_id"])
            if not matchedReview:
                continue
            commentItems.append(
                {
                    "review_id": matchedReview["review_id"],
                    "reviewer": matchedReview.get("reviewer") or "Verified Reviewer",
                    "text": matchedReview["text"],
                    "rating": matchedReview.get("rating"),
                    "country": matchedReview.get("country", ""),
                    "date": matchedReview.get("date", ""),
                    "sentiment": matchedReview["sentiment"],
                    "similarity": similarEntry["similarity"],
                    "attributes": matchedReview.get("attributes", {}),
                }
            )
        commentsGroupedByConcern[concernName] = commentItems

    return commentsGroupedByConcern


def process_csv(csvFileBytes: bytes) -> dict:
    # Step 1: Read CSV — find the text column by itself
    try:
        cleanedRows, detectedColumns = preprocess_csv(csvFileBytes)
    except Exception as error:
        raise ValueError(f"Could not read the CSV file: {error}") from error

    if not cleanedRows:
        raise ValueError("No reviews found. Make sure the CSV has a column like 'review_text' or 'Review Text' with text inside.")

    # Step 2: Analyze each review (BERT finds aspects, rule gives overall)
    try:
        analysisResults = analyze_reviews([row["text"] for row in cleanedRows])
    except Exception as error:
        raise ValueError(f"Could not analyze reviews: {error}") from error

    # Step 3: Build reviews + concerns
    reviewsForStorage, concernAggregator = buildReviewsForStorage(cleanedRows, analysisResults)

    # Step 4: Counts
    totalReviews = len(reviewsForStorage)
    sentimentDistribution = buildSentimentDistribution(reviewsForStorage)
    rankedConcerns = rank_concerns({"concerns": concernAggregator.stats()})
    proofByConcern = buildProofByConcern(concernAggregator)
    commentsByConcern = buildCommentsByConcern(concernAggregator, reviewsForStorage)

    # Step 5: Charts data
    representativeReviews = [
        {"review_id": reviewItem["review_id"], "text": reviewItem["text"], "sentiment": reviewItem["sentiment"]}
        for reviewItem in reviewsForStorage[:3]
    ]

    return {
        "total_reviews": totalReviews,
        "sentiment_distribution": sentimentDistribution,
        "ranked_concerns": rankedConcerns,
        "representative_reviews": representativeReviews,
        "proof_by_concern": proofByConcern,
        "comments_by_concern": commentsByConcern,
        "ratings": _ratings(reviewsForStorage),
        "countries": _countries(reviewsForStorage),
        "time_trend": extractMonthTrend(reviewsForStorage),
        "reviews": reviewsForStorage,
    }
