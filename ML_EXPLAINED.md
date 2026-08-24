# ML Module — Step-by-Step Explanation (so simple a beginner can follow)

> Har point ko bina kisi concept jump ke, step-by-step samjhaya gaya hai.
> Code reference: `src/cfa/ml/train.py`, `src/cfa/ml/serve.py`, `src/cfa/analysis/sentiment.py`, `src/cfa/analysis/preprocessing.py`.

---

## 0. Ek line mein batao ye ML kya karta hai?

Ye system ek customer review (jaise *"camera is excellent but battery drains fast"*) ko padhta hai aur batata hai ki us review ka **sentiment** kya hai — Positive, Negative, Neutral ya Mixed — aur review mein **konsa aspect** (camera, battery, price…) kharab ya achha hai.

Iska dimaag do hisso mein hai:
1. **Trained model** (`ml/serve.py`) — ek binary (positive/negative) classifier jo Amazon reviews pe train hua hai.
2. **4-class logic** (`analysis/sentiment.py`) — jo binary model ko aspect + clause signals ke saath milakar Positive/Negative/Neutral/Mixed banata hai.

Neeche har sawal ka jawab detail mein hai.

---

## 1. Humne jo data pe train kra h usme kitne columns the?

Training script `ml/train.py` sirf **2 columns** use karta hai:

```python
df = pd.read_csv(RAW, usecols=["Review Text", "label"], engine="python")
```

| Column | Kya hai | Role |
|--------|---------|------|
| `Review Text` | Customer ne jo likha (e.g. *"battery life is poor"*) | **Input / Feature** — isi se model sikhta hai |
| `label` | `positive` ya `negative` | **Target / Answer** — model ko batata hai sahi jawab kya hai |

**Baki saare columns (product name, user id, rating, date, etc.) ignore kar diye gaye.** Kyun? Kyunki sentiment review ke *shabdon* mein chupa hota hai, rating ya date mein nahi. Isliye sirf `Review Text` model ke kaam aata hai.

**Data kahan se aaya?** `ml/train.py` ki docstring kehti hai: *"Source: our Amazon reviews merged with the amazon_polarity dataset."* Matlab humare apne reviews + public Amazon polarity dataset milakar ek `data/training_reviews.csv` banaya gaya.

---

## 2. Hum kyse process kr rhe h unko, kyse value kaat rhe h?

Do jagah processing hoti hai — **training time** aur **serving time**. Dono alag hain, samjho:

### A) Training time (`ml/train.py`)
Yahan hum text mein **zyada hath nahi lagate**. Sirf do cheezein karte hain:

```python
df["label"] = df["label"].astype(str).str.strip().str.lower()   # "Positive " -> "positive"
df = df[df["label"].isin(["positive", "negative"])]               # sirf ye do label rakho
```

Baaki saari "cleaning" (chhoti badi, stopword hataana) baad mein **TF-IDF** khud kar leta hai (point 5 & 9 dekho). Matlab training mein text original hi rehta hai; safai TF-IDF karta hai.

### B) Serving time (`analysis/preprocessing.py`)
Jab user CSV upload karta hai, tab har row ka text `clean_text()` se guzarta hai:

```python
def clean_text(text):
    text = _NONASCII.sub(" ", text)   # non-English/emoji jaise chars hatao
    text = _WS.sub(" ", text)         # do space ko ek space bana do
    return text.strip()
```

Toh "Camera is   gr8 🔥🔥!!!" → "Camera is gr8". Chote chote noise nikal diye jaate hain taaki model confuse na ho.

---

## 3. Kis columns ki ky priority h?

Sirf **2 columns** hain, toh priority simple hai:

