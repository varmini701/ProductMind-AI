import os
import tempfile

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.config import MAX_UPLOAD_MB, MOCK_MODE

from app.schemas import (
    ProductAnalysis,
    ExtractedProduct,
    EnrichmentResult,
    MultiSourceAnalysis,
)

from app.services.pdf_extractor import (
    extract_pdf_pages,
    build_llm_context,
    find_evidence_pages,
)

from app.services.validator import validate_product

from app.services.llm import (
    extract_product,
    enrich_product,
)

from app.services.mock_ai import (
    mock_product,
    mock_enrichment,
)

from app.services.csv_extractor import (
    extract_csv_products,
)

from app.services.conflict_detector import (
    compare_products,
)

from app.services.source_reliability import (
    get_source_reliability,
)


router = APIRouter(prefix="/api")


# ============================================================
# HEALTH CHECK
# ============================================================

@router.get("/health")
def health():
    return {
        "status": "ok",
        "mock_mode": MOCK_MODE,
    }


# ============================================================
# PDF EVIDENCE
# ============================================================

def attach_evidence(product, pages):
    """
    Attach source page number and source text
    to every extracted product attribute.
    """

    for attribute in product.attributes:

        page, text = find_evidence_pages(
            pages,
            attribute.value
        )

        if page:
            attribute.source_page = page
            attribute.source_text = text

    return product


# ============================================================
# SINGLE PDF ANALYSIS
# ============================================================

@router.post(
    "/analyze",
    response_model=ProductAnalysis
)
async def analyze(
    file: UploadFile = File(...)
):

    # --------------------------------------------------------
    # Validate file
    # --------------------------------------------------------

    if (
        not file.filename
        or not file.filename.lower().endswith(".pdf")
    ):
        raise HTTPException(
            400,
            "MVP currently accepts PDF files."
        )

    # --------------------------------------------------------
    # Read file
    # --------------------------------------------------------

    data = await file.read()

    # --------------------------------------------------------
    # File size validation
    # --------------------------------------------------------

    if len(data) > MAX_UPLOAD_MB * 1024 * 1024:

        raise HTTPException(
            413,
            f"File exceeds {MAX_UPLOAD_MB} MB limit."
        )

    path = None

    try:

        # ----------------------------------------------------
        # Save PDF temporarily
        # ----------------------------------------------------

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=".pdf"
        ) as tmp:

            tmp.write(data)
            path = tmp.name

        # ----------------------------------------------------
        # Extract PDF pages
        # ----------------------------------------------------

        pages = extract_pdf_pages(path)

        if not any(
            page["text"]
            for page in pages
        ):

            raise HTTPException(
                422,
                "No machine-readable text found. "
                "OCR is a next-step feature for scanned PDFs."
            )

        # ----------------------------------------------------
        # Extract product
        # ----------------------------------------------------

        if MOCK_MODE:

            product = mock_product()

        else:

            product = extract_product(
                build_llm_context(pages)
            )

        # ----------------------------------------------------
        # Attach evidence
        # ----------------------------------------------------

        product = attach_evidence(
            product,
            pages
        )

        # ----------------------------------------------------
        # Validate product
        # ----------------------------------------------------

        (
            completeness,
            confidence,
            issues,
            quality
        ) = validate_product(product)

        # ----------------------------------------------------
        # Return analysis
        # ----------------------------------------------------

        return ProductAnalysis(
            product=product,
            quality_score=quality,
            completeness_score=completeness,
            confidence_score=confidence,
            issues=issues,
            source_pages=len(pages),
        )

    except HTTPException:

        raise

    except Exception as e:

        raise HTTPException(
            502,
            f"Analysis failed: {e}"
        )

    finally:

        # ----------------------------------------------------
        # Clean temporary file
        # ----------------------------------------------------

        if (
            path
            and os.path.exists(path)
        ):
            os.unlink(path)


# ============================================================
# AI ENRICHMENT
# ============================================================

@router.post(
    "/enrich",
    response_model=EnrichmentResult
)
def enrich(
    product: ExtractedProduct
):

    try:

        if MOCK_MODE:

            return mock_enrichment()

        return enrich_product(product)

    except Exception as e:

        raise HTTPException(
            502,
            f"Enrichment failed: {e}"
        )


# ============================================================
# MULTI-SOURCE ANALYSIS
# ============================================================

