# ML Documentation — Sentiment Model, from zero

This file explains the Machine Learning part **slowly, in order**, like a class. By the end you will understand what the model does, why we chose it, how it is trained, and how it runs. No prior ML knowledge is assumed.

The ML file is `src/cfa/ml/serve.py`. The training code is `src/cfa/ml/train.py` (not covered in the hackathon demo but exists).

---

## Level 1 — What problem are we solving?

We have a review: *"Battery drains very fast, dies in 2 hours."*

We want the computer to decide: is this **positive** or **negative**?

That is called **sentiment classification** — put text into one of two buckets.

A human reads it and says "negative". We want code that says the same thing, automatically, for thousands of reviews.

---

## Level 2 — The simplest possible method (the fallback)

Before any fancy model, here is the backup method that is always available. It is in `ml/serve.py`:

```python
positive_words = ["good", "great", "excellent", "love", "best", "fast", "easy"]
negative_words = ["bad", "terrible", "poor", "awful", "worst", "slow", "drains", "late"]

text_lower = text.lower()
score = sum(w in text_lower for w in positive_words) - sum(w in text_lower for w in negative_words)
label = "positive" if score >= 0 else "negative"
confidence = min(1.0, 0.5 + abs(score) * 0.15)
```

### How it works, step by step

Take the review: *"Battery drains very fast, dies in 2 hours."*

1. Lowercase it: `"battery drains very fast, dies in 2 hours."`
2. Count positive words present: `fast` is in the list → +1. Total positive = 1.
3. Count negative words present: `drains` is in the list → -1. Total negative = 1.
4. Score = 1 − 1 = **0**.
5. Because score >= 0, label = **"positive"**.

Wait — that is wrong! "drains very fast" is negative, but our simple word list counted `fast` as positive. This shows the **weakness** of keyword counting: words like "fast" are good in one context ("fast charging") and bad in another ("drains fast").

That is exactly why we prefer a trained model. But the keyword method is still useful as a **fallback** when the model file is missing.

---

## Level 3 — The real model: TF-IDF + Logistic Regression

When the trained model files exist, the code uses them instead:

```python
def predict_sentiment(text: str) -> dict:
    model, vectorizer = _load()
    if model is None:
        ... # use the keyword fallback from Level 2
    proba = model.predict_proba(vectorizer.transform([text]))[0]
    label = model.classes_[proba.argmax()]
    return {"label": label, "confidence": round(float(proba.max()), 2)}
```

Two new words appear: **vectorizer** and **model**. Let us learn them.

---

## Level 4 — What is TF-IDF? (turning text into numbers)

A machine learning model cannot read words. It needs numbers. **TF-IDF** is a recipe that turns a sentence into a list of numbers.

TF-IDF = **T**erm **F**requency × **I**nverse **D**ocument **F**requency.

In plain words:
- For each word, count how often it appears in this review (Term Frequency).
- But give less weight to words that appear in EVERY review (like "the", "and") because they are not useful (Inverse Document Frequency).
- The result is a big row of numbers, one number per word in the vocabulary.

### Tiny example

Vocabulary (from training): `[battery, great, terrible, fast, screen]`

Review A: *"battery great"* → TF-IDF row might be `[0.7, 0.7, 0, 0, 0]`
Review B: *"terrible screen"* → `[0, 0, 0.7, 0, 0.7]`

Now each review is a list of numbers. The model can do math on it.

> The "vectorizer" is the object that remembers the vocabulary and converts new text into this number row.

---

## Level 5 — What is Logistic Regression? (the actual "brain")

Logistic Regression is a simple classifier. After TF-IDF gives us the number row, Logistic Regression looks at those numbers and outputs a probability:

- "80% chance this is negative"
- "95% chance this is positive"

We pick the higher one as the label, and that probability is the **confidence**.

### How was it trained?

During training (`ml/train.py`), the system was shown many example reviews that a human had already labeled positive or negative. It learned weights like:

- seeing the word "terrible" should push toward **negative**
- seeing the word "excellent" should push toward **positive**

Training = finding the best weights so the model agrees with the human labels on the examples.

> Why this model? It is small, fast, needs no GPU, and is easy to explain ("this word pushed it negative"). For a sentiment task on thousands of reviews, it is a great, honest choice.

---

## Level 6 — Inference (using the model at runtime)

When a review comes in:

```
review text
   │
   ▼
vectorizer.transform([text])   →  number row (TF-IDF)
   │
   ▼
model.predict_proba(row)       →  [0.92, 0.08]   (negative, positive)
   │
   ▼
label = "negative", confidence = 0.92
```

### Worked example

Review: *"Camera is blurry and unfocused."*

1. Vectorizer turns it into a number row using the vocabulary it learned in training. Words like "blurry", "unfocused" (if seen in training as negative) get higher values.
2. Model outputs, say, `[0.88, 0.12]`.
3. `argmax` picks index 0 → class `"negative"`.
4. Confidence = `0.88`.
5. Return `{"label": "negative", "confidence": 0.88}`.

This is far better than the keyword method because the model learned context from thousands of examples, not a fixed word list.

---

## Level 7 — Where the model lives (and why it may be missing)

`config.py`:
```python
MODEL_PATH = PROJECT_ROOT / "models" / "sentiment_model.joblib"
VECTORIZER_PATH = PROJECT_ROOT / "models" / "sentiment_vectorizer.joblib"
```

The `models/` folder is **gitignored**. So when you clone the repo or deploy to Render, those files are NOT there. In that case `_load()` returns `None`, and `predict_sentiment` uses the **Level 2 keyword fallback**.

This means:
- Locally, if you trained the model, you get the smart model.
- On a fresh cloud deploy without the model file, you still get a working (if simpler) result via the fallback.

This is why the system "just works" even without the trained model.

---

## Level 8 — How it connects to the rest

Every review in the upload pipeline calls:

```python
result = analyze_review(text, include_similar=False)
# inside analyze_review:
overall = predict_sentiment(text)   # <- our ML step
```

So the sentiment label on each review (and therefore the positive/negative pie chart) comes from this ML function.

---

## Level 9 — Interview questions (ML)

**Q: Why TF-IDF and not word embeddings (Word2Vec/BERT)?**
A: TF-IDF is simpler, faster, needs no GPU, and is fully explainable. For a binary sentiment task on a few thousand reviews, it performs well. Embeddings would capture meaning better but add size and complexity. Good trade-off for a hackathon.

**Q: Why Logistic Regression and not a neural network?**
A: Logistic Regression is a linear model — fast to train, easy to debug, and often strong enough for sentiment with good features. A neural net would be heavier with little gain at this scale.

**Q: What is confidence?**
A: The model's probability for the chosen class. 0.92 means "92% sure it is negative".

**Q: What happens if the model file is missing?**
A: We fall back to keyword counting. The app keeps working; only accuracy drops a bit.

**Q: Is the model fair / unbiased?**
A: It learns from the training data. If the training reviews are biased, the model is too. That is a real limitation to name.

**Q: How would you improve it?**
A: (1) Train on a larger, balanced dataset. (2) Use a transformer (DistilBERT) for better context. (3) Add confidence thresholds and abstain on low-confidence cases. (4) Track precision/recall (see KIET factor #1).

---

## Level 10 — One paragraph to remember

> Our sentiment ML takes a review, converts it to numbers with TF-IDF, and classifies it as positive or negative with Logistic Regression, returning a confidence score. If the trained model file is absent (fresh deploy), it safely falls back to a simple keyword counter so the app never breaks.
