import re
import json
import pytest
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer


class MockModel:
    NEG = re.compile(r"\b(terrible|bad|late|drains|slow|damaged|awful|poor)\b", re.I)
    POS = re.compile(r"\b(excellent|great|good|amazing|perfect|fast)\b", re.I)

    def _labels(self):
        texts = getattr(self, "_texts", [""])
        results = []
        for t in texts:
            if self.NEG.search(t):
                results.append("negative")
            elif self.POS.search(t):
                results.append("positive")
            else:
                results.append("neutral")
        return results

    def predict(self, X):
        return self._labels()

    def predict_proba(self, X):
        labels = self._labels()
        mapping = {
            "negative": [0.05, 0.88, 0.07],
            "positive": [0.89, 0.05, 0.06],
            "neutral":  [0.33, 0.33, 0.34],
        }
        return np.array([mapping[label] for label in labels])


class SmartVectorizer:
    def __init__(self, model):
        self._vect = TfidfVectorizer()
        self._model = model
        corpus = [
            "battery drains fast terrible",
            "camera excellent great photos",
            "delivery late packaging bad",
            "screen display resolution",
            "performance speed slow lag",
            "customer service refund return",
            "website checkout error login",
        ]
        self._vect.fit(corpus)

    def transform(self, texts):
        self._model._texts = list(texts)
        return self._vect.transform(texts)


@pytest.fixture
def model():
    return MockModel()


@pytest.fixture
def vectorizer(model):
    return SmartVectorizer(model)


SAMPLE_RECORDS = [
    {
        "text": "Battery life is terrible and drains overnight.",
        "sentiment": "negative",
        "concerns": [{"aspect": "battery", "sentiment": "negative"}],
    },
    {
        "text": "Camera takes amazing photos in low light.",
        "sentiment": "positive",
        "concerns": [{"aspect": "camera", "sentiment": "positive"}],
    },
    {
        "text": "Delivery was extremely late and packaging damaged.",
        "sentiment": "negative",
        "concerns": [{"aspect": "delivery", "sentiment": "negative"}],
    },
    {
        "text": "Great screen and display brightness.",
        "sentiment": "positive",
        "concerns": [{"aspect": "screen", "sentiment": "positive"}],
    },
    {
        "text": "Performance is slow and app keeps crashing.",
        "sentiment": "negative",
        "concerns": [{"aspect": "performance", "sentiment": "negative"}],
    },
]


class TestDetectConcerns:

    def test_battery(self):
        from cfa.analysis.concern import detect_concerns
        r = detect_concerns("Battery drains quickly after update.")
        assert any(c["aspect"] == "battery" for c in r)

    def test_camera(self):
        from cfa.analysis.concern import detect_concerns
        r = detect_concerns("Camera takes great photos.")
        assert any(c["aspect"] == "camera" for c in r)

    def test_delivery(self):
        from cfa.analysis.concern import detect_concerns
        r = detect_concerns("Delivery was late and packaging was damaged.")
        assert any(c["aspect"] == "delivery" for c in r)

    def test_multiple_concerns(self):
        from cfa.analysis.concern import detect_concerns
        r = detect_concerns("Camera is great but battery is terrible.")
        aspects = [c["aspect"] for c in r]
        assert "camera" in aspects
        assert "battery" in aspects

    def test_empty_string(self):
        from cfa.analysis.concern import detect_concerns
        assert detect_concerns("") == []

    def test_none_input(self):
        from cfa.analysis.concern import detect_concerns
        assert detect_concerns(None) == []

    def test_case_insensitive(self):
        from cfa.analysis.concern import detect_concerns
        a = [c["aspect"] for c in detect_concerns("BATTERY DRAINS FAST")]
        b = [c["aspect"] for c in detect_concerns("battery drains fast")]
        assert set(a) == set(b)

    def test_no_false_partial_match(self):
        from cfa.analysis.concern import detect_concerns
        r = detect_concerns("This seller is a scammer.")
        assert not any(c["aspect"] == "camera" for c in r)

    def test_aspect_appears_once(self):
        from cfa.analysis.concern import detect_concerns
        r = detect_concerns("battery battery battery is bad")
        assert [c["aspect"] for c in r].count("battery") == 1

    def test_json_serialisable(self):
        from cfa.analysis.concern import detect_concerns
        r = detect_concerns("Camera is great but battery is terrible.")
        json.dumps(r)

    def test_very_long_review(self):
        from cfa.analysis.concern import detect_concerns
        text = "Camera is great. " * 300 + "Battery drains fast. " * 100
        r = detect_concerns(text)
        aspects = [c["aspect"] for c in r]
        assert "camera" in aspects
        assert "battery" in aspects

    def test_unicode(self):
        from cfa.analysis.concern import detect_concerns
        r = detect_concerns("Batterie terrible! Camera excellente.")
        assert isinstance(r, list)

    def test_no_concerns(self):
        from cfa.analysis.concern import detect_concerns
        r = detect_concerns("I really enjoyed using this today.")
        assert isinstance(r, list)

    def test_very_short_review(self):
        from cfa.analysis.concern import detect_concerns
        r = detect_concerns("Bad.")
        assert isinstance(r, list)

    def test_keywords_returned(self):
        from cfa.analysis.concern import detect_concerns
        r = detect_concerns("battery drains quickly and charging is slow")
        battery = next((c for c in r if c["aspect"] == "battery"), None)
        assert battery is not None
        assert len(battery["keywords"]) >= 1


