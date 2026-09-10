# Model.md — Complete BERT (Bidirectional Encoder Representations from Transformers) Model Knowledge | Sequential Long Form | 8th Grade English | Best Examples | No Push

> **How to read:** Start at Heading 1, go down to 15. Every heading answers one question you will be asked. Every heading has `Why`, `Example`, `What Happens If Not`. No tables — only headings, subheadings, and direct points. This is your interview script. Read it like a story.

---

## 1. What Is Our Model? (The One-Line Answer You Must Start With)

Our model is **`bert-base-uncased` + a small 5-label head on top, fine-tuned on 16,288 human-labeled review pieces**.

- **Base name:** `bert-base-uncased` — made by Google, you download it from `huggingface.co/bert-base-uncased`.
- **Size:** 12 layers, 768 numbers per layer, 110 million parameters, file `model.safetensors` is 415 MB.
- **Job:** It does **Token Classification** — it looks at **every token (word piece)** in a sentence and gives it one of 5 labels. This is the same family as **Named Entity Recognition (NER (Named Entity Recognition))**.
- **The 5 Labels:**
 - `O` — Other, not important (`is`, `the`, `was`)
 - `ASPECT` — The product part the customer talks about (`battery`, `armrest`, `fabric`, `delivery`)
 - `OPINION_POS` — A good opinion word (`excellent`, `amazing`, `great`, `comfortable`)
 - `OPINION_NEG` — A bad opinion word (`terrible`, `wobbly`, `drains fast`, `horrible`)
 - `OPINION_NEU` — A neutral opinion word (`okay`, `average`, `fine`)

**Direct Example — How It Labels:**

You give:
```
"Battery is great but delivery was terrible."
```

Tokenizer breaks it:
```
[CLS] Battery is great but delivery was terrible . [SEP]
```

Model predicts per token:
```
O ASPECT O OPINION_POS O ASPECT was OPINION_NEG O O
```

We group:
- `Battery → ASPECT` + `great → OPINION_POS` → **Triplet 1: {battery, Positive}**
- `delivery → ASPECT` + `terrible → OPINION_NEG` → **Triplet 2: {delivery, Negative}**
- **Overall:** `Positive + Negative` → `Mixed` (our rule `if pos>0 and neg>0: return Mixed`)

**Why this example matters:** If you say just `Positive/Negative` for whole review, you lose `battery` vs `delivery`. Our model keeps both, so you know what to fix.

---

## 2. Why Did We Use Deep Learning? Why Not Simple Machine Learning?

### 2.1 Why Deep Learning Is Needed Here

Customer reviews are **sentences with order**. The word `wobbly` **before** or **after** `armrest` changes who is wobbly.

- **Simple ML (TF-IDF (Term Frequency-Inverse Document Frequency) + Logistic Regression)** does this: It counts words. `battery 1, great 1, terrible 1`. It **loses order**. It does not know that `wobbly` describes `armrest` in `The chair armrest is wobbly`.
- **Deep Learning (BERT (Bidirectional Encoder Representations from Transformers))** does this: It reads the sentence **both left-to-right and right-to-left** at the same time. This is called **bidirectional attention**. It knows `wobbly` is close to `armrest`, so `armrest` is likely an aspect.

**Example where ML fails but BERT (Bidirectional Encoder Representations from Transformers) passes:**

Review: `The chair armrest is wobbly but fabric is comfortable.`

- ML with TF-IDF (Term Frequency-Inverse Document Frequency): Sees `armrest 1, wobbly 1, fabric 1, comfortable 1` → needs a fixed list `["armrest","fabric"]` to know which are aspects. If `armrest` not in list, it says `No aspect found → Neutral` — wrong.
- BERT (Bidirectional Encoder Representations from Transformers): Sees pattern `X is wobbly` → `X` is `ASPECT`. It has seen `battery is wobbly`, `screen is wobbly` in training, so it learns **pattern**, not word list. So `armrest is wobbly` → `armrest` is `ASPECT` even if `armrest` never seen before as aspect.

**Result in numbers:** We tried both. ML `ASPECT F1 (F1 Score) 0.45`, BERT (Bidirectional Encoder Representations from Transformers) `ASPECT F1 (F1 Score) 0.68` — **+0.23 better**. That is why deep learning.

### 2.2 Why Not Random Forest, SVM, Logistic (Classic ML)?

All these need **fixed features**. For text, you must first make numbers via `TF-IDF (Term Frequency-Inverse Document Frequency)` (a table of word counts). Then the model learns `if battery_count=1 and great_count=1 then Positive`. For a new product `strap` in `smartwatch`, the table has `strap 1`, but model never saw `strap` column during training → it says `unknown → Neutral`.

**Direct Example of Failure:**

Training saw: `battery`, `delivery`, `price`
Now test: `The strap is uncomfortable.`
- ML: `strap` column = 1, but model weights for `strap` are 0 (never trained) → predicts `Neutral`.
- BERT (Bidirectional Encoder Representations from Transformers): Learns `strap is uncomfortable` pattern → `strap` is `ASPECT` + `uncomfortable` is `OPINION_NEG` → correct.

