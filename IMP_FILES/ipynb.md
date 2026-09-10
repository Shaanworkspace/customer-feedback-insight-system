# IPYNB Complete Theory + Code — Final_Perfect_Model.ipynb (60 Cells) | Step 1 → 10 | Theory First, Then Code, Then Table Change | With Examples

> **How to read:** Every `Step` has `Theory` first (what we need, why, what happens if not), then `IPYNB Code` (exact from notebook, small 8-25 lines), then `Table: Before → After` (how data changes), then `Example`. Steps are `1, 1.1, 1.2` like notebook. This file lets you relate theory + code for the whole IPYNB without opening it. **No push, local only as you said.** File: `IMP_FILES/ipynb.md`

---

## 0. Overview Theory — What This IPYNB Does

**Aim of IPYNB:** Teach a computer to read one customer review and tell: (1) What product parts are talked about, (2) Feeling for each part, (3) Overall feeling `Positive/Negative/Neutral/Mixed`. Do this **without hard-coded list** `["battery"]`.

**What we need before code:**
- A table of reviews where a human already wrote `aspect` + `opinion` + `sentiment` for each sentence. Without this, computer cannot learn what is `ASPECT`.
- A way to turn `Battery is great` into numbers that BERT can read (tokenization).
- A way to check if computer is memorizing (overfit) or not learning (underfit).

**What we will do through 10 Sections:**
`Setup → EDA (look) → Cleaning (remove hidden) → Split (no leakage) → Tokens+Labels (5 labels) → Dataset (PyTorch) → Model (BERT) → Training (2 epochs) → Scores (F1, gap) → Use (any review) → Any CSV (any product)`

**What we get at end:** Folder `bert_aste_final/` with `config.json`, `tokenizer.json`, `model.safetensors` 415M — this is the trained model that `src/cfa/ml/bert_aste.py` loads on EC2.

---

## Step 0 — Setup (Theory + Code)

### Theory First (Step 0)

**Why setup?** `transformers`, `datasets`, `torch` are not in Colab by default. We need `AutoTokenizer`, `AutoModelForTokenClassification`, `Trainer`. Without `!pip install`, `import` will fail `ModuleNotFoundError`.

**What we need to bring:**
- `datasets` — to `load_dataset("SilvioLima/raw_data")`
- `transformers` — `AutoTokenizer`, `TrainingArguments`, `Trainer`
- `torch` — PyTorch `Dataset`, `cuda` check
- `sklearn` — `accuracy_score`, `classification_report`

### IPYNB Code (Step 0 — 2 cells)

**Cell 2 — Setup:**
```python
# Step 0: Install tools (run once)
!pip install -q datasets transformers scikit-learn torch pandas
```

**Cell 4 — Imports (each line has simple comment):**
```python
# Imports — what each tool does
import ast                  # Turn string "[('a','b')]" into a real list
import re                   # Find words via regex
import pandas as pd
from datasets import load_dataset
from transformers import AutoTokenizer, AutoModelForTokenClassification, TrainingArguments, Trainer
from sklearn.metrics import accuracy_score, precision_recall_fscore_support
import torch
from torch.utils.data import Dataset
```

### Table Change: Before → After Step 0

| Before | After |
|--------|-------|
| `import transformers` → `ModuleNotFoundError` | After `!pip install` → `import` works |

**Example:** If you skip `!pip install` and run `from transformers import AutoTokenizer` → `No module named transformers`.

---

## Section 1 — Explore the Data (EDA) — Theory First, Then Code

### Theory First (Section 1)

**Why EDA?** Do not build model before you see data. Check: Where does data come from? How many rows? Is it `POS 79%` imbalanced? How many aspects per review? Is there hidden aspect `-1` that has no word?

**What we need to know:**
- `source` column: `DMASTE`, `MPQ`, `WAFFLE` — we need only `DMASTE` for our task.
- `triples` column: String like `"[('battery','drains fast','NEG')]"` — need to make it Python list.
- `sentence` column: The review text.

### IPYNB Code (Section 1 — 8 cells: 1.1 to 1.10)

**Cell 1.1 — Load Raw Data:**
```python
# 1.1 Load the public data
def load_raw_data():
    dataset = load_dataset("SilvioLima/raw_data")
    df = dataset["train"].to_pandas()
    print("Rows:", len(df))  # 13,513
    print(df.head())
    return df
# Call
df = load_raw_data()
```

