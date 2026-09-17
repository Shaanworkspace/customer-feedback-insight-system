# Parts 6-7 — Sentiment Type + Tokenization (Q73-100)

## 73. Is this simple classification
No. It is Aspect-Based Sentiment Analysis (ABSA) with token classification. VERIFIED FROM CODE (`src/cfa/ml/bert_aste.py:14-16` 5 labels).

## 74. Binary / multiclass
NOT binary. Per-token 5-class + per-aspect 3-feeling + overall 4 values. VERIFIED FROM CODE.

## 75. One review -> one sentiment
No. One review can give many aspects + many feelings + one overall (Positive/Negative/Neutral/Mixed). VERIFIED FROM CODE (`bert_aste.py:140-149` get_overall).

## 76. Exact 5 labels
`O, ASPECT, OPINION_POS, OPINION_NEG, OPINION_NEU` with `label2id O:0 ASPECT:1 OPINION_POS:2 OPINION_NEG:3 OPINION_NEU:4`. VERIFIED FROM CODE (`bert_aste.py:14-16`, `simple_model.py:75-77`, notebook cell 27).

## 77. What each label means
O = other word (is, the, was, 90% tokens). ASPECT = product part (battery, armrest, delivery). OPINION_POS = good word (great, excellent). OPINION_NEG = bad word (terrible, wobbly). OPINION_NEU = neutral word (okay, average). VERIFIED FROM CODE logic + docs.

## 78. Why these labels
One model gives aspect + feeling together. If only OPINION, second classifier needed. DOC CLAIM, code implements 5. VERIFIED FROM CODE for code, DESIGN RATIONALE NOT DOCUMENTED beyond that.

## 79. Is this BIO tagging
No. Plain 5 tags, no B-/I- prefix. `decode_predictions` merges consecutive same-label tokens. VERIFIED FROM CODE (`bert_aste.py:78-124`).

## 80. How spans become results
`find_span` uses `text.lower().find(phrase)` first occurrence -> `label_one_token` checks `s>=start and e<=end` with opinion priority -> `decode_predictions` merges tokens (handles ##, skips CLS/SEP/PAD) -> `build_triplets` pairs each aspect with `opinions[0]` (first opinion, known flaw) -> `get_overall` counts pos/neg. VERIFIED FROM CODE.

## 81. Tokenizer used
`bert-base-uncased` via `AutoTokenizer`, library `transformers`. `tokenizer.json` WordPiece vocab 30522, `do_lower_case true`. VERIFIED FROM CODE (`bert_aste.py:20,36-38`, `bert_aste_final/tokenizer_config.json`).

## 82. What happens during tokenization
Text -> WordPiece tokens -> input_ids + attention_mask (+ offset_mapping for training). Lowercases (uncased). Truncates to 128, pads to 128. VERIFIED FROM CODE.

## 83. input_ids / attention_mask / token_type_ids
input_ids = vocab numbers. attention_mask = 1 for real, 0 for pad. token_type_ids NOT USED (single sentence, BERT ignores). VERIFIED FROM CODE (only ids+mask used in `bert_aste.py:161`).

## 84. Special tokens
`[CLS]` start, `[SEP]` end, `[PAD]` fill. Labeled O. VERIFIED FROM CODE (`bert_aste.py:95-97` s==0 and e==0 -> O).

## 85. Real tokenization example
Input `Battery is great` -> tokens `[CLS] battery is great [SEP]` -> ids e.g. `[101, 6046, 2003, 2307, 102, 0...]` (128 len) -> mask `[1,1,1,1,1,0...]` -> labels `[O, ASPECT, O, OPINION_POS, O...]`. VERIFIED FROM CODE pattern.

## 86. Unseen aspect like armrest
No hard-coded list. Pattern `X is wobbly -> X is ASPECT` learned. `extract_aspects` lowercases and returns any predicted span with confidence 0.85 hard-coded. VERIFIED FROM CODE (`extract.py:14-37`). Fallback: if model not trained or no span, returns [] -> Neutral. No dictionary. VERIFIED FROM CODE.
