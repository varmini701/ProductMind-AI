import re
from app.schemas import ExtractedProduct, ValidationIssue

REQUIRED = {
    "ball valve": ["material","size","connection","pressure","temperature"],
    "valve": ["material","size","connection","pressure"],
    "electric motor": ["voltage","power","speed","phase"],
    "pump": ["flow","head","power","voltage"]
}

def norm(x): return re.sub(r"[^a-z0-9]+", " ", x.lower()).strip()
def requirements(category):
    c = norm(category)
    for k, attrs in REQUIRED.items():
        if k in c: return attrs
    return ["material","size"]

def validate_product(product: ExtractedProduct):
    attrs = {norm(a.name): a.value for a in product.attributes}
    issues = []
    req = requirements(product.category)
    present = 0
    for r in req:
        hit = next((v for k,v in attrs.items() if norm(r) in k or k in norm(r)), None)
        if hit: present += 1
        else: issues.append(ValidationIssue(severity="warning", code="MISSING_ATTRIBUTE", attribute=r,
                                             message=f"Required attribute '{r}' is missing for category '{product.category}'."))
    completeness = present / len(req) * 100 if req else 100
    for a in product.attributes:
        n, v = norm(a.name), a.value.lower()
        if "pressure" in n and not re.search(r"\d", v):
            issues.append(ValidationIssue(severity="critical", code="INVALID_PRESSURE", attribute=a.name,
                                          message="Pressure does not contain a numeric value.", evidence=a.source_text))
        if "size" in n and not re.search(r"\d", v):
            issues.append(ValidationIssue(severity="warning", code="INVALID_SIZE", attribute=a.name,
                                          message="Size does not appear to contain a numeric measurement.", evidence=a.source_text))
        if a.confidence < .70:
            issues.append(ValidationIssue(severity="warning", code="LOW_CONFIDENCE", attribute=a.name,
                                          message=f"AI confidence for '{a.name}' is {a.confidence:.0%}. Human review recommended.", evidence=a.source_text))
    confidence = sum(a.confidence for a in product.attributes) / len(product.attributes) * 100 if product.attributes else 0
    critical_penalty = 10 * sum(i.severity == "critical" for i in issues)
    quality = max(0, round(.55 * completeness + .45 * confidence - critical_penalty, 1))
    return round(completeness,1), round(confidence,1), issues, quality