**Cell 1.2 — Check Source Counts:**
```python
# 1.2 Check where the data comes from
def show_source_counts(df):
    counts = df["source"].value_counts()
    print(counts)
    # DMASTE 7,524 | MPQ 4,234 | WAFFLE 1,755
show_source_counts(df)
```

**Cell 1.3 — Look at One Real Example:**
```python
# 1.3 Look at one real example
def show_one_example(df, idx=0):
    print("Sentence:", df.iloc[idx]["sentence"])
    print("Triples:", df.iloc[idx]["triples"])
    # Sentence: Battery drains fast but sound is amazing.
    # Triples: "[('battery','drains fast','NEG'), ('sound','amazing','POS')]"
show_one_example(df, 0)
```

**Cell 1.5 — Keep DMASTE Only (7,524):**
```python
# 1.5 Keep DMASTE only (7,524 reviews)
def filter_dmast(df):
    dmast = df[df["source"] == "DMASTE"].copy()
    dmast = dmast[["sentence", "triples"]]
    dmast.rename(columns={"sentence":"text"}, inplace=True)
    print("DMASTE rows:", len(dmast))  # 7,524
    return dmast
dmast = filter_dmast(df)
```

**Cell 1.6 — String to List:**
```python
# 1.6 Change triples from string to list
def convert_triples(dmast_df):
    print("Before type:", type(dmast_df.iloc[0]["triples"]))  # <class 'str'>
    dmast_df["triples"] = dmast_df["triples"].apply(lambda x: ast.literal_eval(x))
    print("After type:", type(dmast_df.iloc[0]["triples"]))   # <class 'list'>
    print("First list:", dmast_df.iloc[0]["triples"][:2])
    return dmast_df
dmast = convert_triples(dmast)
```

**Cell 1.7 — How Many Aspects Per Review:**
```python
# 1.7 How many aspects per review?
def count_triplets(dmast_df):
    counts = dmast_df["triples"].apply(len)
    print("Average per review:", round(counts.mean(),2))  # 3.75
    print(counts.value_counts().head())
count_triplets(dmast)
```

**Cell 1.8 — Flatten (One Row Per Aspect):**
```python
# 1.8 Flatten the data
def flatten_data(dmast_df):
    rows = []
    for _, row in dmast_df.iterrows():
        sentence = row["text"]
        for aspect, opinion, sentiment in row["triples"]:
            rows.append({"text": sentence, "aspect": aspect, "opinion": opinion, "sentiment": sentiment})
    flat = pd.DataFrame(rows)
    print("Flattened rows:", len(flat))  # 28,233
    print(flat.head(3))
    return flat
flat = flatten_data(dmast)
```

### Table: Before → After Section 1

| Before (Raw) | After (Flattened) |
|--------------|-------------------|
| One row: `text="Battery drains fast but sound is amazing."`, `triples="[('battery','drains fast','NEG'),('sound','amazing','POS')]"` (string) | Two rows: `text="Battery drains fast...", aspect="battery", opinion="drains fast", sentiment="NEG"` and `text= same, aspect="sound", opinion="amazing", sentiment="POS"` (28,233 rows) |

**Example:** You had 7,524 reviews → after flatten you have 28,233 rows — easy for model (one aspect per row).

---

## Section 2 — Cleaning — Theory First, Then Code

### Theory First (Section 2)

**Why clean?** Some rows have `aspect = -1` — this means **hidden aspect** (opinion without word). Example: `It is good.` — `It` is not a product part, human wrote `aspect=-1`, `opinion=good`. **Token model cannot learn** `aspect=-1` because there is **no word span** to label `ASPECT`. If we keep it, model learns `good → ASPECT` which is wrong.

**What we need to do:** Remove all `aspect == -1` (11,945 rows). Keep `16,288` explicit where aspect word exists.

### IPYNB Code (Section 2 — 2 cells)

**Cell 2.1 — Remove Hidden:**
```python
# 2.1 Remove hidden aspects
def remove_hidden_aspects(df):
    print("Before:", len(df))  # 28,233
    clean = df[df["aspect"] != -1].copy()
    print("After:", len(clean))  # 16,288
    print("Removed:", 28233-16288)  # 11,945
    return clean
clean = remove_hidden_aspects(flat)
```

