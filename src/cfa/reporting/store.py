import json
import os
import time
from pathlib import Path

OUTPUT_DIR = Path(
    os.environ.get("OUTPUT_DIR", Path(__file__).resolve().parent.parent.parent.parent / "output")
)


class ReportStore:
    def __init__(self, base_dir=OUTPUT_DIR):
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def _path(self, user_id, name, ext):
        stamp = time.strftime("%Y%m%d-%H%M%S")
        safe = "".join(ch for ch in str(name) if ch.isalnum() or ch in "-_.") or "report"
        return self.base_dir / f"{user_id}_{safe}_{stamp}.{ext}"

    def save_json(self, user_id, name, data):
        path = self._path(user_id, name, "json")
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
        return str(path)

    def save_csv(self, user_id, name, text):
        path = self._path(user_id, name, "csv")
        path.write_text(text, encoding="utf-8")
        return str(path)