class TestGetContext:

    def test_basic(self):
        from cfa.analysis.aspect_sentiment import get_context
        ctx = get_context(
            "The battery drains very fast on this device", "battery", 3
        )
        assert "battery" in ctx.lower()

    def test_fallback_on_missing_keyword(self):
        from cfa.analysis.aspect_sentiment import get_context
        text = "no keyword here"
        assert get_context(text, "battery") == text

    def test_empty_text(self):
        from cfa.analysis.aspect_sentiment import get_context
        assert get_context("", "battery") == ""

    def test_empty_keyword(self):
        from cfa.analysis.aspect_sentiment import get_context
        assert get_context("some text here", "") == "some text here"

    def test_phrase_keyword(self):
        from cfa.analysis.aspect_sentiment import get_context
        text = "the battery life is absolutely terrible in this phone"
        ctx = get_context(text, "battery life", 3)
        assert "battery" in ctx.lower()

    def test_keyword_at_start(self):
        from cfa.analysis.aspect_sentiment import get_context
        text = "battery drains very fast on this phone"
        ctx = get_context(text, "battery", 3)
        assert "battery" in ctx.lower()

    def test_keyword_at_end(self):
        from cfa.analysis.aspect_sentiment import get_context
        text = "this phone has a very short battery"
        ctx = get_context(text, "battery", 3)
        assert "battery" in ctx.lower()

    def test_window_limits(self):
        from cfa.analysis.aspect_sentiment import get_context
        text = "word1 word2 word3 battery word4 word5 word6"
        ctx = get_context(text, "battery", 2)
        assert len(ctx.split()) <= 6


class TestAspectSentiment:

    def test_positive_camera(self, model, vectorizer):
        from cfa.analysis.concern import detect_concerns
        from cfa.analysis.aspect_sentiment import analyze_aspect_sentiment
        text = "Camera is excellent but battery drains fast."
        concerns = detect_concerns(text)
        result = analyze_aspect_sentiment(
            text, concerns, model, vectorizer, context_window=2
        )
        assert result.get("camera", {}).get("sentiment") == "positive"

    def test_negative_battery(self, model, vectorizer):
        from cfa.analysis.concern import detect_concerns
        from cfa.analysis.aspect_sentiment import analyze_aspect_sentiment
        text = "Camera is excellent but battery drains fast."
        concerns = detect_concerns(text)
        result = analyze_aspect_sentiment(
            text, concerns, model, vectorizer, context_window=2
        )
        assert result.get("battery", {}).get("sentiment") == "negative"

    def test_no_concerns_returns_empty(self, model, vectorizer):
        from cfa.analysis.aspect_sentiment import analyze_aspect_sentiment
        assert analyze_aspect_sentiment("Nice.", [], model, vectorizer) == {}

    def test_none_model_returns_empty(self, vectorizer):
        from cfa.analysis.concern import detect_concerns
        from cfa.analysis.aspect_sentiment import analyze_aspect_sentiment
        concerns = detect_concerns("battery drains fast")
        result = analyze_aspect_sentiment(
            "battery drains fast", concerns, None, vectorizer
        )
        assert result == {}

    def test_none_vectorizer_returns_empty(self, model):
        from cfa.analysis.concern import detect_concerns
        from cfa.analysis.aspect_sentiment import analyze_aspect_sentiment
        concerns = detect_concerns("battery drains fast")
        result = analyze_aspect_sentiment(
            "battery drains fast", concerns, model, None
        )
        assert result == {}

    def test_context_included(self, model, vectorizer):
        from cfa.analysis.concern import detect_concerns
        from cfa.analysis.aspect_sentiment import analyze_aspect_sentiment
        text = "Camera quality is absolutely excellent."
        concerns = detect_concerns(text)
        result = analyze_aspect_sentiment(text, concerns, model, vectorizer)
        assert result.get("camera", {}).get("context", "") != ""

    def test_returns_json_serialisable(self, model, vectorizer):
        from cfa.analysis.concern import detect_concerns
        from cfa.analysis.aspect_sentiment import analyze_aspect_sentiment
        text = "Camera is excellent but battery drains fast."
        concerns = detect_concerns(text)
        result = analyze_aspect_sentiment(text, concerns, model, vectorizer)
        json.dumps(result)

    def test_multiple_aspects(self, model, vectorizer):
        from cfa.analysis.concern import detect_concerns
        from cfa.analysis.aspect_sentiment import analyze_aspect_sentiment
        text = "Camera is excellent but battery is terrible and delivery was late."
        concerns = detect_concerns(text)
        result = analyze_aspect_sentiment(text, concerns, model, vectorizer)
        assert len(result) >= 2


