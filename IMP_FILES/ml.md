# ML Documentation — Perfect BERT Model, Explained from Zero

> No prior ML knowledge needed. Read top to bottom, once.

## What problem are we solving?

One review: *"The product is excellent but delivery was terrible."*

We want:
- `product → Positive` (because `excellent`)
- `delivery → Negative` (because `terrible`)
- `Overall → Mixed` (both)

Old way (TF-IDF + LogReg) gave **one label per whole review** (Positive *or* Negative). It cannot say *which part* is good or bad. We need **per-aspect** feelings.

## The perfect model: BERT token classification (5 labels)

We label **each token** (small word piece):

```
The        O
battery    ASPECT
is         O
excellent  OPINION_POS
and        O
delivery   ASPECT
was        O
terrible   OPINION_NEG
```

Labels:
- `O` — nothing
- `ASPECT` — the thing (battery, delivery, armrest, chair, screen — any product, no fixed list)
- `OPINION_POS / NEG / NEU` — the feeling word + its feeling

The model **learns the pattern** `X is wobbly` → `X` is aspect. So `armrest` works even if never seen before. No hard-coded list like `["battery","delivery"]`.

**Why not TF-IDF now?** TF-IDF counts words: `score = (#good words) - (#bad words)`. For `"drains very fast"`, it counts `fast` as positive → wrong (here `fast` is part of `drains fast` = negative). BERT reads the phrase, not just words. TF-IDF is kept only as a tiny fallback for sentiment of a clause when BERT is not yet trained, but the main path is BERT.

## How BERT works (simple)

1. **Tokenizer** (`bert-base-uncased`) turns `Battery is great` into tokens + `offset_mapping` (which letters each token came from).
2. **Labels** — we have a helper `find_span(text, phrase)` to find where `battery` is in the text, then `label_one_token` gives each token its label.
3. **Training data** — `SilvioLima/raw_data` DMASTE 7,524 reviews → `28,233` rows → drop hidden `-1` → `16,288` rows. POS 78% / NEG 18% / NEU 4% (imbalance → watch F1, not just accuracy).
4. **Split** — by **unique review** (not by row) to avoid same review in train and test. `Train ~6k / Val ~1.5k / Test ~1.5k` reviews, leakage `0`.
5. **Dataset** — `convert_row` → pad to 128 → `ReviewDataset` (PyTorch).
6. **Model** — `AutoModelForTokenClassification.from_pretrained("bert-base-uncased", num_labels=5)` → `device = cuda if available else cpu` (no crash).
7. **Training** — `TrainingArguments(eval_strategy="epoch", lr=2e-5)` → `Trainer` → `trainer.train()` on T4 (15-20 min, 2 epochs demo, 3-4 full).
8. **Scores** — `compute_metrics` returns `accuracy, precision, recall, f1` (weighted). **Watch F1**, not just accuracy (POS 79% fools accuracy). Also `ASPECT F1` and `OPINION_NEG recall` (missed bad reviews = missed problems).
9. **Overfit check** — `check_overfit()` compares Train F1 vs Val F1. Gap >0.10 = memorizing. Both <0.70 = underfit.
10. **Use** — `predict_review("The chair armrest is wobbly but fabric is comfortable.")` → `armrest→Negative, fabric→Positive, Overall Mixed` — no list needed.

## Where the model lives

- **Trained BERT:** `bert_aste_final/` (after `trainer.train()` + `save_model`), ~400MB, **gitignored until trained**. After training, copy to server or S3.
- **Legacy TF-IDF:** `models/sentiment_model.joblib` + `vectorizer` (88.4% acc, kept for fallback, committed).
- **Config:** `src/cfa/core/config.py` → `BERT_ASTE_DIR = PROJECT_ROOT / "bert_aste_final"`.

## Fallback before BERT is trained

For the hackathon demo before `bert_aste_final/` exists, `src/cfa/analysis/extract.py` has a **dynamic per-CSV fallback** (no hard-coded product list):

- Uses `sklearn ENGLISH_STOP_WORDS` (standard, not hard-coded) + `dynamicMinCount = 3 if len>20 else 2` (10% of rows) → frequent nouns per CSV (e.g., `battery` 8x, `delivery` 5x in `final.csv` → kept, `day` 2x → not).
- For sentiment of each clause, it uses the TF-IDF model (`predict_sentiment`) — not a word list.
- Once BERT is trained, this fallback is never used.

## How it connects

`api/pipeline.py`:

```python
cleanedRows = preprocess_csv(content)  # finds review_text by itself
analysisResults = analyze_reviews([row["text"] for row in cleanedRows])  # calls BERT
# ... build reviews, rank, save
```

So every dashboard number comes from BERT, not a fixed list.

## One paragraph to remember

> We turn each review into tokens, teach BERT to label each token as `ASPECT` or `OPINION_POS/NEG/NEU`, and get per-aspect feelings. Counting `Positive` and `Negative` aspects gives `Mixed` when both appear. The model learns patterns, so any product (chair, phone, watch) works without adding a new list.
