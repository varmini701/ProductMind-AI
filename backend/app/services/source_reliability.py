# ============================================================
# SOURCE RELIABILITY CONFIGURATION
# ============================================================

SOURCE_RELIABILITY = {
    "manufacturer_datasheet": {
        "label": "Manufacturer Datasheet",
        "score": 95,
    },

    "manufacturer_website": {
        "label": "Manufacturer Website",
        "score": 95,
    },

    "official_catalog": {
        "label": "Official Catalog",
        "score": 90,
    },

    "distributor_catalog": {
        "label": "Distributor Catalog",
        "score": 75,
    },

    "user_csv": {
        "label": "Product Catalog CSV",
        "score": 70,
    },
}


# ============================================================
# GET SOURCE RELIABILITY
# ============================================================

def get_source_reliability(source_type: str) -> dict:
    """
    Return reliability information for a given source type.

    Example:

        get_source_reliability("manufacturer_datasheet")

    returns:

        {
            "label": "Manufacturer Datasheet",
            "score": 95
        }
    """

    # Normalize input
    source_type = str(source_type).strip().lower()

    # Return configured source reliability
    if source_type in SOURCE_RELIABILITY:
        return SOURCE_RELIABILITY[source_type]

    # Default reliability for unknown sources
    return {
        "label": source_type,
        "score": 50,
    }


# ============================================================
# GET SOURCE SCORE
# ============================================================

def get_source_score(source_type: str) -> int:
    """
    Return only the numerical reliability score.

    Example:

        get_source_score("manufacturer_datasheet")
        -> 95
    """

    reliability = get_source_reliability(source_type)

    return int(reliability.get("score", 50))


# ============================================================
# GET SOURCE LABEL
# ============================================================

def get_source_label(source_type: str) -> str:
    """
    Return the human-readable source label.

    Example:

        get_source_label("user_csv")
        -> "Product Catalog CSV"
    """

    reliability = get_source_reliability(source_type)

    return reliability.get(
        "label",
        source_type
    )