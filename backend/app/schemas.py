from typing import Optional

from pydantic import BaseModel, Field


class Attribute(BaseModel):
    name: str
    value: str
    confidence: float = Field(ge=0, le=1)

    source_page: Optional[int] = None
    source_text: Optional[str] = None


class ExtractedProduct(BaseModel):
    product_name: str

    manufacturer: Optional[str] = None
    model: Optional[str] = None

    category: str
    subcategory: Optional[str] = None

    attributes: list[Attribute] = Field(default_factory=list)

    description: Optional[str] = None

    applications: list[str] = Field(default_factory=list)
    keywords: list[str] = Field(default_factory=list)


class ValidationIssue(BaseModel):
    severity: str
    code: str
    message: str

    attribute: Optional[str] = None
    evidence: Optional[str] = None


class ProductAnalysis(BaseModel):
    product: ExtractedProduct

    quality_score: float
    completeness_score: float
    confidence_score: float

    issues: list[ValidationIssue] = Field(default_factory=list)

    source_pages: int = 0


class EnrichmentResult(BaseModel):
    description: str

    feature_bullets: list[str]

    applications: list[str]

    search_keywords: list[str]


# ============================================================
# MULTI-SOURCE INTELLIGENCE
# ============================================================

class AttributeComparison(BaseModel):
    attribute: str

    pdf_value: Optional[str] = None
    csv_value: Optional[str] = None

    status: str


class ConflictDetail(BaseModel):
    attribute: str

    pdf_value: str
    csv_value: str

    severity: str

    pdf_source: str
    csv_source: str

    # PDF evidence
    pdf_page: Optional[int] = None
    pdf_evidence: Optional[str] = None

    # CSV evidence
    csv_evidence: Optional[str] = None

    # Explainable resolution
    recommended_value: Optional[str] = None
    preferred_source: Optional[str] = None

    preferred_source_authority: Optional[float] = None
    conflicting_source_authority: Optional[float] = None

    resolution_reason: Optional[str] = None

    # Human verification state
    verification_status: str = "needs_review"


class MissingAttribute(BaseModel):
    attribute: str

    pdf_value: Optional[str] = None
    csv_value: Optional[str] = None


class MultiSourceAnalysis(BaseModel):
    product: ExtractedProduct

    source_count: int

    matches: int
    total_compared: int

    consistency_score: float

    conflict_count: int

    conflicts: list[ConflictDetail] = Field(default_factory=list)

    missing: list[MissingAttribute] = Field(default_factory=list)

    comparisons: list[AttributeComparison] = Field(default_factory=list)

    source_reliability: dict = Field(default_factory=dict)