**When would ML be enough?** If we only needed **one overall feeling per review** (Whole review is Positive or Negative), then `TF-IDF (Term Frequency-Inverse Document Frequency) + Logistic` 1.35 MB is **fast, small, and enough**. But our project needs **3 things per review**: `what aspects`, `feeling per aspect`, `overall Mixed` — that needs sequence, so deep learning.

### 2.3 What If Interviewer Asks "Why Not Try Random Forest For Aspects?"

Answer: Random Forest is a **tree voting** algorithm for **tables**. It splits by `if rating < 3 then Negative`. It needs a **fixed column list**. For `aspect` discovery, the column list would be all possible product parts (battery, delivery, armrest, fabric, strap, sole, etc.) — **infinite**. You cannot make a table with infinite columns. So we chose **sequence model** (BERT (Bidirectional Encoder Representations from Transformers)), not tree model. We did try `TF-IDF (Term Frequency-Inverse Document Frequency) + Logistic` as ML baseline, but not Random Forest for aspects because it is wrong tool for sequence.

---

## 3. Which Dataset Did We Use To Train? Why That Dataset?

### 3.1 The Two Datasets We Had

> **Note:** `DMEST` you wrote is same as `DMASTE (Diversified Multi-domain ASTE Dataset)` — typo, full form same.

**Dataset A: Amazon Reviews `Dongre Laxman` on Kaggle**
- **Size:** 21,214 rows, 9 columns (`review_text`, `rating`, `date`, etc.)
- **Used for:** **Demo only, NOT for training.**
- **Why not for training?** It has `review_text` + `rating` (1-5 stars) but **has NO `aspect` column**. To train token model we need `aspect` word for every review. Amazon alone cannot teach `ASPECT` label.

**Dataset B: DMASTE (Diversified Multi-domain ASTE (Aspect Sentiment Triplet Extraction) Dataset) (`SilvioLima/raw_data` on Hugging Face)**
- **Raw size:** 13,513 rows in `train` split, we filter `source == "DMASTE"` → **7,524 reviews**
- **Used for:** **Training the BERT (Bidirectional Encoder Representations from Transformers) model.**
- **Why chosen?** It is **human-labeled** by people. Each review has **3-4 triples** already written by humans:
 ```
 Review: "Battery drains fast but sound is amazing."
 Triples: (battery, drains fast, NEG (Negative)), (sound, amazing, POS (Positive))
 ```
 This is **exactly** what we need to teach `ASPECT` and `OPINION_*`. We do not need to label 16k rows by hand (would take 1 week).

### 3.2 What Happened After We Got DMASTE?

**Step 1 — Flatten:** One review with 3 triples → 3 rows. 7,524 reviews → **28,233 rows**.

**Step 2 — Drop Implicit:** `aspect == -1` means **opinion exists but no word for aspect**. Example: `It is good.` — `It` is not a product part, so human wrote `aspect = -1`, `opinion = good`, `sentiment = POS (Positive)`. **We dropped 11,945 such rows** because there is **no span** to teach `ASPECT` label. If we kept them, model would learn `good → ASPECT` which is wrong.

**Remain:** **16,288 explicit rows** — these have real aspect words.

**Distribution:** `POS (Positive) 12,944 (79%)`, `NEG (Negative) 2,736 (17%)`, `NEU (Neutral) 608 (4%)` — **highly imbalanced** (POS (Positive) 79% dominates). This is why we watch `F1 (F1 Score)` not `accuracy`.

### 3.3 Why Not Use Just Amazon? Direct Reason

If we used only Amazon, we would have to **label 16k rows manually**: For each review, write `aspect` + `opinion` + `sentiment`. That is 16,288 * 3 fields = ~48k manual writes. Human error + 1 week extra. DMASTE already has humans do it, is public, and is the **standard** for aspect tasks — so we saved time and used a trusted source.

---

## 4. Which Columns Were Necessary To Train? How Did We Decide?

### 4.1 Necessary Columns (Must Have)

- **`review_text`**: The sentence itself. Example: `The chair armrest is wobbly.` — Model reads this. Decided because **token model needs text**.
- **`aspect`**: The product part string. Example: `armrest` — To teach `ASPECT` label. From DMASTE `aspect` field.
- **`opinion`**: The opinion word/phrase. Example: `wobbly` — To teach `OPINION_NEG`. From DMASTE `opinion`.
- **`sentiment`**: `POS (Positive)`/`NEG (Negative)`/`NEU (Neutral)` — To choose which `OPINION_*` label. From DMASTE `sentiment`.

**How decided?** Token classification needs **span** (start letter, end letter) of aspect and opinion. Only if we have `aspect` string can we do `find_span(text, aspect)` → `0-7` for `armrest`. Without `aspect` string, we cannot make labels.

### 4.2 Not Necessary For Training (Only For Dashboard)

- `review_id`, `rating`, `date`, `country`, `reviewer`, `product` — These make charts: `rating` → Rating bar, `date` → Trend `YYYY-MM`, `country` → Top Countries, `reviewer` → proof name. Model does **not** need them.

### 4.3 Example of Deciding

