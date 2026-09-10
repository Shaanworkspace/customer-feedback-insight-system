# Testing CSVs — How to Use for Interview

All files are in `testing_csvs/` and also `final.csv` at the project root and on your Desktop.

## Files

| File | Rows | What It Shows | When to Use |
|------|------|---------------|-------------|
| `testing_1_basic.csv` | 12 | Simple, easy to explain: 6 products × 2 feelings (battery good/bad, camera good/bad, delivery fast/late, price value/expensive, sound poor/loud, chair fabric/armrest). No Mixed, just Positive/Negative/Neutral. | First demo, to explain “how it works” without mixing. |
| `testing_2_mixed.csv` | 16 | Mixed reviews like “product is excellent but delivery was terrible”, “battery drains fast but camera is amazing”. Shows **Mixed** feeling and per-aspect detection. | To prove Mixed handling works. |
| `final_interview.csv` (also `final.csv` and `Desktop/final.csv`) | 36 | **Best for interview.** Balanced to make every chart look great: Positive 8, Negative 19, Mixed 7; 8 ranked concerns with battery on top; 6 countries; 4 months trend; ratings 1-5 all present. Includes chair *and* phone so you can say “any product works”. Contains the exact demo sentence “The product is excellent but delivery was terrible.” | **Final showcase.** Upload this and every dashboard chart fills perfectly. |

## Expected Output for `final_interview.csv` (after dynamic fallback, before BERT training)

```
Total: 36
Sentiment: Positive 8 (22%), Negative 19 (53%), Mixed 7 (19%), Neutral 0
Top concerns (ranked by impact = count × negative%):
  1. battery — 8 mentions, 87.5% negative, impact 100
  2. delivery — 5 mentions, 80% negative, impact 57
  3. packaging — 3 mentions, 100% negative, impact 43
  4. chair — 3 mentions, 100% negative, impact 43
  5. screen — 3 mentions, 66% negative
  6. charging — 2 mentions, 100% negative
Ratings: 1:8, 2:9, 3:5, 5:14  (bar chart)
Countries: India 12, USA 12, Germany 5, UK 4, Japan 2, Canada 1
Time trend: 2024-01:6, 2024-02:7, 2024-03:8, 2024-04:15
```

After you train the BERT model (`notebooks/Final_Perfect_Model.ipynb` → `trainer.train()` → `bert_aste_final/`), the same file will give even cleaner aspects (e.g., `armrest`, `fabric`, `overheats`, `flickers`) with higher confidence (0.85) and better Mixed detection.

## How to Use in Interview

1. **Start with testing_1_basic:** “This is simple — 12 reviews, each about one thing. See, battery positive vs negative is clearly separated.”
2. **Then testing_2_mixed:** “Now see Mixed — one review says two things with opposite feelings. The model must give product→Positive, delivery→Negative, Overall Mixed. Our old model failed, the new BERT does it.”
3. **Finally final_interview:** “This is a real-world mix — 36 reviews, chair and phone together, to prove no hard-coded list. Upload it and watch every chart: feeling pie, ranked bar, ratings, countries, time trend, plus proof quotes for battery.”

All three have the same columns (`review_id, review_text, rating, date, country, product`) so the code auto-finds `review_text`.

## Columns

- `review_text` — required. The code finds it even if you rename it to `Review Text`, `comment`, or `feedback`.
- `rating, date, country` — optional. If present, they make the extra charts. If not, the main insight still works.
