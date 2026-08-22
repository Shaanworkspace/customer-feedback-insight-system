# ML Documentation — Sentiment Model, explained from zero

This file explains the Machine Learning part **slowly, in order**, like a class. By the end you will understand what the model does, why we chose it, how it is trained, and how it runs. No prior ML knowledge is assumed.

The ML code is `src/cfa/ml/serve.py` (the predictor). The training code is `src/cfa/ml/train.py`.

---

## Level 1 — What problem are we solving?

We have a review: *"Battery drains very fast, dies in 2 hours."*

We want the computer to decide: is this **positive** or **negative**?

That is called **sentiment classification** — put text into one of two buckets.

A human reads it and says "negative". We want code that says the same thing, automatically, for thousands of reviews.

---

## Level 2 — The simplest method (used as a backup)

Here is the backup method. It counts good words and bad words:

```python
positive_words = ["good", "great", "excellent", "love", "best", "fast", "easy"]
negative_words = ["bad", "terrible", "poor", "awful", "worst", "slow", "drains", "late"]

text_lower = text.lower()
score = (count of positive words) - (count of negative words)
label = "positive" if score >= 0 else "negative"
```

### How it works, step by step

Take the review: *"Battery drains very fast, dies in 2 hours."*

1. Lowercase it.
2. Count positive words: `fast` is in the list → +1.
3. Count negative words: `drains` is in the list → −1.
4. Score = 1 − 1 = **0** → label = "positive".

Wait — that is **wrong**! "drains very fast" is negative, but our list counted `fast` as positive. This shows the weakness of keyword counting: "fast" is good in "fast charging" but bad in "drains fast".

That is exactly why we also train a real model. The keyword method is kept as a **fallback** — it never breaks, even on tiny inputs.

---

## Level 3 — The real model: TF-IDF + Logistic Regression

We train a small, fast model and use it for most reviews:

```python
def predict_sentiment(text: str) -> dict:
    model, vectorizer = _load()          # load the trained files
    if model is None:
        return _keyword_fallback(text)   # backup if files missing
    proba = model.predict_proba(vectorizer.transform([text]))[0]
    label = model.classes_[proba.argmax()]
    return {"label": label, "confidence": float(proba.max())}
```

Two new words: **vectorizer** and **model**. Let us learn them.

---

## Level 4 — What is TF-IDF? (turning text into numbers)

A model cannot read words. It needs numbers. **TF-IDF** is a recipe that turns a sentence into a list of numbers.

- TF = **Term Frequency**: how often a word appears in this review.
- IDF = **Inverse Document Frequency**: give less weight to boring words like "the", "and" that appear everywhere.

Result: a big row of numbers, one per word in the vocabulary.

### Tiny example

Vocabulary (learned in training): `[battery, great, terrible, fast, screen]`

- *"battery great"* → `[0.7, 0.7, 0, 0, 0]`
- *"terrible screen"* → `[0, 0, 0.7, 0, 0.7]`

Now each review is a list of numbers the model can do math on. The **vectorizer** is the object that remembers the vocabulary and converts new text into this number row.

---

## Level 5 — What is Logistic Regression? (the brain)

Logistic Regression is a simple classifier. After TF-IDF gives the number row, it outputs a probability:

- "88% chance this is negative"
- "95% chance this is positive"

We pick the higher one as the label, and that probability is the **confidence**.

### How was it trained?

During training (`ml/train.py`) the system saw many example reviews already labelled positive/negative by humans. It learned weights like:

- seeing "terrible" pushes toward **negative**
- seeing "excellent" pushes toward **positive**

Training = finding the best weights so the model agrees with the human labels.

> Why this model? It is small, fast, needs no GPU, and is easy to explain ("this word pushed it negative"). For sentiment on thousands of reviews, it is a great, honest choice.

---

## Level 6 — The hybrid: model + fallback together

A trained model is smart but can be **over-confident on very short text** (e.g. "Worst ever"). So we use a hybrid:

1. If the review is **long** (more than ~8 words) **and** the model is **confident** (probability ≥ 0.60) → trust the model.
2. If the review is **short** or the model is **unsure** → use the keyword fallback (Level 2), which is tuned for phrases.

This gives the best of both: the model's understanding of context for normal reviews, and the reliability of rule-counting for tiny or tricky inputs. The keyword fallback also covers the rare case where the model file is missing.

---

## Level 7 — Where the model lives (and why it is always there)

`config.py`:

```python
MODEL_PATH = PROJECT_ROOT / "models" / "sentiment_model.joblib"
VECTORIZER_PATH = PROJECT_ROOT / "models" / "sentiment_vectorizer.joblib"
```

The trained model files are **committed to the repository**, so both your local machine **and the deployed cloud** use the smart model. The keyword fallback only steps in for short/low-confidence reviews (the hybrid above) or if the file were ever absent.

This is why the system "just works" everywhere.

---

## Level 8 — Training data

The model was trained on **79,498 real Amazon reviews**:

- Our curated Amazon reviews (ratings 1–2 → negative, 4–5 → positive, 3 dropped).
- Plus the public `amazon_polarity` dataset, merged in.

No fake or generated text. The labels come from the star ratings people actually gave.

---

## Level 9 — How good is it? (real numbers)

After training, we hide 15,900 reviews from the model and ask it to predict them. Result:

| Metric | Score | Plain meaning |
|--------|-------|---------------|
| Accuracy | **88.4%** | 88 out of 100 reviews labelled correctly |
| Precision | **86.0%** | when it says "positive", it is right 86% of the time |
| Recall | **89.0%** | it catches 89% of all truly negative reviews |
| F1 | **87.5%** | the balanced overall score |

These numbers are saved in `models/metrics.json` and are the same ones shown to judges. They are honest: measured on data the model never saw during training.

---

## Level 10 — How it connects to the rest

Every review in the upload pipeline calls:

```python
overall = predict_sentiment(text)   # <- our ML step (hybrid)
```

So the sentiment label on each review (and therefore the positive/negative pie chart) comes from this ML function.

---

## Level 11 — Interview questions (ML)

**Q: Why TF-IDF and not BERT?**
A: TF-IDF is simpler, faster, needs no GPU, and is fully explainable. BERT would capture meaning better but adds size and complexity. Good trade-off for this task.

**Q: Why Logistic Regression and not a neural network?**
A: It is fast to train, easy to debug, and strong enough for sentiment with good features. A neural net would be heavier with little gain at this scale.

**Q: What is confidence?**
A: The model's probability for the chosen class. 0.88 means "88% sure it is negative".

**Q: Why a hybrid instead of only the model?**
A: The model can be confidently wrong on 2-word reviews. The fallback covers those, so the app is reliable on every input length.

**Q: Is the model fair?**
A: It learns from the training data. If that data is biased, the model is too. That is a real limitation to name.

**Q: How would you improve it?**
A: (1) Bigger and more balanced data. (2) A transformer (DistilBERT) for better context. (3) Confidence thresholds that abstain on unsure cases. (4) Track precision/recall per concern, not just overall.

---

## Level 12 — One paragraph to remember

> Our sentiment system turns a review into numbers with TF-IDF, classifies it as positive or negative with Logistic Regression, and returns a confidence score. For long, confident reviews it trusts the model; for short or unsure ones it falls back to tuned keyword counting. The trained model is committed to the repo, so it runs the same locally and in the cloud, and it was measured at 88.4% accuracy on unseen reviews.
