from __future__ import annotations

import os
import re
from pathlib import Path
from typing import Dict, List

DEFAULT_PDF_PATHS = [
    "/Users/kwonkibum/Downloads/[AMC] 도 Strategy Brief.pdf",
    "[AMC] 도 Strategy Brief.pdf",
]


def _extract_text_pages(pdf_path: str) -> List[str]:
    # Prefer pypdf, fallback to PyPDF2. Return empty on any failure.
    reader = None
    try:
        from pypdf import PdfReader  # type: ignore

        reader = PdfReader(pdf_path)
    except Exception:
        try:
            from PyPDF2 import PdfReader  # type: ignore

            reader = PdfReader(pdf_path)
        except Exception:
            return []

    pages = []
    try:
        for page in reader.pages:
            pages.append(page.extract_text() or "")
    except Exception:
        return []
    return pages


def _sentence_candidates(text: str) -> List[str]:
    raw = re.split(r"(?<=[.!?])\s+|\n+", text)
    cleaned = []
    for chunk in raw:
        s = re.sub(r"\s+", " ", chunk).strip()
        if 30 <= len(s) <= 180:
            cleaned.append(s)
    return cleaned


def extract_phrase_candidates(pdf_path: str | None = None) -> Dict[str, List[str]]:
    target = pdf_path or os.getenv("AMC_PHRASE_PDF_PATH", "")
    if not target:
        for p in DEFAULT_PDF_PATHS:
            if Path(p).exists():
                target = p
                break

    if not target or not Path(target).exists():
        return {
            "risk_signal_oneliner": [],
            "structural_read_templates": [],
            "implication_templates": [],
            "pattern_tags": [],
        }

    pages = _extract_text_pages(target)
    if not pages:
        return {
            "risk_signal_oneliner": [],
            "structural_read_templates": [],
            "implication_templates": [],
            "pattern_tags": [],
        }

    all_candidates: List[str] = []
    for page in pages:
        all_candidates.extend(_sentence_candidates(page))

    risk_signal = []
    structural_reads = []
    implications = []
    tags = []

    for s in all_candidates:
        lower = s.lower()
        if any(k in lower for k in ["structural risk signal", "risk signal", "zone note"]):
            risk_signal.append(s)
        if any(k in lower for k in ["interpretation", "structural read", "signal appears", "suggests"]):
            structural_reads.append(s)
        if any(k in lower for k in ["implication", "recommended", "guardrail", "assumption"]):
            implications.append(s)
        if any(k in lower for k in ["pattern", "tag", "zone", "signal"]):
            tags.append(s)

    # Deduplicate preserving order.
    def uniq(items: List[str]) -> List[str]:
        out = []
        seen = set()
        for item in items:
            key = item.casefold()
            if key not in seen:
                seen.add(key)
                out.append(item)
        return out

    return {
        "risk_signal_oneliner": uniq(risk_signal)[:20],
        "structural_read_templates": uniq(structural_reads)[:20],
        "implication_templates": uniq(implications)[:20],
        "pattern_tags": uniq(tags)[:20],
    }
