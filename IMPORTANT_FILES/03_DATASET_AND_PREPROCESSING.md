# Part 4-5 — Dataset + Split + Preprocessing (Q50-72)

Simple English. Every fact has file path. NOT FOUND means no evidence.

## 50. Exact dataset used
HuggingFace `SilvioLima/raw_data`, only rows where `source == DMASTE`. VERIFIED FROM CODE (`cognizant1/simple_model.py:31-36`, `notebooks/Final_Perfect_Model.ipynb:cell 6,11`).

## 51. Original columns
`source, domain, sentence, triples`. VERIFIED FROM CODE (notebook cell 6).

## 52. What is triples
List of `(aspect, opinion, sentiment)` per review. Example `(battery, drains fast, NEG)`. VERIFIED FROM CODE (`simple_model.py:44`).

## 53. Review text column
`sentence` in raw data, renamed to `text` after cleaning. VERIFIED FROM CODE (`simple_model.py:45`).

## 54. Label column
`sentiment` inside triples, values `POS, NEG, NEU`. VERIFIED FROM CODE (`simple_model.py:45,53`).

## 55. Final cleaned file
`cognizant1/data/dmaste_clean.csv`, shape VERIFIED: 16288 rows + header, columns `text,aspect,opinion,sentiment`.

## 56. Rows removed
`aspect == -1` (implicit, no word span). Count: 28233 -> 16288, removed 11945. VERIFIED FROM CODE (`simple_model.py:51`, notebook cell 19-20). Reason: `It is good` has no aspect word, cannot teach ASPECT label.

## 57. Final class distribution (VERIFIED from artifact)
POS 12944 (79.47%), NEG 2736 (16.80%), NEU 608 (3.73%). Imbalanced. VERIFIED FROM CODE (artifact value_counts).

## 58. Unique reviews
6337 in cleaned artifact (not 7524). Train 4055 + Val 1014 + Test 1268 reviews = 6337 matches artifact. 7524 claim in README is NOT VERIFIED / inconsistent. Say 6337 verified.

## 59. Missing values handling
`strip()` text/aspect/opinion, drop `text == ""`. VERIFIED FROM CODE (notebook cell 19). No null-fill.

## 60. Duplicates handling
NOT FOUND — no dedup code in training path.

## 61. Imbalance handling
NOT IMPLEMENTED — no oversampling, no undersampling, no SMOTE, no class weights in loss. Loss uses default Trainer CE. VERIFIED FROM CODE (no weight code found).

## 62. Train/Val/Test split
Review-level: unique texts split `test_size=0.2 random_state=42`, then again `0.2`. VERIFIED FROM CODE (`simple_model.py:58-64`, notebook cell 22-23). Leakage check `set overlap == 0`. VERIFIED FROM CODE (cell 24). No stratification. VERIFIED FROM CODE.

## 63. Tokenizer applied consistently
Yes, `bert-base-uncased` with `max_length=128 truncation=True return_offsets_mapping=True` for labeling, `padding=max_length` for dataset. VERIFIED FROM CODE (`simple_model.py:84`, notebook cell 30,33).

## 64. Preprocessing execution order (training)
1 Filter DMASTE 2 literal_eval 3 flatten 4 strip + drop empty + drop -1 5 review-level split. VERIFIED FROM CODE.

## 65. Preprocessing execution order (inference CSV)
`decodeCsvBytesToText` (UTF-8) -> `detect_columns` (exact then substring, text candidates `review_text,review text,review,comment,feedback,text`) -> `clean_text` (non-ASCII to space, collapse whitespace, strip) -> `parse_rating` (first digits) -> skip empty -> keep rating/country/date/reviewer in attributes. VERIFIED FROM CODE (`src/cfa/analysis/preprocessing.py:38-96`, `src/cfa/api/routers/analyze.py:61-65`).

## 66. What is NOT done in preprocessing
NOT USED: lowercasing (except tokenizer internal), punctuation removal, stopword removal, stemming, lemmatization, spelling correction, URL/HTML removal, emoji handling. `ENGLISH_STOP_WORDS` imported in `extract.py:8` but never used (dead). VERIFIED FROM CODE.

## 67. Padding / truncation / max_length
Padding to max_length 128, truncation True, max_length 128. Short reviews padded, long truncated to 128 tokens. 128 chosen because reviews avg 15 words (DOC CLAIM in model.md, code uses 128). Special tokens `[CLS] [SEP] [PAD]` added by BERT tokenizer. VERIFIED FROM CODE.

## 68. Real example before/after
Before CSV: `review_text="Battery drains fast but sound is amazing."` After `clean_text`: same (only whitespace normalized). After tokenizer: `[CLS] battery drains fast but sound is amazing . [SEP]` + input_ids + attention_mask. After labels: `battery=ASPECT, drains fast=OPINION_NEG, sound=ASPECT, amazing=OPINION_POS`. VERIFIED FROM CODE logic.