@pytest.fixture
def rag_index():
    from cfa.analysis.rag import build_rag_index
    vect = TfidfVectorizer()
    vect.fit([r["text"] for r in SAMPLE_RECORDS])
    index = build_rag_index(SAMPLE_RECORDS, vect)
    return index, vect


class TestRAG:

    def test_index_shape(self, rag_index):
        index, _ = rag_index
        assert index["vectors"].shape[0] == len(SAMPLE_RECORDS)

    def test_empty_records_raises(self):
        from cfa.analysis.rag import build_rag_index
        vect = TfidfVectorizer().fit(["dummy"])
        with pytest.raises(ValueError):
            build_rag_index([], vect)

    def test_none_vectorizer_raises(self):
        from cfa.analysis.rag import build_rag_index
        with pytest.raises(ValueError):
            build_rag_index(SAMPLE_RECORDS, None)

    def test_retrieve_top_k(self, rag_index):
        from cfa.analysis.rag import retrieve_similar_reviews
        index, _ = rag_index
        results = retrieve_similar_reviews(
            "Battery drains quickly.", index, top_k=3, min_similarity=0.0
        )
        assert len(results) <= 3

    def test_similarity_range(self, rag_index):
        from cfa.analysis.rag import retrieve_similar_reviews
        index, _ = rag_index
        results = retrieve_similar_reviews(
            "Battery drains quickly.", index, top_k=5, min_similarity=0.0
        )
        for r in results:
            assert 0.0 <= r["similarity"] <= 1.0

    def test_sorted_descending(self, rag_index):
        from cfa.analysis.rag import retrieve_similar_reviews
        index, _ = rag_index
        results = retrieve_similar_reviews(
            "Battery drains quickly.", index, top_k=5, min_similarity=0.0
        )
        sims = [r["similarity"] for r in results]
        assert sims == sorted(sims, reverse=True)

    def test_empty_query_returns_empty(self, rag_index):
        from cfa.analysis.rag import retrieve_similar_reviews
        index, _ = rag_index
        assert retrieve_similar_reviews("", index) == []

    def test_min_similarity_threshold(self, rag_index):
        from cfa.analysis.rag import retrieve_similar_reviews
        index, _ = rag_index
        results = retrieve_similar_reviews(
            "Battery drains quickly.", index, top_k=5, min_similarity=0.99
        )
        for r in results:
            assert r["similarity"] >= 0.99

    def test_evidence_negative_count(self):
        from cfa.analysis.rag import build_rag_evidence
        similar = [
            {"concerns": [{"aspect": "battery", "sentiment": "negative"}]},
            {"concerns": [{"aspect": "battery", "sentiment": "negative"}]},
            {"concerns": [{"aspect": "battery", "sentiment": "positive"}]},
        ]
        evidence = build_rag_evidence(similar)
        bat = next(e for e in evidence if e["aspect"] == "battery")
        assert bat["negative_count"] == 2
        assert bat["positive_count"] == 1

    def test_evidence_negative_ratio(self):
        from cfa.analysis.rag import build_rag_evidence
        similar = [
            {"concerns": [{"aspect": "battery", "sentiment": "negative"}]},
            {"concerns": [{"aspect": "battery", "sentiment": "negative"}]},
            {"concerns": [{"aspect": "battery", "sentiment": "negative"}]},
            {"concerns": [{"aspect": "battery", "sentiment": "positive"}]},
        ]
        evidence = build_rag_evidence(similar)
        bat = next(e for e in evidence if e["aspect"] == "battery")
        assert bat["negative_ratio"] == pytest.approx(0.75, abs=0.01)

    def test_evidence_empty_similar(self):
        from cfa.analysis.rag import build_rag_evidence
        assert build_rag_evidence([]) == []

    def test_evidence_no_concerns(self):
        from cfa.analysis.rag import build_rag_evidence
        similar = [{"concerns": []}, {"concerns": []}]
        assert build_rag_evidence(similar) == []

    def test_evidence_serialisable(self):
        from cfa.analysis.rag import build_rag_evidence
        evidence = build_rag_evidence([
            {"concerns": [{"aspect": "battery", "sentiment": "negative"}]}
        ])
        json.dumps(evidence)

    def test_evidence_text_not_empty(self):
        from cfa.analysis.rag import build_rag_evidence
        evidence = build_rag_evidence([
            {"concerns": [{"aspect": "battery", "sentiment": "negative"}]}
        ])
        bat = next(e for e in evidence if e["aspect"] == "battery")
        assert bat["evidence_text"] != ""

    def test_retrieve_returns_review_text(self, rag_index):
        from cfa.analysis.rag import retrieve_similar_reviews
        index, _ = rag_index
        results = retrieve_similar_reviews(
            "Battery drains quickly.", index, top_k=1, min_similarity=0.0
        )
        assert results[0]["review"] != ""