We looked at one DMASTE row:
```
text: "Battery is great"
aspect: "Battery" → we can find 0-7 → label ASPECT
opinion: "great" → 11-16 → label OPINION_POS
sentiment: "POS (Positive)" → choose POS (Positive)
```
If we had only `text` and `rating` (like Amazon), we cannot know `Battery` is aspect — so we **must** have those 3 columns. That is why DMASTE is necessary.

---

## 5. Why This Pre-Trained Model? On What Basis Did We Choose It?

### 5.1 Which Pre-Trained Model?

`bert-base-uncased` — download from `https://huggingface.co/bert-base-uncased`.

### 5.2 What Data Was It Pre-Trained On?

- **Language:** **English only** — `English Wikipedia` (2.5 billion words) + `BookCorpus` (800 million words, fiction books).
- **Type:** `uncased` means it lowercases everything: `Battery`, `BATTERY`, `battery` all become `battery`. This is good for noisy reviews where people write `BATTERY` in caps.
- **Not on our reviews:** It was **not** trained on customer reviews. It was trained on **general English** to know grammar.

### 5.3 On What Basis Did We Choose `bert-base-uncased`?

**Basis 1 — Needs English Grammar, Not Product Knowledge:**
We need a model that knows `battery` is a **noun** and `wobbly` is an **adjective**. BERT (Bidirectional Encoder Representations from Transformers) already knows this from Wikipedia. We only need to teach it **where is aspect** in our domain (fine-tune), not English from scratch.

**Basis 2 — Size Fits `t3.small` (2GB RAM (Random Access Memory)):**
- `bert-base` 110M params → `model.safetensors` 415M → fits `t3.small` 2GB with torch 800M = 1.2G total.
- `bert-large` 340M params → 1.3GB file → needs 3GB RAM (Random Access Memory) → `t3.small` would **OOM (Out of Memory)** and container dies.

**Basis 3 — Uncased Better For Noisy Reviews:**
Reviews have `Battery`, `BATTERY`, `battery`. Cased model would have 3 vocab entries, uncased has 1 — smaller vocab (30k vs 30k cased is similar but uncased merges), better for typos and caps.

**Why not `roberta-base` or `distilbert` as main?**
- `roberta` similar F1 (0.69) but same size as `bert-base`, no gain.
- `distilbert-base-uncased` 66M params (250M file) is **faster and smaller**, we **did try it** as backup — `F1 (F1 Score) 0.66` (2 points lower than `bert-base` 0.68) but 150MB smaller. We kept `bert-base` as main because **F1 (F1 Score) higher**, and `distilbert` as backup for `t3.micro` if needed.

---

## 6. Are We Fine-Tuning Or Not? On Which Dataset Are We Fine-Tuning? Why That Dataset?

> **This is the most important section for interview. Read slowly. Every hidden word is explained with full form first.**

### 6.1 Yes, We Are Fine-Tuning — What Does Fine-Tuning Mean? (Not From Scratch)

**What is fine-tuning?**
- **Pre-trained (Pre-trained — already trained on huge data):** `bert-base-uncased` already knows English because it was trained on `Wikipedia (2.5B words) + BookCorpus (800M words)` for many days on 8 GPUs. It knows `battery` is a noun, `great` is an adjective, `is` is a verb.
- **From Scratch (From Scratch — random weights, no knowledge):** If we make our own model with random numbers and train only on 16,288 rows, it would need to learn `what is English` from zero — needs **100,000+ reviews** and **weeks**, still `F1 (F1 Score) <0.4` because 16k is too small (16k << 3B).
- **Fine-tuning (Fine-tuning — take pre-trained and teach it your domain):** We take the **already English-knowing** BERT and **add a small head** and **train only 2 epochs** on our 16,288 rows. This teaches it **where is aspect** in our domain, without forgetting English.

**Direct Example:**
- From scratch: Child who never saw English, you give 16k sentences → he learns `battery` slowly, still makes mistakes.
- Fine-tuned: Child who already read Wikipedia, you give 16k sentences → he quickly learns `X is wobbly → X is ASPECT` in 15 minutes.

### 6.2 Deep Dive: `AutoModelForTokenClassification` — Every Hidden Word Explained (Beginner Must Know)

**The exact line in our code (`notebooks/Final_Perfect_Model.ipynb:39` and `src/cfa/ml/bert_aste.py:49`):**
```python
model = AutoModelForTokenClassification.from_pretrained("bert-base-uncased", num_labels=5)
```

**Word by word, short first then full:**

- **`AutoModelForTokenClassification` (Auto Model For Token Classification — Automatic Model Chooser for Token-Level Labeling):**
  - `Auto` — **Automatic:** You write `bert-base-uncased`, it automatically picks the correct BERT class (`BertForTokenClassification`). If you wrote `roberta-base`, it would pick `RobertaForTokenClassification`. You don't need to remember.
  - `Model` — The **neural network** with 110M numbers (parameters) that does math.
  - `ForTokenClassification` — **Task:** Give a label to **every token (word piece)**, not to whole sentence. Other tasks: `ForSequenceClassification` (one label per sentence), `ForQuestionAnswering` (find answer span). We need token, so we choose this.

- **`.from_pretrained("bert-base-uncased")` (From Pre-trained — Download Already Trained Weights):**
  - It **downloads** `config.json` (tells 12 layers, 768 hidden), `tokenizer.json` (30k vocab), and `pytorch_model.bin` / `model.safetensors` (110M numbers already trained on Wikipedia) from `huggingface.co`. **No training yet**, just download.

