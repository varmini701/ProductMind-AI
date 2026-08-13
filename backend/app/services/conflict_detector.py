from typing import Any


# ============================================================
# ATTRIBUTE ALIASES
# ============================================================

ATTRIBUTE_ALIASES = {
    "material": [
        "material",
    ],

    "size": [
        "size",
        "nominal_size",
        "diameter",
    ],

    "connection": [
        "connection",
        "connection_type",
    ],

    "pressure_rating": [
        "pressure_rating",
        "pressure",
        "pressure_class",
    ],

    "temperature_range": [
        "temperature_range",
        "temperature",
        "operating_temperature",
    ],
}


# ============================================================
# NORMALIZATION
# ============================================================

def normalize_name(value: Any) -> str:
    """
    Normalize attribute names.

    Examples:

        Pressure Rating
        pressure_rating
        pressure-rating

    all become:

        pressurerating
    """

    if value is None:
        return ""

    value = str(value).strip().lower()

    return (
        value
        .replace("_", "")
        .replace("-", "")
        .replace(" ", "")
    )


def normalize_value(value: Any) -> str:
    """
    Normalize actual attribute values before comparison.
    """

    if value is None:
        return ""

    return " ".join(
        str(value)
        .strip()
        .lower()
        .split()
    )


# ============================================================
# ATTRIBUTE HELPERS
# ============================================================

def get_attribute(product: Any, attribute: str) -> str:
    """
    Get an attribute value from either:

    1. CSV dictionary
    2. ExtractedProduct Pydantic model
    """

    possible_names = ATTRIBUTE_ALIASES.get(
        attribute,
        [attribute],
    )

    # --------------------------------------------------------
    # CSV PRODUCT
    # --------------------------------------------------------

    if isinstance(product, dict):

        # Make CSV lookup case-insensitive and
        # tolerant of _, -, and spaces.
        normalized_product = {
            normalize_name(key): value
            for key, value in product.items()
        }

        for name in possible_names:

            normalized_name = normalize_name(name)

            value = normalized_product.get(
                normalized_name
            )

            if (
                value is not None
                and str(value).strip()
            ):
                return str(value).strip()

        return ""

    # --------------------------------------------------------
    # EXTRACTED PRODUCT
    # --------------------------------------------------------

    if hasattr(product, "attributes"):

        for item in product.attributes:

            normalized_name = normalize_name(
                item.name
            )

            for name in possible_names:

                if (
                    normalized_name
                    == normalize_name(name)
                ):

                    if item.value is None:
                        return ""

                    return str(
                        item.value
                    ).strip()

    return ""


def get_pdf_attribute(
    product: Any,
    attribute: str,
):
    """
    Return the complete PDF attribute object.

    This allows us to retrieve:

    - value
    - source page
    - source evidence
    - confidence
    """

    if not hasattr(product, "attributes"):
        return None

    possible_names = ATTRIBUTE_ALIASES.get(
        attribute,
        [attribute],
    )

    for item in product.attributes:

        normalized_name = normalize_name(
            item.name
        )

        for name in possible_names:

            if (
                normalized_name
                == normalize_name(name)
            ):
                return item

    return None


# ============================================================
# SOURCE AUTHORITY
# ============================================================

def get_authority(
    source_reliability: dict,
    source_name: str,
) -> float:
    """
    Safely extract source reliability.

    Supports BOTH formats:

    Format 1:
        {
            "manufacturer_datasheet": 95,
            "user_csv": 70
        }

    Format 2:
        {
            "manufacturer_datasheet": {
                "label": "Manufacturer Datasheet",
                "score": 95
            },
            "user_csv": {
                "label": "Product Catalog CSV",
                "score": 70
            }
        }

    The second format is what your current
    source_reliability.py returns.
    """

    if not isinstance(
        source_reliability,
        dict
    ):
        return 0.0

    value = source_reliability.get(
        source_name
    )

    if value is None:
        return 0.0

    # --------------------------------------------------------
    # NEW / CURRENT FORMAT
    #
    # {
    #     "label": "...",
    #     "score": 95
    # }
    # --------------------------------------------------------

    if isinstance(value, dict):

        score = value.get(
            "score",
            0,
        )

        try:
            return float(score)

        except (
            TypeError,
            ValueError,
        ):
            return 0.0

    # --------------------------------------------------------
    # OLD / NUMERIC FORMAT
    #
    # "manufacturer_datasheet": 95
    # --------------------------------------------------------

    try:

        return float(value)

    except (
        TypeError,
        ValueError,
    ):

        return 0.0


