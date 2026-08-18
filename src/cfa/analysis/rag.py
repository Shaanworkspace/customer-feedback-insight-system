"""RAG retrieval contract.

Mock until Ram Ashish + Sharad build the TF-IDF index over historical reviews.
"""


def find_similar(text: str, top_k: int = 5) -> list:
    return [
        {"review_id": "abc123", "text_preview": "battery dies in 2 hours, camera is fine", "similarity": 0.83}
    ][:top_k]
