from cfa.ml.serve import predict_aspect_sentiment


test_cases = [
    (
        "The camera quality is excellent but the battery drains quickly.",
        "camera",
    ),
    (
        "The camera quality is excellent but the battery drains quickly.",
        "battery",
    ),
    (
        "The food was delicious but the service was terrible.",
        "food",
    ),
    (
        "The food was delicious but the service was terrible.",
        "service",
    ),
]


for text, aspect in test_cases:
    result = predict_aspect_sentiment(text, aspect)

    print("\nReview:", text)
    print("Aspect:", aspect)
    print("Result:", result)