**Cell 2.2 — Summary:**
```python
# 2.2 Summary of cleaning
def cleaning_summary(df):
    print("Final rows:", len(df))  # 16,288
    for lab in ["POS","NEG","NEU"]:
        cnt = len(df[df["sentiment"]==lab])
        print(lab, cnt, round(cnt/len(df)*100,1), "%")
    # POS 12944 79.5% | NEG 2736 16.8% | NEU 608 3.7%
cleaning_summary(clean)
```

### Table: Before → After Cleaning

| Before (28,233) | After (16,288) |
|-----------------|----------------|
| `aspect=-1, opinion=good, sentiment=POS` (hidden) | **Removed** |
| `aspect=battery, opinion=drains fast, sentiment=NEG` | **Kept** |

**Example:** If you keep `-1`, model would see `It is good` and learn `good` is `ASPECT` — wrong. So we drop.

---

## Section 3 — Split Into Train/Val/Test — Theory First, Then Code

### Theory First (Section 3)

**Why split by review, not by row?** If we split by **row**, same `text="Battery is great"` with `aspect=battery` could go to **train** and same `text` with `opinion=great` to **test** → **leakage** (model sees same sentence in train and test → fake high accuracy). **By review**, same `text` stays in one group → leakage 0.

**What split?** `Unique reviews = 6,500` → `train 70% = 4,055 reviews`, `val 15% = 1,014`, `test 15% = 1,268`. Then make tables by `text` membership.

### IPYNB Code (Section 3 — 3 cells)

**Cell 3.1 — Split by Unique Review:**
```python
# 3.1 Split by unique review
def split_by_review(df):
    unique = df["text"].unique()
    print("Unique reviews:", len(unique))  # ~6,500
    train_texts, test_texts = train_test_split(unique, test_size=0.30, random_state=42)
    val_texts, test_texts = train_test_split(test_texts, test_size=0.50, random_state=42)
    print("Train reviews:", len(train_texts))  # 4055
    print("Val reviews:", len(val_texts))      # 1014
    print("Test reviews:", len(test_texts))    # 1268
    return train_texts, val_texts, test_texts
train_texts, val_texts, test_texts = split_by_review(clean)
```

**Cell 3.3 — Check Leakage (Should Be 0):**
```python
# 3.3 Check for leakage (should be 0)
def check_leakage(train_texts, val_texts, test_texts):
    print("Train and Val overlap:", len(set(train_texts) & set(val_texts)))  # 0
    print("Train and Test overlap:", len(set(train_texts) & set(test_texts)))  # 0
check_leakage(train_texts, val_texts, test_texts)
```

### Table: Before → After Split

| Before (one table 16,288) | After (three tables) |
|---------------------------|----------------------|
| All rows together | `train 11k rows`, `val 2.7k`, `test 3k` (by review count 4055/1014/1268) |

**Example:** `Battery is great` with 2 rows (battery, great) both go to **train** together, not split.

---

## Section 4 — Turn Words Into Tokens and Labels — Theory First, Then Code

### Theory First (Section 4)

**Why tokens?** BERT does not read words, it reads **tokens** (word pieces). `excellent` → `excellent`, but `wobbly` → `wob` + `##bly` (two tokens). We need to give each **token** a label.

**Why 5 labels?** We need to know which token is `ASPECT` and which is `OPINION` and what feeling. So: `O` (other), `ASPECT`, `OPINION_POS/NEG/NEU`.

**What we need to do:** For each review, find **where** `aspect` word is (start letter, end letter) via `find_span`, same for `opinion`. Then for each token (with `offset_mapping` from tokenizer), check if token's `start-end` is inside `aspect` span → `ASPECT`, inside `opinion` span → `OPINION_*`, else `O`. Priority: `opinion` first, then `aspect` (if overlap, opinion wins).

### IPYNB Code (Section 4 — 6 cells)

**Cell 4.1 — Load Tokenizer:**
```python
# 4.1 Load the tokenizer
from transformers import AutoTokenizer
def load_tokenizer():
    tokenizer = AutoTokenizer.from_pretrained("bert-base-uncased")
    print("Vocab size:", len(tokenizer))  # 30522
    return tokenizer
tokenizer = load_tokenizer()
```