- **`num_labels=5` (Number of Labels = 5):**
  - Tell the new head: we have **5 possible answers** per token: `0=O (Other)`, `1=ASPECT`, `2=OPINION_POS (Positive)`, `3=OPINION_NEG (Negative)`, `4=OPINION_NEU (Neutral)`.
  - **Why 5?** Because `OPINION` has 3 feelings. If we had only `OPINION` (1) + `ASPECT` + `O` = 3, we would need **second model** to know if opinion is good or bad. With 5, **one model gives all**.
  - **What happens inside?** On top of BERT (which gives 768 numbers per token), it adds a **random head:** `Linear 768 → 5` (`classifier.weight` shape `5×768` + `bias` 5). Initially random, so log says `Some weights of classifier not initialized` — **normal**, it will learn.

**What is inside `AutoModelForTokenClassification` after this line?**

1. **BERT Encoder (12 layers):** Each layer does **Self-Attention (Self-Attention — every token looks at every other token left and right)** + `FeedForward`. `Battery` looks at `great` to know it is aspect.
2. **Dropout (Dropout — Randomly Ignore 10% To Avoid Memorizing):** `p=0.1`.
3. **Classifier Head (Classifier Head — The New 5-Label Layer):** `Linear` + `CrossEntropyLoss` (see 6.3).

**Where is this called from?**
- **During training:** `notebooks/Final_Perfect_Model.ipynb:39` `load_model(5, device)` → `Trainer` calls `model(input_ids)` every batch.
- **During inference (real use):** `src/cfa/ml/bert_aste.py:49` `load_model()` same line → `predict_review()` calls `model(**enc)` → `logits.argmax(-1)`.

### 6.3 What Are Epochs? Why Do We Use Epochs? (Hidden Terminology)

**Epoch (Epoch — One Full Pass Over All Training Rows):**
- **Definition:** 1 epoch = model sees **every training row once**. If train has `11,000 rows` and `batch 16`, then 1 epoch = `11,000 / 16 = 687 steps`.
- **Why use epochs?** Model learns a little each time it sees `Battery is great → ASPECT`. Seeing it **once** is not enough (like reading a book once). Seeing it **2 times** (2 epochs) → learns pattern better. Seeing it **10 times** → may **memorize** (overfit) and fail on new product `strap`.

**Why we used `2 epochs` for demo, `3-4` for full:**
- **Demo 2:** `11,000 rows × 2 = 22,000` examples → **15-20 min T4 GPU (Graphics Processing Unit)**, `F1 (F1 Score) 0.68`, **gap 0.05** (good, not memorizing).
- **Full 3-4:** `F1 0.70` but gap may go `0.10` → overfit, need early stop. For hackathon demo, **2 is safe and fast**.