class TestPipeline:

    @pytest.fixture
    def mock_rag(self):
        from cfa.analysis.rag import build_rag_index
        vect = TfidfVectorizer()
        vect.fit([r["text"] for r in SAMPLE_RECORDS])
        return build_rag_index(SAMPLE_RECORDS, vect)

    def test_returns_dict(self, model, vectorizer, mock_rag):
        from cfa.analysis.pipeline import analyze_review
        result = analyze_review(
            "Camera is excellent but battery drains fast.",
            model, vectorizer, mock_rag,
        )
        assert isinstance(result, dict)

    def test_required_keys_present(self, model, vectorizer, mock_rag):
        from cfa.analysis.pipeline import analyze_review
        result = analyze_review(
            "Camera is excellent but battery drains fast.",
            model, vectorizer, mock_rag,
        )
        for key in ["review", "overall_sentiment", "concerns", "rag"]:
            assert key in result

    def test_empty_review_returns_structured(self, model, vectorizer):
        from cfa.analysis.pipeline import analyze_review
        result = analyze_review("", model, vectorizer, None)
        assert result["concerns"] == []
        assert result["overall_sentiment"]["label"] == "neutral"

    def test_none_rag_no_crash(self, model, vectorizer):
        from cfa.analysis.pipeline import analyze_review
        result = analyze_review("Battery drains fast.", model, vectorizer, None)
        assert result["rag"]["similar_reviews"] == []

    def test_none_model_no_crash(self, vectorizer):
        from cfa.analysis.pipeline import analyze_review
        result = analyze_review("Battery drains fast.", None, vectorizer, None)
        assert result["overall_sentiment"]["label"] == "neutral"

    def test_concerns_detected(self, model, vectorizer):
        from cfa.analysis.pipeline import analyze_review
        result = analyze_review(
            "Camera is excellent but battery drains fast.",
            model, vectorizer, None,
        )
        aspects = [c["aspect"] for c in result["concerns"]]
        assert "camera" in aspects
        assert "battery" in aspects

    def test_rag_similar_reviews_present(self, model, vectorizer, mock_rag):
        from cfa.analysis.pipeline import analyze_review
        result = analyze_review(
            "Battery life is terrible.",
            model, vectorizer, mock_rag,
        )
        assert isinstance(result["rag"]["similar_reviews"], list)

    def test_rag_evidence_present(self, model, vectorizer, mock_rag):
        from cfa.analysis.pipeline import analyze_review
        result = analyze_review(
            "Battery life is terrible.",
            model, vectorizer, mock_rag,
        )
        assert isinstance(result["rag"]["evidence"], list)

    def test_overall_sentiment_has_label(self, model, vectorizer):
        from cfa.analysis.pipeline import analyze_review
        result = analyze_review(
            "Delivery was very late and packaging damaged.",
            model, vectorizer, None,
        )
        assert "label" in result["overall_sentiment"]

    def test_concern_has_required_keys(self, model, vectorizer):
        from cfa.analysis.pipeline import analyze_review
        result = analyze_review(
            "Battery drains fast.",
            model, vectorizer, None,
        )
        for concern in result["concerns"]:
            for key in ["aspect", "keywords", "sentiment", "context"]:
                assert key in concern

    def test_result_is_json_serialisable(self, model, vectorizer, mock_rag):
        from cfa.analysis.pipeline import analyze_review
        result = analyze_review(
            "Camera is excellent but battery drains fast.",
            model, vectorizer, mock_rag,
        )
        json.dumps(result)

    def test_unicode_no_crash(self, model, vectorizer):
        from cfa.analysis.pipeline import analyze_review
        result = analyze_review(
            "Camera excellente. Batterie terrible.",
            model, vectorizer, None,
        )
        assert isinstance(result, dict)

    def test_very_long_review_no_crash(self, model, vectorizer):
        from cfa.analysis.pipeline import analyze_review
        text = "Camera is great. " * 200 + "Battery drains fast. " * 100
        result = analyze_review(text, model, vectorizer, None)
        assert isinstance(result, dict)

    def test_no_concerns_no_crash(self, model, vectorizer):
        from cfa.analysis.pipeline import analyze_review
        result = analyze_review(
            "I am very happy with this purchase.",
            model, vectorizer, None,
        )
        assert isinstance(result["concerns"], list)