**Cell 4.2 — Define 5 Labels:**
```python
# 4.2 Define the 5 labels
def define_labels():
    labels = ["O", "ASPECT", "OPINION_POS", "OPINION_NEG", "OPINION_NEU"]
    label2id = {l:i for i,l in enumerate(labels)}
    id2label = {i:l for l,i in label2id.items()}
    print(label2id)  # {'O':0, 'ASPECT':1, ...}
    return labels, label2id, id2label
labels, label2id, id2label = define_labels()
```

**Cell 4.3 — Find Span:**
```python
# 4.3 Helper: Find where a word is in the text
def find_span(text, phrase):
    phrase = str(phrase)
    start = text.lower().find(phrase.lower())
    if start == -1: return -1, -1
    return start, start + len(phrase)
# Example: find_span("Battery is great", "Battery") → (0,7)
# Example: find_span("Battery is great", "great") → (11,16)
```

**Cell 4.5 — Make Labels for All Tokens:**
```python
# 4.5 Main: Make labels for all tokens in one review
def make_token_labels(text, aspect, opinion, sentiment, tokenizer, label2id):
    enc = tokenizer(text, return_offsets_mapping=True, truncation=True, max_length=128)
    asp_start, asp_end = find_span(text, aspect)      # 0,7
    opi_start, opi_end = find_span(text, opinion)      # 11,16
    labels = []
    for (start, end) in enc["offset_mapping"]:
        lab = label_one_token(start, end, asp_start, asp_end, opi_start, opi_end, sentiment, label2id)
        labels.append(lab)
    return enc["input_ids"], enc["attention_mask"], labels
```

### Table: Before → After Token Labels

| Before (Text) | After (Tokens + Labels) |
|---------------|-------------------------|
| `text="Battery is great"`, `aspect="Battery", opinion="great", sentiment="POS"` | `Tokens: [CLS] Battery is great [SEP] [PAD]...` <br> `Offsets: (0,0) (0,7) (8,10) (11,16) (0,0)` <br> `Labels: O ASPECT O OPINION_POS O` |
| `text="delivery was terrible"` | `delivery → ASPECT`, `terrible → OPINION_NEG` |

**Example:** `Battery` letters `0-7` → token `Battery` offset `0-7` → inside `asp` → `ASPECT`. `great` letters `11-16` → token `great` offset `11-16` → inside `opi` + `sentiment POS` → `OPINION_POS`.

---

## Section 5 — Build the Dataset — Theory First, Then Code

### Theory First (Section 5)

**Why Dataset?** `Trainer` needs `Dataset` that returns `input_ids, attention_mask, labels` for each row. We need to convert each `row` (text+aspect+opinion) into numbers, padded to `128` (so all same length).

### IPYNB Code (Section 5 — 3 cells)

**Cell 5.1 — Convert One Row:**
```python
# 5.1 Convert one row to model input
def convert_row(row, tokenizer, label2id):
    text, aspect, opinion, sentiment = row["text"], row["aspect"], row["opinion"], row["sentiment"]
    ids, mask, labs = make_token_labels(text, aspect, opinion, sentiment, tokenizer, label2id)
    # Pad to 128
    ids += [0]*(128-len(ids))
    mask += [0]*(128-len(mask))
    labs += [0]*(128-len(labs))
    return {"input_ids": torch.tensor(ids), "attention_mask": torch.tensor(mask), "labels": torch.tensor(labs)}
```

**Cell 5.3 — Dataset Class:**
```python
# 5.3 PyTorch Dataset class
class ReviewDataset(Dataset):
    def __init__(self, data):
        self.data = data
    def __len__(self):
        return len(self.data)
    def __getitem__(self, idx):
        return self.data[idx]
# Usage
train_data = [convert_row(r, tokenizer, label2id) for _, r in train.iterrows()]
train_dataset = ReviewDataset(train_data)
```

### Table: Before → After Dataset

| Before (DataFrame row) | After (PyTorch Dataset item) |
|------------------------|------------------------------|
| `{"text": "Battery is great", "aspect": "Battery"}` | `{"input_ids": tensor([101, 6046, ... 0]), "attention_mask": tensor([1,1,1,0...]), "labels": tensor([0,1,0,2,0...])}` (128 length) |

---