1. **`Review Text` — sabse zaroori (Priority #1).** Yehi model ka input hai. Iske bina kuch nahi chalta.
2. **`label` — Priority #2.** Ye "answer key" hai. Train time pe use hoti hai (predict time pe nahi).
3. **Baki columns — Priority #0 (ignore).** Inhe train.py ne `usecols` se pehle hi hata diya.

Frontend CSV mein bohot saare columns ho sakte hain (`review_text`, `rating`, `date`, `country`, `reviewer`…). Lekin **ML sirf review text** padhta hai. `rating`, `date`, `country` sirf dashboard charts (rating distribution, trend, country) ke liye use hote hain — sentiment mein nahi.

---

## 4. Rows kis trh ki filter hoti hain? (before vs after count)

Training pipeline mein rows do baar channi se guzarti hain:

### Step 1 — Drop empty rows
```python
df = df.dropna(subset=["Review Text", "label"])
```
Jo row ka `Review Text` khali hai ya `label` hi nahi hai, use hata do. Khali review se model kuch nahi sikh sakta.

### Step 2 — Sirf binary labels rakho
```python
df = df[df["label"].isin(["positive", "negative"])]
```
Agar koi row ka label `neutral` ya `unknown` tha, use hata do — kyunki humara trained model **sirf do class** (positive/negative) janta hai.

### Counts (real numbers from `models/metrics.json`)

| Stage | Rows |
|-------|------|
| Raw merged file (before any filter) | *(file size dependent — had empty + non-binary rows)* |
| **After dropna + label filter (total usable)** | **79,498** |
| ├─ used for training (80%) | 63,598 |
| └─ used for testing (20%) | 15,900 |
| Label split in final data | negative: 43,313 · positive: 36,185 |

**Why filter?** 
- Empty text → model sikhega hi kya? Noise.
- Non-binary label → humara model binary hai, `neutral` use samajh nahi aayega, galat sikhega.
- 80/20 split + stratified (`stratify=df["label"]`) → test set bhi same ratio rakhta hai taaki accuracy sahi nape.

---

## 5. Feature extraction kiya kiya? Detail mein.

Feature extraction ka matlab: **text ko numbers mein badalna** taaki computer samjhe. Hum `TfidfVectorizer` use karte hain.

```python
TfidfVectorizer(
    max_features=30000,        # top 30,000 words rakho
    stop_words="english",      # the, is, and... hatao
    ngram_range=(1, 2),        # single word + pairs
    sublinear_tf=True,          # bahut baar aane wale words ko damp karo
    min_df=2,                  # jo word 2 baar se kam aaya, use hatao
)
```

**TF-IDF kya hai? (bilkul simple analogy)**
Socho har review ek *jholi* hai jisme words hain. Ab har word ko ek number milta hai jo batata hai "ye word kitna important hai is review ke liye":
- "the", "is" jaise words har review mein aate hain → unka score **kam** (koi feeling nahi dikhate).
- "blurry", "drained" jaise words kam reviews mein aate hain par is review mein hain → unka score **zyada** (ye feeling dikhate hain).

Exactly ye hi TF-IDF (Term Frequency × Inverse Document Frequency) karta hai.

**Har option kya karta hai:**
- `ngram_range=(1,2)` → sirf single words nahi, balki **do words ke jode** bhi feature bante hain. "battery drains" ek saath sikhna zaroori hai, warna "battery" aur "drains" alag alag confuse kar sakte hain.
- `stop_words="english"` → filler words hatao (point 9).
- `min_df=2` → ek baar aane wala typo/rare word noise hai, hatao.
- `sublinear_tf=True` → ek word 10 baar likhne se importance 10x nahi badhni chahiye, thoda control karo.
- `max_features=30000` → memory aur speed ke liye top 30k words rakhe.

**Result:** har review ek **lambi list of numbers** ban jati hai (e.g. `[0, 0, 0.71, 0, ..., 0.53]`), jisme har column ek word/ngram hai. Isi list ko model padhta hai.

---

## 6. Yhi model ku lagaya, baaki ku nhi jo saare available h?

Humne **Logistic Regression** choose kiya. Available options they: Naive Bayes, SVM, Random Forest, Decision Tree, Neural Networks/BERT, etc.

**Kyun Logistic Regression?**
- **Fast & light:** 79k rows par 1-2 minute mein train ho jata hai, choti file (joblib) banata hai — Render pe bina GPU chal jata hai.
- **Probability deta hai:** output sirf "positive" nahi, balki `0.92` confidence bhi deta hai. Ye confidence baad mein 4-class banane ke kaam aati hai.
- **Samajh mein aata hai:** har word ka ek weight hota hai (positive word = +, negative = −). Debug karna easy.
- **Accuracy kaafi achhi:** test pe **88.4% accuracy, 0.875 F1** (metrics.json).

**Baaki kyun nahi?**
- **Naive Bayes:** bhot fast hai par maanta hai ki sab words independent hain (real text mein aisa nahi) → yahan thoda kam accurate.
- **SVM:** ache results de sakta hai par 79k rows pe slow, aur probability natively nahi deta.
- **Random Forest:** sparse text (zyada tar numbers 0) pe TF-IDF + LR se weak rehta hai, aur slow.
- **BERT / Deep Learning:** shayad 1-2% achha ho, par GPU + lakhs data + bhot compute chahiye. Hackathon/demo ke liye overkill hai.

Toh **LR + TF-IDF** best trade-off hai: simple, fast, interpretable, aur 88% accurate.

---

## 7. Kyse decide ki value kaha dekh ke, aur ku ki neutral / mixed / positive / negative ye kyse hota h?

Ye sabse important sawal hai. **Model khud sirf Positive ya Negative janta hai.** 4 class hum `analysis/sentiment.py` ke `SentimentClassifier` se banate hain.

### Step-by-step decide ka tarika:

1. **Review ko chhote tukdo (clauses) mein torto** punctuation aur conjunctions (`but`, `although`, `however`) ke paas se:
   *"camera is excellent **but** battery drains fast"* → `["camera is excellent", "battery drains fast"]`

2. **Har clause ko binary model se poocho** (`_clause_polarities`):
   - "camera is excellent" → model: positive (conf ≥ 0.5) ✅
   - "battery drains fast" → model: negative ✅

3. **Aspect sentiments bhi dekho** (aspect extraction se aate hain, e.g. camera=positive, battery=negative).

4. **Ab rules lagte hain (`classify` method):**

| Condition | Result |
|-----------|--------|
| Positive aspect **aur** negative aspect dono present hain | **Mixed** |
| Clauses mein positive + negative dono milte hain | **Mixed** |
| Sirf positive signals | **Positive** |
| Sirf negative signals | **Negative** |
| Koi clear signal nahi + model bhi sure nahi (conf < 0.7) | **Neutral** |
| Koi aspect neutral hai | **Neutral** |

**Matlab:**
- **Positive / Negative** → seedha binary model se aate hain.
- **Mixed** → jab ek hi review mein do opposites hain (ek achha aspect, ek bura). Model akele mixed nahi batata, hum combine karte hain.
- **Neutral** → jab review factual ya weak hai ("arrived on time, nothing special") aur model bhi confident nahi hai.

Isliye ek hi review mein "camera is excellent but battery drains fast" → **Mixed** ban jata hai.

---

## 8. How we handled missing values?

Missing values 3 jagah handle hote hain:

**Training (`ml/train.py`):**
```python
df = df.dropna(subset=["Review Text", "label"])   # empty text/label hatao
df = df[df["label"].isin(["positive","negative"])] # galat label hatao
```
Toh missing text ya missing label wali row automatically eliminate ho jati hai.

**Serving — model file missing:**
```python
def predict_sentiment(text):
    model, vectorizer = _load()
    if model is None:
        return _keyword_fallback(text)   # model nahi? keyword list use karo, crash mat karo
```
Agar `models/` mein file hi nahi hai (fresh checkout), toh **keyword fallback** chalta hai — system down nahi hota.

**Serving — review text empty:**
`preprocessing.preprocess_csv` mein har row check hoti hai — agar cleaned text khali hai toh row skip kar dete hain:
```python
if not raw: continue
if not cleaned: continue
```

**Rating missing:** `parse_rating` agar `None` mile ya number na nikle toh `None` return karta hai; dashboard ratings chart usko gracefully ignore kar deta hai.

**Database:** `first_name`, `email`, `rating` sab `nullable=True` hain — blank hone par error nahi aata.

---

## 9. Stop words pe kyse kaam kra h? Detail mein.

**Stop words** wo chote words hain jo feeling nahi dikhate — *the, is, and, a, an, of, to, in…*

**Humne kaise handle kiya?**
TF-IDF mein directly parameter diya:
```python
TfidfVectorizer(stop_words="english", ...)
```
Matlab vectorizer apne aap in words ko hata deta hai features se.

**Kyun zaroori hai?**
Socho review: *"The battery is good and the camera is bad."*
Agar "the" aur "and" count karein toh wo sabse zyada baar aayenge, aur model soch sakta hai "the" = important word. Lekin "the" se pata hi nahi chalta ki user khush hai ya gussa. Stop words hataane se **asil feeling words** (good, bad, battery, camera) hi bachte hain jo model ke liye useful hain.

Humne manually koi stop-word list nahi banayi — `scikit-learn` ki built-in English list use kar li (best practice, aur time bhi bachta hai).

---

## 10. Data pe jyada focus kre ki kyse clean kiya best way me taki model effective ho?

Best cleaning = **sirf wahi rakho jo matter karta hai, noise nikaal do, aur class balance rakho.** Humne ye kiya:

1. **Label normalize** — `str.strip().str.lower()` se `"Positive "` aur `"positive"` same ho gaye. (typo/space se model confuse na ho.)
2. **Nulls hatae** — empty review/label drop ki (point 8).
3. **Binary filter** — sirf positive/negative rakhe, model ko clear target diya.
4. **Class balancing** — `LogisticRegression(class_weight="balanced")` se model minority class (positive, jo 36k vs 43k negative tha) ko equal weight deta hai, warna negative hi hamesha predict karta.
5. **Stratified split** — `train_test_split(..., stratify=df["label"])` se train aur test dono mein same positive:negative ratio raha, toh accuracy sahi napi.
6. **TF-IDF cleaning** — lowercase, stopwords, n-grams, min_df se rare words gaye (points 5, 9).
7. **Serving cleaning** — `clean_text()` se non-ASCII + extra spaces gaye (point 2B).

Result: model **88.4% accurate** aur **0.875 F1** deta hai — matlab cleaning sahi thi.

---

## 11. Text ko number mein kyse change kiya? Step-wise pipeline.

Poora flow ek review ka, word se number tak:

**Input:** `"Camera is excellent but battery drains fast"`

**Step 1 — Clean:** lowercase + non-ASCII/space fix → `"camera is excellent but battery drains fast"`

**Step 2 — TF-IDF vectorize:** vectorizer review ko ek number-vector banata hai. Har column ek word/ngram hai, value = importance:
```
[ 0, 0, 0.0, 1.2, 0, 0.9, 0, ..., 0.4 ]
   ↑    ↑         ↑        ↑            ↑
 (the)(is)    (camera) (excellent)  (battery)
```
("the", "is" stopwords the, isliye 0.)

**Step 3 — Model math (Logistic Regression):** model ne har word ko ek weight sikha hota hai, e.g. `excellent = +2.1`, `drains = -1.8`, `camera = +0.3`. Model in sab numbers ko weight se multiply karke jodta hai:
```
score = (1.2*+0.3) + (0.9*+2.1) + (0.4*-1.8) + ... = +1.7
```

**Step 4 — Score → probability:** ye `+1.7` ek function (sigmoid/logistic) se guzarta hai aur **probability** ban jata hai, e.g. `0.92`.

**Step 5 — Label decide:** probability ≥ 0.5 → **positive**, warna negative. Yahan `0.92` → **positive**, confidence `0.92`.

**Step 6 — 4-class wrap (optional, app ke liye):** upar wala sirf ek clause ke liye tha. Puri review ke liye `SentimentClassifier` har clause + aspect check karta hai (point 7) aur final mein **Positive / Negative / Neutral / Mixed** decide karta hai.

Toh **text → vector of numbers → weighted sum → probability → label**. Itna hi simple hai.

---

# 6 Most Asked Questions (FAQ)

**Q1. App 4 class (Positive/Negative/Neutral/Mixed) dikhata hai, par model toh binary hai?**
Haan. Trained model sirf positive/negative janta hai. Hum `SentimentClassifier` se clauses aur aspects milakar Mixed/Neutral banate hain. Model binary hai, intelligence 4-class humne upar se joddi.

**Q2. Agar `models/` ki file gayab ho jaye toh?**
`_keyword_fallback` chal jata hai — ek English positive/negative word-list use hoti hai (negation bhi sambhalta hai). App crash nahi hota, bas thodi kam accurate prediction aati hai.

**Q3. Model kitna accurate hai?**
Test set (15,900 reviews) pe: **accuracy 88.4%**, **precision 86%**, **recall 89%**, **F1 0.875**. (`models/metrics.json` se.)

**Q4. Kya ye Hindi ya aur language mein kaam karega?**
Na. Model English Amazon reviews pe train hua hai aur keyword fallback bhi English hai. Dusri language ke liye alag data se retrain karna padega.

**Q5. TF-IDF kyun, BERT/Word2Vec kyun nahi?**
TF-IDF + LR chota, tez, aur bina GPU ke kaam karta hai aur 88% deta hai. BERT shayad 1-2% achha ho par GPU + lakhs data + bhot compute mangta hai — is project ke liye zarurat se zyada hai.

**Q6. Kya hum aur classes (angry, sad) add kar sakte hain?**
Haan. Training CSV mein naye labels daalo, `train.py` ka `isin([...])` list badhao, retrain karo. 4-class wrapper (`sentiment.py`) bhi extend ho sakta hai. Model badalne ke liye sirf `ml/train.py` chalaana hai.

---

*Document generated to match the current codebase. Numbers sourced from `models/metrics.json` and `src/cfa/analysis/concern_lexicon.json`.*