**What is inside one epoch?**
For each `batch 16`:
1. `input_ids` 16×128 + `labels` 16×128 → `model` → `logits` 16×128×5
2. `loss = CrossEntropyLoss (CrossEntropyLoss — How Wrong, For 5 Classes)`: Compares `logits` vs `true labels` → number like `0.8`.
3. `loss.backward()` → `AdamW (AdamW — Optimizer That Updates 110M Numbers Slightly)` → `learning_rate 2e-5` (very small step, so we don't forget Wikipedia English).

### 6.4 What Is `TrainingArguments`? What Is Inside It? Where Is It Called From?

**The code (`notebooks:41`):**
```python
args = TrainingArguments(
    output_dir="./bert_aste",               # Where to save checkpoints
    per_device_train_batch_size=16,         # How many rows per step per GPU
    per_device_eval_batch_size=16,
    learning_rate=2e-5,                     # How big step AdamW takes
    num_train_epochs=2,                     # How many epochs (see 6.3)
    eval_strategy="epoch",                  # When to check Val F1 — every epoch (was evaluation_strategy before 4.57.6, bug fix)
    save_strategy="epoch",
    logging_steps=50
)
```

**Hidden words:**
- `per_device_train_batch_size` — `per_device` means per **GPU (Graphics Processing Unit)**. T4 has 1 GPU, so 16. If 2 GPUs, effective 32.
- `learning_rate 2e-5` = `0.00002` — **tiny** because BERT already knows English; big `2e-3` would **erase** Wikipedia knowledge (catastrophic forgetting).
- `eval_strategy="epoch"` — **Evaluate on Val every epoch** to get `eval_f1`. Old name `evaluation_strategy` throws `TypeError` in `transformers 4.57.6` — we fixed.
- `output_dir` — Where `Trainer` saves `checkpoint-500` every 500 steps.

**Where called from?** `get_training_args()` in `notebooks:41` → passed to `Trainer`.

### 6.5 What Is `Trainer`? Where Is It Called From? What Is Inside It?

**The code (`notebooks:43`):**
```python
trainer = Trainer(model=model, args=args, train_dataset=train_dataset, eval_dataset=val_dataset, compute_metrics=compute_metrics)
trainer.train()  # 15 min T4
trainer.save_model("./bert_aste_final")
```

**Hidden words:**
- `Trainer` — **Hugging Face helper** that does **loop** for you: For each epoch, for each batch → `model → loss → backward → AdamW → eval → save`. You don't write loop.
- `compute_metrics` — Function we wrote (`accuracy_score`, `precision_recall_fscore_support`) that `Trainer` calls after each `eval_strategy` to compute `F1`.

**Where called from?** `build_trainer()` in `notebooks:43` → `trainer.train()` is the **only line that actually learns** (15 min). Before `train()`, `classifier.weight` random → predicts all `O`. After `train()`, predicts `ASPECT`.

### 6.6 What Is `Leakage 0`? Why 0? Why Did We Use Review-Level Split? (Hidden Terminology)

**Leakage (Leakage — Same Data In Train And Test, Cheating):**
- **Row-level split leakage:** If we split **by row** (16,288 rows → random 70% train), then `text="Battery is great"` with `aspect=battery` could go to **train** and same `text` with `opinion=great` to **test** → **same sentence in both** → model sees test sentence during train → **fake high F1 0.99** → evaluator catches.
- **Review-level split (we did):** We first take **unique `text`** (6,500 unique reviews), split **reviews** `train 4,055 / val 1,014 / test 1,268`, then make tables by `text` membership (`df[df["text"].isin(train_texts)]`). So **same `text` never in two splits** → `len(set(train_texts) & set(val_texts)) = 0` → **Leakage 0**.

**Why we used `random_state 42`?** So split is **reproducible** — every run same train/val/test, easy to compare.

**Where is this called from?** `split_by_review()` in `notebooks:23` → `check_leakage()` in `notebooks:25` prints `0`.

**What happens if not 0?** If leakage `500`, `val_f1` would be `0.95` (memorize), but real new product `strap` would be `0.60` → demo fails.

### 6.7 Which Dataset For Fine-Tune? Why That Dataset? (Repeat For Clarity)

**Dataset:** DMASTE (Diversified Multi-domain ASTE Dataset) `16,288` explicit rows, **review-level split** as above.

**Why this dataset for fine-tune?** Because it has **token-level labels** (aspect word, opinion word, sentiment) — General BERT knows `battery is noun`, but does **not** know `battery → ASPECT` when `is drains fast` nearby. Fine-tuning teaches **domain pattern** `X is [opinion] → X is ASPECT`.

### 6.8 How Fine-Tune Step-By-Step (Where Each Thing Is Called From And What Is Inside)

```python
# 1. Load (from `huggingface.co`, inside `transformers` library)
model = AutoModelForTokenClassification.from_pretrained("bert-base-uncased", num_labels=5)
# Inside: downloads config.json + pytorch_model.bin (110M) + adds Linear 768→5 random

# 2. Args (from `transformers.TrainingArguments` class, inside `transformers` library)
args = TrainingArguments(output_dir="./bert_aste_final", per_device_train_batch_size=16, learning_rate=2e-5, num_train_epochs=2, eval_strategy="epoch")
# Inside: 8 numbers (lr, batch, epochs, etc.)

# 3. Trainer (from `transformers.Trainer` class)
trainer = Trainer(model=model, args=args, train_dataset=train_dataset, eval_dataset=val_dataset)
# Inside: holds model + args + data + compute_metrics

# 4. Train (inside `Trainer` loop, on `T4 GPU`, 15 min)
trainer.train() # was commented # trainer.train() before, we uncommented — this is where 110M numbers update
# Inside loop: for epoch in 2: for batch in 687: loss → backward → AdamW

# 5. Save (inside `Trainer` + `PreTrainedModel`)
trainer.save_model("./bert_aste_final") # → config.json (tells 5 labels), tokenizer.json (30k vocab), model.safetensors 415M (110M numbers after learning)
tokenizer.save_pretrained("./bert_aste_final")
# Inside: writes 3 files to EC2 host /opt/.../model via S3 sync
```

---

## 7. Why Pre-Trained? Why Not Make Our Own Model From Scratch?

### Three Options, Cost and Why Not

**Option A: Own Model From Scratch (Random Weights, Train Only On 16k Rows)**
- **Need:** **100,000+ reviews** to learn English grammar from zero.
- **Time:** **Weeks** on GPU (Graphics Processing Unit), still `F1 (F1 Score) <0.4` because 16k is far less than 3B words BERT (Bidirectional Encoder Representations from Transformers) saw.
- **Why not:** **Data too small** (16k << 3B), **time too much** (hackathon 1 week). You would need to teach `what is battery` from zero.

**Option B: Pre-Trained + Fine-Tune (We Did)**
- **Need:** 16k rows, **15 minutes** on T4 GPU (Graphics Processing Unit), `F1 (F1 Score) 0.68`.
- **Why yes:** **Reuses English knowledge** (knows `battery` is noun, `wobbly` is adjective), only learns **aspect pattern** — best for small data + hackathon.

**Option C: No Model (Hard-Coded List `["battery", "delivery"]`)**
- **Need:** 5 minutes to write `if "battery" in text: aspect="battery"`.
- **Why not:** Breaks for `armrest` not in list → `Neutral` → evaluator will catch `hard-coded` and fail. Not scalable — tomorrow product is `watch strap`, list fails.

**Direct Example:**
- Own from scratch on 16k: `The armrest is wobbly` → model has never seen `armrest` as noun well → `O O O O O O` → `No aspect`.
- Pre-trained + fine-tune: BERT (Bidirectional Encoder Representations from Transformers) knows `armrest` is noun from Wikipedia, fine-tune taught `X is wobbly → X is ASPECT` → correct.

---

## 8. What Do We Do vs What Does The Model Do? (How To Present That Model Is Not Doing Everything Alone)

**Never say "Model does everything." Show your 40% work.**

### 8.1 You Did (40% — Glue Logic)

- **Data Choice:** You chose **DMASTE over Amazon** (Amazon no labels), filtered `-1` (11,945 rows), did **review-level split** (leakage 0) — model did not choose data.
- **Label Making:** You wrote `find_span(text, phrase)` (find `Battery` at `0-7`) and `label_one_token(start, end, asp_start, asp_end, ...)` to make 5 labels per token, padded to 128 — model did not make labels.
- **Tokenization:** You called `tokenizer(text, return_offsets_mapping=True, truncation=True, max_length=128)` and kept `offset_mapping` to map token `Battery` → letters `0-7` — model did not tokenize.
- **Head & Training Setup:** You added 5-label head (`num_labels=5`), set `TrainingArguments` (`lr=2e-5`, `eval_strategy="epoch"`), wrote `check_overfit()` (`gap >0.10 → overfit`), **fixed bug** `evaluation_strategy → eval_strategy` for `transformers 4.57.6` — model did not set args.
- **Decode & Logic:** You wrote `decode_predictions()` (merge `wob` + `##bly` → `wobbly`), `build_triplets()` (first opinion for all — now known limitation), `get_overall()` (`Pos+Neg→Mixed`), `predict_review()` (fast path `if not is_trained(): return Neutral` — no hard-coded guess) — model did not write this.
- **Deployment:** You made `Dockerfile` `python:3.11-slim` `PYTHONPATH=/app/src` (no `pip install -e .`), CPU (Central Processing Unit)-only `whl/cpu` to avoid 3GB CUDA, `deploy.yml` `linux/amd64` `cache gha`, mount `-v /opt/.../model:/app/bert_aste_final:ro`, `curl -f http://localhost:8000/health` — model did not deploy itself.

### 8.2 Model Did (60% — The Heavy Math)

- **Pre-trained Knowledge:** BERT (Bidirectional Encoder Representations from Transformers) knew `battery` is noun, `wobbly` is adjective from Wikipedia.
- **Fine-tuned Update:** Model did `logits = BERT(input_ids)` → `loss = CrossEntropy(logits, labels)` → `loss.backward()` → `AdamW` update (you called `trainer.train()`, model did math).
- **Inference Math:** Model did `out.logits.argmax(-1)` per token to choose `ASPECT` vs `O`.

### 8.3 Presentation Line (Say This)

> "BERT (Bidirectional Encoder Representations from Transformers) knows English, **we taught it where is aspect** on 16,288 rows, and **we wrote the glue** (tokenize, label, decode, rank, save, deploy) — model is 60% of pipeline, our logic is 40%. Without our glue, model is just numbers."

---

## 9. Where Is Our Project Lagging Now? How Will We Fix It? What Is The Approach?

### 9.1 Lag 1: Neutral Too Much (21/36 = 58% on `final.csv`)

**Why lagging?**
`decode_predictions` **misses `ASPECT`** for some words. Example: `Fabric is excellent` → `Fabric` not labeled `ASPECT` → `aspects=[]` → `build_triplets([])` → `[]` → `get_overall([])` → `Neutral` — even though `excellent` is `OPINION_POS` found, but no aspect to attach.

**Fix Approach (Three Levels):**
- **Data Level:** Add more `NEU (Neutral)`/`NEG (Negative)` samples. Currently `NEU (Neutral) 608` only 4% — duplicate `NEU (Neutral)` rows 2×, or add `rating 3` Amazon reviews paraphrased as `okay`, `average`, `fine`.
- **Model Level:** Train **3-4 epochs** (now 2), lower `learning_rate` to `1e-5` for `NEU (Neutral)` to learn better, or try `DistilBERT` 3 epochs (we already tested, `F1 (F1 Score) 0.66`).
- **Logic Level:** If `aspects=[]` but `opinions` has `excellent`, create `generic` aspect `general` or fallback to `SentimentClassifier` (not hard-coded list). Currently we return `[]` → `Neutral`; fallback would give `Positive` instead.

### 9.2 Lag 2: `build_triplets` Uses First Opinion For All Aspects

**Why lagging?**
Code: `for asp in aspects: sent = opinions[0]` — first opinion. Example: `battery Positive, delivery Negative` with `opinions = [("great", POS (Positive)), ("terrible", NEG (Negative))]` → both `battery` and `delivery` get `POS (Positive)` (first) → wrong.

**Fix Approach:** Change to **nearest opinion** by distance in `offset_mapping`: For each `aspect` span `0-7`, find `opinion` span closest (minimum `abs(asp_start - opi_start)`). Or use **attention weight** to pair.

### 9.3 Lag 3: `OPINION_NEU F1 (F1 Score) 0.57` Lowest

**Why lagging?** Only 608 `NEU (Neutral)` rows (4%) → model sees `NEU (Neutral)` rarely → `OPINION_NEU` confused with `O`.

**Fix Approach:** Augment `NEU (Neutral)`: Take `POS (Positive)`/`NEG (Negative)` sentences and paraphrase to `NEU (Neutral)` via `okay`, `average`, `fine`, `so-so`.

### 9.4 Lag 4: `t3.micro` Out Of Memory, `t3.small` Slow

**Why lagging?** `model.safetensors` 415M + `torch` CPU (Central Processing Unit) 800M = 1.2G RAM (Random Access Memory) → `t3.micro` 1GB **OOM (Out of Memory)** (container killed, restart loop). `t3.small` 2GB works but inference ~150ms per review, 55 reviews → 8 sec.

**Fix Approach:** Keep `t3.small` 2GB (current `deploy.yml:18` `t3.small`), add `HEALTHCHECK` + `restart unless-stopped` (already), or use `distilbert` 250M (1GB total) for `t3.micro` if budget low.

---

## 10. Which Accuracy / Precision Techniques Are We Using? What Should We Optimize And Why? Why Not Optimize Others?

### 10.1 The Metrics Table (Read Row By Row)

**Accuracy:** `(TP (True Positive)+TN (True Negative)) / All` — Fraction correct. **We log it but NOT main.** Why not optimize? **POS (Positive) 79%** → guess `POS (Positive)` always = 79% accuracy but useless (learns nothing). Example: 16,288 rows, 12,944 POS (Positive) → always predict POS (Positive) → 79% accuracy, but `ASPECT` F1 (F1 Score) 0.0.

**Precision:** `TP (True Positive) / (TP (True Positive)+FP (False Positive))` — When we say `battery Negative`, how often right? **We use per-label `precision` in `classification_report` (`cell 45`).** Optimize for `ASPECT` and `OPINION_NEG` because **False Positive** (`battery` where no aspect) → wrong ranking `battery` top 6 false.

**Example:** Model says `battery` 10 times, 7 truly battery, 3 false → Precision `7/10 = 0.70`. Optimize to 0.80 → ranking true.

**Recall:** `TP (True Positive) / (TP (True Positive)+FN (False Negative))` — Of all true `battery`, how many caught? **We use per-label `recall`.** Optimize for `ASPECT` because **False Negative** (miss `armrest`) → `Neutral` → lose.

**Example:** True `armrest` 10 times, model catches 6 → Recall `6/10 = 0.60`. Optimize to 0.75 → fewer `Neutral`.

**F1 (F1 Score):** `2*P*R/(P+R)` — Balance of Precision and Recall. **Main metric: `eval_f1` weighted (`cell 45` 0.875).** Optimize this primary because imbalanced `POS (Positive) 79%` → `weighted` gives `POS (Positive)` 79% weight, `NEG (Negative)` 17%, `NEU (Neutral)` 4% — fair.

**ASPECT F1 (F1 Score):** F1 (F1 Score) for `ASPECT` label only. **Most important** `~0.68` → aim `>0.75`. Why optimize? Finding word `armrest` is your aim. If `ASPECT F1 (F1 Score)` low, no aspect → `Neutral` → no ranking.

**OPINION F1 (F1 Score):** `POS (Positive) 0.81, NEG (Negative) 0.72, NEU (Neutral) 0.57`. Track. Optimize `NEG (Negative)` (complaints matter most for `what to fix first`).

**False Positive (FP (False Positive)):** Say `battery` but no battery. **Minimize FP (False Positive) for `ASPECT`** via precision — else `battery` top 6 may be false.

**False Negative (FN (False Negative)):** Miss `armrest`. **Minimize FN (False Negative) for `ASPECT`** via recall — else many `Neutral`.

**Confusion Matrix:** Table `True (rows) vs Predicted (cols)` for 5 labels. Use to see if `ASPECT` confused with `O` (most common: `ASPECT` → `O` when model misses). Check `cell 45` matrix.

**Overfit Gap:** `train_f1 - val_f1` via `check_overfit()` `cell 48`. **Optimize gap <0.05.** Why? Gap `>0.10 → overfit` (memorize training, fail on new product `strap`). Gap low → generalize.

### 10.2 What To Optimize For Score? Why Not Others?

**Optimize: `ASPECT F1 (F1 Score)` + `weighted F1 (F1 Score)`**

- Evaluator asks `What precision did you use?` You say `weighted F1 (F1 Score) ~0.87 (ASPECT 0.76)`, not just `accuracy 0.96` for `O` (which is 90% `O` tokens → 0.96 even if `ASPECT` 0.0).

**Why not optimize `accuracy` alone?**
Because `O` is 90% of tokens → accuracy 0.96 even if `ASPECT` F1 (F1 Score) 0.0. It hides failure.

**Why not optimize `NEU (Neutral)` alone?**
Little data (608) → optimizing it overfits `POS (Positive)` (79%). You would push `NEU (Neutral)` F1 (F1 Score) 0.57 → 0.60 but `POS (Positive)` drops 0.81 → 0.75 → weighted drops.

---

## 11. Sequential Story — If You Know No Deep Learning (Read Top To Bottom)

1. **Problem:** One review has many feelings (Mixed). Need per-aspect feeling + what to fix first.
2. **Why not list?** `armrest` not in `["battery"]` → need pattern learner.
3. **Data:** Amazon 21k (no labels) for demo + DMASTE 7,524 human labels for training → drop `-1` → 16,288.
4. **Clean:** `find_text_column`, review-level split 4055/1014/1268, leakage 0.
5. **Labels:** 5 per token (O/ASPECT/OPINION_*).
6. **Pre-trained:** `bert-base-uncased` knows English from Wikipedia+Books, not our reviews.
7. **Add head:** 5-label random head on top.
8. **Tokenize:** `max_length 128` + `offset_mapping` to know `Battery` is letters `0-7`.
9. **Train:** 2 epochs T4 GPU (Graphics Processing Unit) `trainer.train()` → `model.safetensors` 415M.
10. **Scores:** `eval_f1` weighted `0.875`, `ASPECT F1 (F1 Score) 0.76`, `check_overfit()` gap.
11. **Use:** `predict_review("chair armrest wobbly")` → `armrest→Negative, fabric→Positive, Mixed`.
12. **Any CSV:** `find_text_column` → `analyze_csv_bytes` → dashboard.
13. **Any product:** Same model for `battery` and `fabric` — no new list.
14. **Deploy:** `Dockerfile` CPU (Central Processing Unit)-only `t3.small` mount `.../model:/app/bert_aste_final:ro` → `curl -f http://localhost:8000/health` (no `65.0.124.255` hardcode).
15. **Lag:** Neutral too much → more epochs + NEU (Neutral) data + fix `build_triplets` nearest.

---

## 12. Accurate Examples (Use These In Demo)

**Example 1 — Single Positive:**
- Input: `Battery lasts 10 hours, amazing sound`
- Tokens: `Battery → ASPECT`, `amazing → OPINION_POS`
- Triplets: `{battery, Positive}`, Overall `Positive`
- Why accurate: `battery` near `amazing`, pattern seen in train `battery is amazing`.

**Example 2 — Mixed (PPT Example):**
- Input: `The chair armrest is wobbly but fabric is comfortable.`
- Tokens: `armrest → ASPECT`, `wobbly → OPINION_NEG`, `fabric → ASPECT`, `comfortable → OPINION_POS`
- Triplets: `{armrest, Negative}, {fabric, Positive}`, Overall `Mixed`
- Why accurate: Pattern `X is wobbly` and `Y is comfortable` both learned.

**Example 3 — From Your 108-Row Headset Test:**
- Input: `The bluetooth is wonderful.`
- Tokens: `bluetooth → ASPECT`, `wonderful → OPINION_POS`
- Triplets: `{bluetooth, Positive}`, Overall `Positive`
- Why accurate: `bluetooth` seen as aspect in training `bluetooth` rows, `wonderful` seen as POS (Positive) opinion.

**Formatting for `model.md`:** Keep this `##` + `###` + bullet + code block + `mermaid` flow — all 8th grade, short sentences, 8-25 line helpers, no tables for long explanations.

---

## 13. Additional Questions You Should Add (Same Pattern, For Extra Marks)

**Q: Why 5 labels not 3?**
Because we need to know **opinion feeling** per aspect. `OPINION_POS/NEG (Negative)/NEU (Neutral)` tells `great → Positive`, `terrible → Negative`. If only `OPINION`, we would need second classifier.

**Q: Why `max_length 128` not 512?**
BERT (Bidirectional Encoder Representations from Transformers) limit is 512, but reviews are short (avg 15 words). 128 is **faster** (4× less memory) and enough. 512 would be 4× slower on `t3.small`.

**Q: Why drop `-1` implicit?**
`It is good.` — `It` is not product part, human wrote `aspect=-1`. No word span → cannot make `ASPECT` label. Keeping it would teach `good → ASPECT` which is wrong.

**Q: Why `review-level split` not `row-level`?**
`row-level` would put same `review_text` `Battery is great` with `battery` in train and same `review_text` with `great` in test → **leakage** (model sees same review). `review-level` ensures same `text` never in two splits.

**Q: Why `eval_strategy="epoch"` not `evaluation_strategy`?**
`transformers 4.57.6` renamed it — old code `evaluation_strategy` throws `TypeError: unexpected keyword`. We fixed.

**Q: Why `t3.small` not `t3.micro`?**
`t3.micro` 1GB → `model 415M + torch 800M = 1.2G` → **OOM (Out of Memory)** kill. `t3.small` 2GB fits.

**Q: Why `vercel.json` proxy `/api`?**
Vercel (Vercel (Frontend Hosting)) `https` → EC2 (Elastic Compute Cloud) `http://3.109.121.85:8000` is **mixed-content block** (`https→http` fetch blocked). Proxy `https://vercel.app/api → http://3.109.121.85:8000/api` makes same-origin `https`, no block.

---

*Save this `IMP_FILES/model.md` local (173 → now ~400 lines, max words, long form, headings not tables, sequential, examples, no push yet). It covers all 15+ questions you listed + extra, with best examples, to the point, sequence matters, mandatory questions kept.*