# ============================================================
# SOURCE LABEL
# ============================================================

def get_source_label(
    source_reliability: dict,
    source_name: str,
    default_label: str,
) -> str:
    """
    Safely retrieve a human-readable source label.
    """

    if not isinstance(
        source_reliability,
        dict
    ):
        return default_label

    value = source_reliability.get(
        source_name
    )

    if isinstance(value, dict):

        return str(
            value.get(
                "label",
                default_label,
            )
        )

    return default_label


# ============================================================
# MAIN COMPARISON ENGINE
# ============================================================

def compare_products(
    pdf_product: Any,
    csv_product: dict,
    source_reliability: dict | None = None,
) -> dict:
    """
    Compare manufacturer PDF information
    against product catalog CSV information.

    Produces:

    - matches
    - missing attributes
    - conflicts
    - source evidence
    - explainable resolution
    """

    # --------------------------------------------------------
    # Default source reliability
    # --------------------------------------------------------

    if source_reliability is None:

        source_reliability = {
            "manufacturer_datasheet": 95,
            "user_csv": 70,
        }

    # --------------------------------------------------------
    # Attributes to compare
    # --------------------------------------------------------

    attributes = [
        "material",
        "size",
        "connection",
        "pressure_rating",
        "temperature_range",
    ]

    comparisons = []
    conflicts = []
    matches = []
    missing = []

    # --------------------------------------------------------
    # SOURCE AUTHORITY
    # --------------------------------------------------------

    pdf_authority = get_authority(
        source_reliability,
        "manufacturer_datasheet",
    )

    csv_authority = get_authority(
        source_reliability,
        "user_csv",
    )

    # ========================================================
    # COMPARE EACH ATTRIBUTE
    # ========================================================

    for attribute in attributes:

        # ----------------------------------------------------
        # Get PDF value
        # ----------------------------------------------------

        pdf_value = get_attribute(
            pdf_product,
            attribute,
        )

        # ----------------------------------------------------
        # Get CSV value
        # ----------------------------------------------------

        csv_value = get_attribute(
            csv_product,
            attribute,
        )

        # ----------------------------------------------------
        # Normalize values
        # ----------------------------------------------------

        normalized_pdf = normalize_value(
            pdf_value
        )

        normalized_csv = normalize_value(
            csv_value
        )

        # ====================================================
        # NOTHING AVAILABLE
        # ====================================================

        if not pdf_value and not csv_value:
            continue

        # ====================================================
        # MATCH
        # ====================================================

        if (
            normalized_pdf
            and normalized_csv
            and normalized_pdf
            == normalized_csv
        ):

            status = "match"

            matches.append(
                attribute
            )

        # ====================================================
        # ONE SOURCE MISSING
        # ====================================================

        elif not pdf_value or not csv_value:

            status = "missing"

            missing.append(
                {
                    "attribute": attribute,
                    "pdf_value": pdf_value,
                    "csv_value": csv_value,
                }
            )

        # ====================================================
        # CONFLICT
        # ====================================================

        else:

            status = "conflict"

            # ------------------------------------------------
            # Safety/specification critical attributes
            # ------------------------------------------------

            if attribute in [
                "pressure_rating",
                "temperature_range",
            ]:

                severity = "high"

            else:

                severity = "medium"

            # ------------------------------------------------
            # PDF EVIDENCE
            # ------------------------------------------------

            pdf_attribute = get_pdf_attribute(
                pdf_product,
                attribute,
            )

            pdf_page = None
            pdf_evidence = None

            if pdf_attribute:

                pdf_page = (
                    pdf_attribute.source_page
                )

                pdf_evidence = (
                    pdf_attribute.source_text
                )

            # ------------------------------------------------
            # CSV EVIDENCE
            # ------------------------------------------------

            csv_evidence = (
                f"{attribute}: {csv_value}"
            )

            # ------------------------------------------------
            # SOURCE LABELS
            # ------------------------------------------------

            pdf_source_label = get_source_label(
                source_reliability,
                "manufacturer_datasheet",
                "Manufacturer Datasheet",
            )

            csv_source_label = get_source_label(
                source_reliability,
                "user_csv",
                "Product Catalog CSV",
            )

            # =================================================
            # PREFERRED SOURCE = PDF
            # =================================================

            if pdf_authority >= csv_authority:

                recommended_value = (
                    pdf_value
                )

                preferred_source = (
                    pdf_source_label
                )

                preferred_authority = (
                    pdf_authority
                )

                conflicting_authority = (
                    csv_authority
                )

                resolution_reason = (
                    f"The {pdf_source_label} has a "
                    f"higher source-authority score "
                    f"of {pdf_authority:.0f}% compared "
                    f"with the conflicting "
                    f"{csv_source_label}, which has "
                    f"an authority score of "
                    f"{csv_authority:.0f}%. "
                    f"ProductMind therefore "
                    f"recommends {pdf_value} as the "
                    f"preferred value while flagging "
                    f"the discrepancy for human "
                    f"verification before publication."
                )

            # =================================================
            # PREFERRED SOURCE = CSV
            # =================================================

            else:

                recommended_value = (
                    csv_value
                )

                preferred_source = (
                    csv_source_label
                )

                preferred_authority = (
                    csv_authority
                )

                conflicting_authority = (
                    pdf_authority
                )

                resolution_reason = (
                    f"The {csv_source_label} has a "
                    f"higher source-authority score "
                    f"of {csv_authority:.0f}% compared "
                    f"with the conflicting "
                    f"{pdf_source_label}, which has "
                    f"an authority score of "
                    f"{pdf_authority:.0f}%. "
                    f"ProductMind therefore "
                    f"recommends {csv_value} as the "
                    f"preferred value while flagging "
                    f"the discrepancy for human "
                    f"verification before publication."
                )

            # =================================================
            # CREATE CONFLICT RECORD
            # =================================================

            conflicts.append(
                {
                    "attribute": attribute,

                    "pdf_value": pdf_value,

                    "csv_value": csv_value,

                    "severity": severity,

                    "pdf_source": (
                        pdf_source_label
                    ),

                    "csv_source": (
                        csv_source_label
                    ),

                    "pdf_page": pdf_page,

                    "pdf_evidence": pdf_evidence,

                    "csv_evidence": csv_evidence,

                    "recommended_value": (
                        recommended_value
                    ),

                    "preferred_source": (
                        preferred_source
                    ),

                    "preferred_source_authority": (
                        preferred_authority
                    ),

                    "conflicting_source_authority": (
                        conflicting_authority
                    ),

                    "resolution_reason": (
                        resolution_reason
                    ),

                    "verification_status": (
                        "needs_review"
                    ),
                }
            )

        # ====================================================
        # STORE COMPARISON
        # ====================================================

        comparisons.append(
            {
                "attribute": attribute,

                "pdf_value": pdf_value,

                "csv_value": csv_value,

                "status": status,
            }
        )

    # ========================================================
    # CONSISTENCY SCORE
    # ========================================================

    total = len(comparisons)

    if total > 0:

        consistency_score = round(
            (
                len(matches)
                / total
            )
            * 100,
            1,
        )

    else:

        consistency_score = 0

    # ========================================================
    # RETURN RESULT
    # ========================================================

    return {
        "comparisons": comparisons,

        "conflicts": conflicts,

        "missing": missing,

        "matches": len(matches),

        "total_compared": total,

        "consistency_score": (
            consistency_score
        ),

        "conflict_count": len(
            conflicts
        ),
    }