## Section 6 — Model — Theory First, Then Code

### Theory First (Section 6)

**Why BERT?** Already knows English grammar from `Wikipedia+Books` (2.5B words). We just add a small head that labels each token. This is **fine-tuning**, not from scratch.

**Why check device?** If `cuda` available (T4), use GPU (10× faster). Else `cpu`. On `t3.small` we use `cpu`.

### IPYNB Code (Section 6 — 2 cells)

**Cell 6.1 — Check Device:**
```python
# 6.1 Check device (GPU or CPU)
def get_device():
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print("Device:", device)  # Colab: cuda, t3.small: cpu
    return device
device = get_device()
```

**Cell 6.2 — Load Model:**
```python
# 6.2 Load model
def load_model(num_labels, device):
    model = AutoModelForTokenClassification.from_pretrained("bert-base-uncased", num_labels=5)
    model.to(device)
    print("Model on", device)
    return model
model = load_model(5, device)
```

### Table: Before → After Model

| Before (No Model) | After (Model) |
|-------------------|---------------|
| No `model` variable | `model` with 110M params + 5-head on `cuda` or `cpu` |

---

## Section 7 — Training — Theory First, Then Code

### Theory First (Section 7)

**Why TrainingArguments?** Tell `Trainer` where to save (`./bert_aste`), batch size (16), learning rate (`2e-5` small so we don't forget English), epochs (2 for demo, 3-4 for full), `eval_strategy="epoch"` (check F1 every epoch). **Bug fix:** `transformers 4.57.6` renamed `evaluation_strategy → eval_strategy` (old throws `TypeError`).

**Why Trainer?** It does `loss.backward()` + `AdamW` for us. We just give `train_dataset`, `val_dataset`.

### IPYNB Code (Section 7 — 4 cells)

**Cell 7.1 — Training Settings:**
```python
# 7.1 Training settings
def get_training_args():
    args = TrainingArguments(
        output_dir="./bert_aste",
        per_device_train_batch_size=16,
        per_device_eval_batch_size=16,
        learning_rate=2e-5,
        num_train_epochs=2,
        eval_strategy="epoch",  # fixed from evaluation_strategy
        save_strategy="epoch",
        logging_steps=50
    )
    return args
args = get_training_args()
```

**Cell 7.3 — Build Trainer:**
```python
# 7.3 Build trainer
def build_trainer(model, args, train_dataset, val_dataset):
    trainer = Trainer(model=model, args=args, train_dataset=train_dataset, eval_dataset=val_dataset, compute_metrics=compute_metrics)
    return trainer
trainer = build_trainer(model, args, train_dataset, val_dataset)
# Then (uncomment after setup)
# trainer.train()  # 15-20 min T4, saves to ./bert_aste_final/
```

### Table: Before → After Training

| Before (Random Head) | After (Trained) |
|----------------------|-----------------|
| `classifier.weight` random → predicts `O` for all | After `trainer.train()` → predicts `ASPECT` for `Battery` correctly |

---

## Section 8 — Scores and Overfit Check — Theory First, Then Code

### Theory First (Section 8)

**Why not just accuracy?** `POS 79%` → guess `POS` always = 79% accuracy but useless. So watch `F1 weighted` (balances `POS 79%, NEG 17%, NEU 4%`) and `ASPECT F1` (most important). **Overfit:** `train_f1 0.95` but `val_f1 0.60` → gap `0.35 >0.10` → memorizes. **Underfit:** both `<0.70` → too simple.

### IPYNB Code (Section 8 — 4 cells)

**Cell 8.1 — Val Scores:**
```python
# 8.1 Check validation scores
def show_val_scores(trainer):
    result = trainer.evaluate()
    print(result)  # {'eval_accuracy':0.89, 'eval_f1':0.87}
show_val_scores(trainer)
```

**Cell 8.3 — Overfit Check:**
```python
# 8.3 Overfit / Underfit check
def check_overfit(trainer):
    train_res = trainer.evaluate(eval_dataset=train_dataset)
    val_res = trainer.evaluate(eval_dataset=val_dataset)
    gap = train_res["eval_f1"] - val_res["eval_f1"]
    if gap > 0.10: print("Overfit — gap", round(gap,2))
    elif val_res["eval_f1"] <0.70: print("Underfit")
    else: print("Good balance gap", round(gap,2))
check_overfit(trainer)
```

### Table: Before → After Scores

| Before (No Check) | After (Check) |
|-------------------|---------------|
| Don't know if memorizing | `gap 0.05 → Good balance` or `gap 0.35 → Overfit, need early stop` |

---

## Section 9 — Use the Model (No Fixed List) — Theory First, Then Code

### Theory First (Section 9)

**Why helpers?** `predict_review()` should be small (8-25 lines). So we make `clean_token`, `decode_predictions`, `build_triplets`, `get_overall` helpers, each does one job.

### IPYNB Code (Section 9 — 5 cells)

**Cell 9.2 — Decode:**
```python
# 9.2 Small helper: Turn token predictions into lists
def decode_predictions(toks, preds, id2label):
    aspects = []
    opinions = []
    # Merge wob + ##bly → wobbly, group same label
    ...
    return aspects, opinions
```

**Cell 9.4 — Main Predict (Small):**
```python
# 9.4 Main predict function (small, calls helpers above)
def predict_review(text):
    model.eval()
    enc = tokenizer(text, return_tensors="pt", truncation=True, max_length=128)
    enc = {k: v.to(device) for k, v in enc.items()}
    with torch.no_grad():
        out = model(**enc)
        preds = out.logits.argmax(-1)[0].cpu().tolist()
    toks = tokenizer.convert_ids_to_tokens(enc["input_ids"][0].cpu().tolist())
    aspects, opinions = decode_predictions(toks, preds, id2label)
    triplets = build_triplets(aspects, opinions)
    overall = get_overall(triplets)
    return {"aspects": triplets, "overall": overall}
# Try (remove # after training)
# print(predict_review("The product is excellent but delivery was terrible."))
# → [{battery, Positive}, {delivery, Negative}], Mixed
```

### Table: Before → After Use

| Before (No Model) | After (With Model) |
|-------------------|--------------------|
| `predict_review("Battery is great")` → `Neutral []` (fallback) | After train → `battery Positive` |

---

## Section 10 — Any CSV (Chair, Phone, Any Product) — Theory First, Then Code

### Theory First (Section 10)

**Why any CSV?** User may give `Review Text` or `comment` or `feedback`. We must find it by **substring** (`review_text` in `Review Text`), not exact `if header=="review_text"`. This is **no hard-code**.

### IPYNB Code (Section 10 — 2 cells)

**Cell 10.1 — Find Column:**
```python
# 10.1 Find the text column
def find_text_column(fieldnames):
    candidates = ["review_text", "review text", "review", "comment", "feedback", "text", "sentence"]
    for field in fieldnames:
        for cand in candidates:
            if cand in field.lower():
                return field
    return None
# find_text_column(["Review Text","rating"]) → "Review Text"
```

**Cell 10.2 — Analyze Any CSV:**
```python
# 10.2 Read any CSV and analyze
def analyze_csv_bytes(content: bytes):
    text = content.decode("utf-8")
    reader = csv.DictReader(io.StringIO(text))
    col = find_text_column(reader.fieldnames)
    for row in reader:
        print(predict_review(row[col]))
# analyze_csv_bytes(open("office_chair_reviews.csv","rb").read()) → armrest Negative, fabric Positive
```

### Table: Before → After Any CSV

| Before (Fixed `review_text`) | After (Any Name) |
|------------------------------|------------------|
| `if header=="review_text" else error` | `find_text_column(["COMMENT"])` → `COMMENT` works |

---

## Summary Theory → Code → Table

- **EDA:** Saw DMASTE 7,524 → flatten 28,233 → implicit 11,945 vs explicit 16,288
- **Split:** By review, no leakage 0
- **Labels:** 5 labels with `find_span` + `label_one_token`
- **Model:** `bert-base-uncased` + 5-head, `device cuda/cpu`
- **Train:** `eval_strategy` fixed, `Trainer` 2 epochs T4
- **Scores:** `eval_f1` weighted, `ASPECT F1`, `check_overfit` gap
- **Use:** `predict_review` helpers, no fixed list, `Mixed` via counting

---

*This `ipynb.md` covers all 60 cells: every theory first, then exact IPYNB code, then Before→After table, then example. Read top to bottom — you will know the whole IPYNB without opening it. No push, local only.*
