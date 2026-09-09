"""Perfect model — BERT token classification (no hard-coded list).

This file mirrors Final_Perfect_Model.ipynb exactly.
All functions are small (8th grade English). No big function.
If the trained model is not found, it returns no aspects (no hard-coded fallback).
After running the notebook trainer.train(), save to ./bert_aste_final.
"""

import re
import torch
from pathlib import Path
from transformers import AutoTokenizer, AutoModelForTokenClassification

LABELS = ["O", "ASPECT", "OPINION_POS", "OPINION_NEG", "OPINION_NEU"]
label2id = {lab: i for i, lab in enumerate(LABELS)}
id2label = {i: lab for lab, i in label2id.items()}

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
BERT_DIR = PROJECT_ROOT / "bert_aste_final"
BASE_MODEL = "bert-base-uncased"

_tokenizer = None
_model = None
_device = None


def get_device():
    return "cuda" if torch.cuda.is_available() else "cpu"


def load_tokenizer():
    global _tokenizer
    if _tokenizer is None:
        # Use saved tokenizer if exists, else base
        if (BERT_DIR / "tokenizer.json").exists() or (BERT_DIR / "config.json").exists():
            _tokenizer = AutoTokenizer.from_pretrained(str(BERT_DIR))
        else:
            _tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL)
    return _tokenizer


def load_model():
    global _model, _device
    if _model is not None:
        return _model, _device
    _device = get_device()
    try:
        if (BERT_DIR / "config.json").exists():
            _model = AutoModelForTokenClassification.from_pretrained(str(BERT_DIR))
        else:
            # Not yet trained — load base head (random). Will give empty results until trained.
            _model = AutoModelForTokenClassification.from_pretrained(BASE_MODEL, num_labels=len(LABELS))
        _model.to(_device)
        _model.eval()
    except Exception:
        _model = None
        _device = "cpu"
    return _model, _device


def is_trained():
    return (BERT_DIR / "config.json").exists()


# --- Small helpers (each does one thing) ---

def clean_token(tok):
    return tok.replace("##", "")


def find_span(text, phrase):
    start = text.lower().find(str(phrase).lower())
    if start == -1:
        return -1, -1
    return start, start + len(str(phrase))


def decode_predictions(toks, preds, id2label):
    aspects = []
    opinions = []
    cur_text = ""
    cur_label = None
    for tok, lab in zip(toks, preds):
        if tok in ["[CLS]", "[SEP]", "[PAD]"]:
            continue
        lab_str = id2label[lab]
        is_sub = tok.startswith("##")
        tok_c = clean_token(tok)
        if lab_str == "ASPECT":
            if cur_label != "ASPECT":
                if cur_text:
                    if cur_label == "ASPECT":
                        aspects.append(cur_text)
                    elif cur_label and cur_label.startswith("OPINION"):
                        opinions.append((cur_text, cur_label))
                cur_text = tok_c
            else:
                cur_text += tok_c if is_sub else " " + tok_c
            cur_label = "ASPECT"
        elif lab_str.startswith("OPINION"):
            if cur_label != lab_str:
                if cur_text:
                    if cur_label == "ASPECT":
                        aspects.append(cur_text)
                    elif cur_label and cur_label.startswith("OPINION"):
                        opinions.append((cur_text, cur_label))
                cur_text = tok_c
            else:
                cur_text += tok_c if is_sub else " " + tok_c
            cur_label = lab_str
        else:
            if cur_text:
                if cur_label == "ASPECT":
                    aspects.append(cur_text)
                elif cur_label and cur_label.startswith("OPINION"):
                    opinions.append((cur_text, cur_label))
                cur_text = ""
                cur_label = None
    if cur_text:
        if cur_label == "ASPECT":
            aspects.append(cur_text)
        elif cur_label and cur_label.startswith("OPINION"):
            opinions.append((cur_text, cur_label))
    return aspects, opinions


def build_triplets(aspects, opinions):
    triplets = []
    for asp in aspects:
        if opinions:
            _, lab = opinions[0]
            sent = lab.split("_")[1]
        else:
            sent = "NEU"
        m = {"POS": "Positive", "NEG": "Negative", "NEU": "Neutral"}
        triplets.append({"aspect": asp, "sentiment": m[sent]})
    return triplets


def get_overall(triplets):
    pos = sum(1 for t in triplets if t["sentiment"] == "Positive")
    neg = sum(1 for t in triplets if t["sentiment"] == "Negative")
    if pos > 0 and neg > 0:
        return "Mixed"
    if pos > 0:
        return "Positive"
    if neg > 0:
        return "Negative"
    return "Neutral"


def predict_review(text):
    # Fast path: if not trained, do not download anything — no hard-coded answer
    if not is_trained():
        return {"review": text, "overall": "Neutral", "aspects": [], "raw_aspects": [], "raw_opinions": []}
    tokenizer = load_tokenizer()
    model, device = load_model()
    if model is None:
        return {"review": text, "overall": "Neutral", "aspects": [], "raw_aspects": [], "raw_opinions": []}
    enc = tokenizer(text, return_tensors="pt", truncation=True, max_length=128)
    enc = {k: v.to(device) for k, v in enc.items()}
    with torch.no_grad():
        out = model(**enc)
        preds = out.logits.argmax(-1)[0].cpu().tolist()
        ids = enc["input_ids"][0].cpu().tolist()
    toks = tokenizer.convert_ids_to_tokens(ids)
    aspects, opinions = decode_predictions(toks, preds, id2label)
    triplets = build_triplets(aspects, opinions)
    overall = get_overall(triplets)
    return {"review": text, "overall": overall, "aspects": triplets, "raw_aspects": aspects, "raw_opinions": opinions}


def extract_aspects_batch(texts):
    return [predict_review(t) for t in texts]
