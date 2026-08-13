import fitz

def extract_pdf_pages(file_path: str) -> list[dict]:
    pages = []
    doc = fitz.open(file_path)
    try:
        for page_number, page in enumerate(doc, 1):
            pages.append({"page": page_number, "text": page.get_text("text").strip()})
    finally:
        doc.close()
    return pages

def build_llm_context(pages: list[dict], max_chars: int = 30000) -> str:
    chunks, total = [], 0
    for item in pages:
        if not item["text"]:
            continue
        chunk = f"\n--- PAGE {item['page']} ---\n{item['text']}\n"
        if total + len(chunk) > max_chars:
            chunks.append(chunk[:max_chars-total])
            break
        chunks.append(chunk)
        total += len(chunk)
    return "".join(chunks)

def find_evidence_pages(pages: list[dict], value: str):
    if not value:
        return None, None
    target = value.lower().strip()
    for p in pages:
        if target in p["text"].lower():
            return p["page"], p["text"][:600]
    words = [w for w in target.split() if len(w) > 3]
    best = (0, None)
    for p in pages:
        score = sum(w in p["text"].lower() for w in words)
        if score > best[0]:
            best = (score, p["page"])
    if best[1]:
        text = next(p["text"] for p in pages if p["page"] == best[1])
        return best[1], text[:600]
    return None, None
