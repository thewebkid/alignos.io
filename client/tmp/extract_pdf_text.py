import argparse
from pathlib import Path

import fitz  # PyMuPDF


def extract_pdf_to_text(pdf_path: Path, out_path: Path) -> int:
    doc = fitz.open(pdf_path)
    parts: list[str] = []
    for i, page in enumerate(doc, start=1):
        parts.append(f"\n\n--- PAGE {i} ---\n\n")
        parts.append(page.get_text("text"))
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text("".join(parts), encoding="utf-8")
    return doc.page_count


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("pdf", type=str)
    parser.add_argument("out", type=str)
    args = parser.parse_args()

    pdf_path = Path(args.pdf)
    out_path = Path(args.out)
    pages = extract_pdf_to_text(pdf_path, out_path)
    print(f"Extracted {pages} pages -> {out_path}")


if __name__ == "__main__":
    main()

