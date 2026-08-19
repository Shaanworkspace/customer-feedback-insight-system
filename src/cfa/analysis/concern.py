
import json
import logging
import re
from pathlib import Path
from typing import Dict, List, Any, Optional

from cfa.core.config import CONCERN_LEXICON_PATH

logger = logging.getLogger(__name__)
def _load_lexicon(path: Path) -> Dict[str, List[str]]:
   
    if not path.exists():
        logger.error(
            "Concern lexicon not found at %s. "
            "Create src/cfa/analysis/concern_lexicon.json",
            path,
        )
        return {}

    with open(path, "r", encoding="utf-8") as f:
        lexicon = json.load(f)

    logger.info(
        "Loaded concern lexicon: %d aspects from %s",
        len(lexicon), path,
    )
    return lexicon


def _build_compiled_patterns(
    lexicon: Dict[str, List[str]],
) -> Dict[str, List[tuple]]:
    
    compiled: Dict[str, List[tuple]] = {}

    for aspect, keywords in lexicon.items():
        # Sort by length descending — longer (more specific) phrases first
        sorted_kws = sorted(keywords, key=len, reverse=True)
        patterns = []
        for kw in sorted_kws:
            # Allow flexible whitespace between words in phrases
            escaped = r"\s+".join(re.escape(w) for w in kw.split())
            pattern = re.compile(r"\b" + escaped + r"\b", re.IGNORECASE)
            patterns.append((kw, pattern))
        compiled[aspect] = patterns

    return compiled


# Load and compile at import time
ASPECTS: Dict[str, List[str]] = _load_lexicon(CONCERN_LEXICON_PATH)
_COMPILED_PATTERNS: Dict[str, List[tuple]] = _build_compiled_patterns(ASPECTS)




def detect_concerns(text: str) -> List[Dict[str, Any]]:
   
    if not text or not isinstance(text, str):
        return []

    text_lower = text.lower()
    results: List[Dict[str, Any]] = []

    for aspect, patterns in _COMPILED_PATTERNS.items():
        matched_keywords: List[str] = []
        matched_positions: List[tuple] = []

        for keyword, pattern in patterns:
            for match in pattern.finditer(text_lower):
                span = match.span()
                # Skip if this span overlaps with an already-recorded span
                if not _overlaps_existing(span, matched_positions):
                    matched_keywords.append(keyword)
                    matched_positions.append(span)

        if matched_keywords:
            results.append({
                "aspect":    aspect,
                "keywords":  matched_keywords,
                "positions": matched_positions,
            })
            logger.debug(
                "Detected concern: aspect=%s keywords=%s",
                aspect, matched_keywords,
            )

    return results


def reload_lexicon() -> None:
   
    global ASPECTS, _COMPILED_PATTERNS
    ASPECTS = _load_lexicon(CONCERN_LEXICON_PATH)
    _COMPILED_PATTERNS = _build_compiled_patterns(ASPECTS)
    logger.info("Concern lexicon reloaded: %d aspects", len(ASPECTS))


def _overlaps_existing(
    new_span: tuple,
    recorded: List[tuple],
    threshold: int = 2,
) -> bool:
    
    ns, ne = new_span
    for rs, re_ in recorded:
        overlap = min(ne, re_) - max(ns, rs)
        if overlap >= threshold:
            return True
    return False