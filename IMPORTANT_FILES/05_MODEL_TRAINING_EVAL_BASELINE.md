# Parts 8-11 — BERT + Training + Eval + TF-IDF Baseline (Q101-170)

## 101. Exact pretrained model
`bert-base-uncased` -> `AutoModelForTokenClassification num_labels=5` (BertForTokenClassification). VERIFIED FROM CODE (`bert_aste.py:52`, notebook cell 38, `bert_aste_final/config.json:3-5`).

## 102. Architecture numbers
12 layers, hidden 768, 12 heads, intermediate 3072, vocab 30522, max positions 512, 110M params. VERIFIED FROM CODE (`config.json:13-18,34-43`).

## 103. Pretrained knowledge
English Wikipedia 2.5B + BookCorpus 800M (DOC CLAIM in model.md, NOT in code). Code only loads weights. DESIGN RATIONALE NOT DOCUMENTED in code.

## 104. Fine-tuned
Yes, conceptually: base + new Linear 768->5 head, trained 2 epochs on 16288 rows. VERIFIED FROM CODE (notebook cell 38-42, `bert_aste_final/model.safetensors` 435MB exists). Entire model trainable (no freeze code). VERIFIED FROM CODE (no freeze found).

## 105. Training hyperparams (VERIFIED)
`per_device_train_batch 16, eval_batch 16, epochs 2, lr 2e-5, eval_strategy epoch, save_strategy epoch, logging_steps 50, load_best_model_at_end True`. VERIFIED FROM CODE (notebook cell 40). Optimizer/loss/scheduler/weight_decay/dropout/warmup/grad-clip/mixed-precision/early-stop/seed/GPU/duration/steps: NOT FOUND IN PROJECT (defaults would apply, not intentional).

## 106. Loss function
NOT IMPLEMENTED explicitly. Would default to CrossEntropyLoss in Trainer. Logits = 5 scores per token. No class weighting. VERIFIED FROM CODE (no loss code).

## 107. Checkpoint selection / files
Best via eval F1 (load_best_model_at_end True). Final saved to `bert_aste_final/` with `config.json, tokenizer.json, tokenizer_config.json, model.safetensors, training_args.bin`. No metrics.json. VERIFIED FROM CODE (`ls bert_aste_final`, notebook cell 43 commented save).

## 108. Training execution proof
NOT VERIFIED — notebooks have zero outputs, `trainer.train()` commented out (cell 42), no logs. Model file exists but provenance is DOC CLAIM (Colab T4 15 min). Say NOT VERIFIED FROM PROJECT for duration/loss values.

## 109. Evaluation metrics
`compute_metrics`: accuracy + weighted precision/recall/F1 via `accuracy_score` + `precision_recall_fscore_support average=weighted`. VERIFIED FROM CODE (notebook cell 41). Primary: weighted F1 (DOC CLAIM due to 79% POS bias). No macro/micro/confusion-matrix code. VERIFIED FROM CODE.

## 110. Final scores
NOT VERIFIED — notebook prints example `eval_f1 0.875, ASPECT 0.76` as placeholder text, no real evaluate output. Resume claim weighted F1 0.875: NOT VERIFIED FROM PROJECT (no metrics file). Say this in interview.

## 111. Overfit check
Rule `gap=train-val>0.10 overfit, both<0.70 underfit` defined in cell 48 but never executed. NOT VERIFIED.

## 112. TF-IDF baseline
NOT IMPLEMENTED. Zero `TfidfVectorizer` in code. `extract.py:43` says `No TF-IDF, no LLM`. Only `ENGLISH_STOP_WORDS` imported (dead). F1 0.45 claim: NOT VERIFIED FROM PROJECT. Say NOT IMPLEMENTED for baseline.

## 113. simple_model.py lexicon path (cognizant1, demo only)
Auto-discovers aspects from training (filters len<3, stopwords, regex, count<3), POS/NEG word lists, clause split on but/and, negation flip, per-aspect clause sentiment + training-majority fallback, overall pos&neg->Mixed. VERIFIED FROM CODE (`simple_model.py:124-221`). This is NOT BERT, NOT TF-IDF, rule-based demo. Must clarify in interview.
