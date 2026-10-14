"""Word-sequence diff between two markdown (or text) files, ignoring markdown formatting.

Proves a reformat changed structure only: any reported chunk is text that was
added, dropped, or altered. Expected chunks are print-only removals.

Either side may be a .pdf: its text is used minus running headers and page-number
footers, so the diff against a fresh conversion lists exactly what was removed.

Usage: python word_diff.py <a.md|a.pdf> <b.md>
"""
import difflib
import re
import sys
from collections import Counter
from pathlib import Path


def pdf_text(path):
    import fitz
    pages = [[ln.strip() for ln in p.get_text().splitlines() if ln.strip()] for p in fitz.open(path)]
    repeats = Counter(ln for p in pages for ln in set(p))
    furniture = {ln for ln, n in repeats.items() if n >= max(3, len(pages) // 3)}
    keep = [ln for p in pages for ln in p
            if ln not in furniture and not re.fullmatch(r"(page\s*)?\d+", ln, re.I)]
    return "\n".join(keep)


def words(path):
    if path.lower().endswith(".pdf"):
        t = pdf_text(path)
    else:
        t = Path(path).read_text(encoding="utf-8")
    t = t.replace("\u200b", "")
    t = re.sub(r"<[^>]+>", " ", t)
    t = re.sub(r"^\s{0,3}(#{1,6}|[-*+]|\d+\.|>)\s+", " ", t, flags=re.M)
    t = re.sub(r"^\s*(---+|\|?[\s:|-]+\|[\s:|-]*)\s*$", " ", t, flags=re.M)
    t = re.sub(r"[*_`]", "", t)
    t = t.replace("|", " ")
    return t.split()


a, b = words(sys.argv[1]), words(sys.argv[2])
sm = difflib.SequenceMatcher(a=a, b=b, autojunk=False)
n = 0
for op, i1, i2, j1, j2 in sm.get_opcodes():
    if op == "equal":
        continue
    n += 1
    ctx = " ".join(a[max(0, i1 - 6):i1])
    print(f"[{op}] …{ctx}\n   A: {' '.join(a[i1:i2])[:300]}\n   B: {' '.join(b[j1:j2])[:300]}")
print(f"\n{len(a)} vs {len(b)} words, {n} differing chunks, ratio {sm.ratio():.4f}")
