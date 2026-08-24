"""CSV preprocessing: detect columns dynamically and clean review text.

No fixed schema is required. Columns are matched by name (exact or
substring) so any review export works. Text is lightly normalised before
being passed to the ML/aspect layer.
"""

import csv
import io
import re

_TEXT = ("review_text", "review text", "reviewtext", "review", "comment", "comments", "feedback", "text")
_RATING = ("rating", "stars", "score", "review rating")
_COUNTRY = ("country", "nation", "region")
_DATE = ("date", "review date", "date of experience", "timestamp", "time")
_REVIEWER = ("reviewer name", "reviewer", "author", "customer", "user")

_WS = re.compile(r"\s+")
_NONASCII = re.compile(r"[^\x00-\x7F]+")


def _norm(h):
    return (h or "").strip().lower()


def _first(norm_map, candidates, fieldnames, avoid=()):
    for c in candidates:
        if c in norm_map:
            return norm_map[c]
    for h in fieldnames:
        hl = _norm(h)
        for c in candidates:
            if (c in hl or hl in c) and not any(a in hl for a in avoid):
                return h
    return None


def detect_columns(fieldnames):
    if not fieldnames:
        return {}
    norm_map = {_norm(h): h for h in fieldnames}
    return {
        "text": _first(norm_map, _TEXT, fieldnames, avoid=("rating", "date", "country", "reviewer", "author", "user", "name", "score", "star")),
        "rating": _first(norm_map, _RATING, fieldnames),
        "country": _first(norm_map, _COUNTRY, fieldnames),
        "date": _first(norm_map, _DATE, fieldnames),
        "reviewer": _first(norm_map, _REVIEWER, fieldnames),
    }


def clean_text(text):
    if not text:
        return ""
    text = _NONASCII.sub(" ", text)
    text = _WS.sub(" ", text)
    return text.strip()


def parse_rating(raw):
    if raw is None:
        return None
    m = re.search(r"\d+", str(raw))
    return int(m.group()) if m else None


def preprocess_csv(content):
    """Return (rows, columns).

    rows: list of dicts with normalized fields
          {text, rating, country, date, reviewer, attributes}
    columns: detected header mapping (canonical -> actual header or None)
    """
    reader = csv.DictReader(io.StringIO(content.decode("utf-8"), newline=""))
    columns = detect_columns(reader.fieldnames)
    rows = []
    text_col = columns.get("text")
    if not text_col:
        return rows, columns
    for row in reader:
        raw = (row.get(text_col) or "").strip()
        if not raw:
            continue
        cleaned = clean_text(raw)
        if not cleaned:
            continue
        rows.append(
            {
                "text": cleaned,
                "rating": parse_rating(row.get(columns["rating"])) if columns.get("rating") else None,
                "country": (row.get(columns["country"]) or "").strip() if columns.get("country") else "",
                "date": (row.get(columns["date"]) or "").strip() if columns.get("date") else "",
                "reviewer": (row.get(columns["reviewer"]) or "").strip() if columns.get("reviewer") else "",
                "attributes": {k: (row.get(k) or "").strip() for k in (reader.fieldnames or []) if k != text_col},
            }
        )
    return rows, columns