@router.post(
    "/analyze-multi-source",
    response_model=MultiSourceAnalysis
)
async def analyze_multi_source(
    pdf_file: UploadFile = File(...),
    csv_file: UploadFile = File(...)
):
    """
    Analyze a product using both:

    1. Manufacturer PDF datasheet
    2. Product catalog CSV

    Detects:

    - matching attributes
    - missing attributes
    - conflicting attributes
    - source reliability
    - explainable resolution
    """

    # ========================================================
    # 1. VALIDATE PDF
    # ========================================================

    if (
        not pdf_file.filename
        or not pdf_file.filename.lower().endswith(".pdf")
    ):

        raise HTTPException(
            400,
            "pdf_file must be a PDF file."
        )

    # ========================================================
    # 2. VALIDATE CSV
    # ========================================================

    if (
        not csv_file.filename
        or not csv_file.filename.lower().endswith(".csv")
    ):

        raise HTTPException(
            400,
            "csv_file must be a CSV file."
        )

    # ========================================================
    # 3. READ FILES
    # ========================================================

    pdf_data = await pdf_file.read()
    csv_data = await csv_file.read()

    # ========================================================
    # 4. FILE SIZE VALIDATION
    # ========================================================

    max_size = MAX_UPLOAD_MB * 1024 * 1024

    if len(pdf_data) > max_size:

        raise HTTPException(
            413,
            f"PDF exceeds {MAX_UPLOAD_MB} MB limit."
        )

    if len(csv_data) > max_size:

        raise HTTPException(
            413,
            f"CSV exceeds {MAX_UPLOAD_MB} MB limit."
        )

    pdf_path = None
    csv_path = None

    try:

        # ====================================================
        # 5. SAVE PDF TEMPORARILY
        # ====================================================

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=".pdf"
        ) as tmp:

            tmp.write(pdf_data)
            pdf_path = tmp.name

        # ====================================================
        # 6. SAVE CSV TEMPORARILY
        # ====================================================

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=".csv"
        ) as tmp:

            tmp.write(csv_data)
            csv_path = tmp.name

        # ====================================================
        # 7. EXTRACT PDF PAGES
        # ====================================================

        pages = extract_pdf_pages(
            pdf_path
        )

        if not any(
            page["text"]
            for page in pages
        ):

            raise HTTPException(
                422,
                "No machine-readable text found in PDF."
            )

        # ====================================================
        # 8. EXTRACT PRODUCT FROM PDF
        # ====================================================

        if MOCK_MODE:

            pdf_product = mock_product()

        else:

            pdf_product = extract_product(
                build_llm_context(pages)
            )

        # ====================================================
        # 9. ATTACH PDF EVIDENCE
        # ====================================================

        pdf_product = attach_evidence(
            pdf_product,
            pages
        )

        # ====================================================
        # 10. EXTRACT CSV PRODUCTS
        # ====================================================

        csv_products = extract_csv_products(
            csv_path
        )

        if not csv_products:

            raise HTTPException(
                422,
                "CSV contains no product records."
            )

        # ====================================================
        # 11. FIND MATCHING PRODUCT
        # ====================================================

        matched_product = None

        pdf_model = (
            pdf_product.model or ""
        ).strip().lower()

        pdf_name = (
            pdf_product.product_name or ""
        ).strip().lower()

        for row in csv_products:

            csv_model = (
                row.get("model", "")
                .strip()
                .lower()
            )

            csv_name = (
                row.get("product_name", "")
                .strip()
                .lower()
            )

            # ------------------------------------------------
            # Prefer model match
            # ------------------------------------------------

            if (
                pdf_model
                and csv_model
                and pdf_model == csv_model
            ):

                matched_product = row
                break

            # ------------------------------------------------
            # Otherwise product name match
            # ------------------------------------------------

            if (
                pdf_name
                and csv_name
                and pdf_name == csv_name
            ):

                matched_product = row
                break

        # ====================================================
        # 12. FALLBACK TO FIRST CSV PRODUCT
        # ====================================================

        if matched_product is None:

            matched_product = csv_products[0]

        # ====================================================
        # 13. SOURCE RELIABILITY
        # ====================================================

        source_reliability = {

            "manufacturer_datasheet":
                get_source_reliability(
                    "manufacturer_datasheet"
                ),

            "user_csv":
                get_source_reliability(
                    "user_csv"
                ),
        }

        # ====================================================
        # 14. COMPARE SOURCES
        # ====================================================

        comparison = compare_products(
            pdf_product,
            matched_product,
            source_reliability,
        )

        # ====================================================
        # 15. RETURN MULTI-SOURCE RESULT
        # ====================================================

        return MultiSourceAnalysis(

            product=pdf_product,

            source_count=2,

            matches=comparison[
                "matches"
            ],

            total_compared=comparison[
                "total_compared"
            ],

            consistency_score=comparison[
                "consistency_score"
            ],

            conflict_count=comparison[
                "conflict_count"
            ],

            conflicts=comparison[
                "conflicts"
            ],

            missing=comparison[
                "missing"
            ],

            comparisons=comparison[
                "comparisons"
            ],

            source_reliability=source_reliability,
        )

    # ========================================================
    # HTTP ERRORS
    # ========================================================

    except HTTPException:

        raise

    # ========================================================
    # UNEXPECTED ERRORS
    # ========================================================

    except Exception as e:

        raise HTTPException(
            502,
            f"Multi-source analysis failed: {e}"
        )

    # ========================================================
    # CLEAN TEMPORARY FILES
    # ========================================================

    finally:

        if (
            pdf_path
            and os.path.exists(pdf_path)
        ):

            os.unlink(pdf_path)

        if (
            csv_path
            and os.path.exists(csv_path)
        ):

            os.unlink(csv_path)