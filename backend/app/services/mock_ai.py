from app.schemas import ExtractedProduct, Attribute, EnrichmentResult

def mock_product():
    return ExtractedProduct(product_name="2-Inch Stainless Steel Ball Valve", manufacturer="Acme Industrial", model="BV-200",
        category="Ball Valve", subcategory="Industrial Ball Valve", attributes=[
        Attribute(name="Material", value="Stainless Steel", confidence=.98, source_page=1, source_text="Material: Stainless Steel"),
        Attribute(name="Size", value="2 inch", confidence=.96, source_page=1, source_text="Size: 2 inch"),
        Attribute(name="Connection", value="FNPT", confidence=.94, source_page=1, source_text="Connection: FNPT"),
        Attribute(name="Pressure Rating", value="600 WOG", confidence=.96, source_page=1, source_text="Pressure Rating: 600 WOG"),
        Attribute(name="Temperature Range", value="-20 F to 400 F", confidence=.91, source_page=1, source_text="Temperature Range: -20 F to 400 F")],
        applications=["Industrial fluid control","Water systems"], keywords=["2 inch ball valve","stainless steel ball valve","600 WOG valve"])

def mock_enrichment():
    return EnrichmentResult(description="2-inch stainless steel ball valve with FNPT connections and a 600 WOG pressure rating for industrial fluid-control applications.",
        feature_bullets=["Stainless steel construction","2-inch nominal size","FNPT connection","600 WOG pressure rating","-20 F to 400 F temperature range"],
        applications=["Industrial fluid control","Water systems"], search_keywords=["2 inch stainless steel ball valve","600 WOG ball valve","FNPT ball valve"])