class TestBuildConcernStats:

    def test_basic_structure(self):
        from cfa.analysis.pipeline import build_concern_stats
        records = [
            {"concerns": [{"aspect": "battery",  "sentiment": "negative"}]},
            {"concerns": [{"aspect": "battery",  "sentiment": "negative"}]},
            {"concerns": [{"aspect": "battery",  "sentiment": "positive"}]},
            {"concerns": [{"aspect": "delivery", "sentiment": "negative"}]},
        ]
        result = build_concern_stats(records)
        assert "concerns" in result
        assert isinstance(result["concerns"], list)

    def test_count_correct(self):
        from cfa.analysis.pipeline import build_concern_stats
        records = [
            {"concerns": [{"aspect": "battery", "sentiment": "negative"}]},
            {"concerns": [{"aspect": "battery", "sentiment": "negative"}]},
            {"concerns": [{"aspect": "battery", "sentiment": "positive"}]},
        ]
        result  = build_concern_stats(records)
        battery = next(c for c in result["concerns"] if c["name"] == "battery")
        assert battery["count"] == 3

    def test_negative_pct_correct(self):
        from cfa.analysis.pipeline import build_concern_stats
        records = [
            {"concerns": [{"aspect": "battery", "sentiment": "negative"}]},
            {"concerns": [{"aspect": "battery", "sentiment": "negative"}]},
            {"concerns": [{"aspect": "battery", "sentiment": "positive"}]},
            {"concerns": [{"aspect": "battery", "sentiment": "positive"}]},
        ]
        result  = build_concern_stats(records)
        battery = next(c for c in result["concerns"] if c["name"] == "battery")
        assert battery["negative_pct"] == pytest.approx(0.5, abs=0.01)

    def test_empty_records(self):
        from cfa.analysis.pipeline import build_concern_stats
        result = build_concern_stats([])
        assert result == {"concerns": []}

    def test_has_required_keys(self):
        from cfa.analysis.pipeline import build_concern_stats
        records = [
            {"concerns": [{"aspect": "delivery", "sentiment": "negative"}]},
        ]
        result   = build_concern_stats(records)
        delivery = result["concerns"][0]
        assert "name"         in delivery
        assert "count"        in delivery
        assert "negative_pct" in delivery

    def test_feeds_into_rank_concerns(self):
        from cfa.analysis.pipeline import build_concern_stats
        from cfa.ranking.priority import rank_concerns
        records = [
            {"concerns": [{"aspect": "battery",  "sentiment": "negative"}]},
            {"concerns": [{"aspect": "battery",  "sentiment": "negative"}]},
            {"concerns": [{"aspect": "delivery", "sentiment": "negative"}]},
            {"concerns": [{"aspect": "camera",   "sentiment": "positive"}]},
        ]
        concern_stats = build_concern_stats(records)
        ranking       = rank_concerns(concern_stats)
        assert isinstance(ranking, list)
        assert ranking[0]["priority"] == 1
        assert "impact" in ranking[0]