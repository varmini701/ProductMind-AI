import json
from openai import OpenAI
from app.config import OPENAI_API_KEY, OPENAI_MODEL
from app.schemas import ExtractedProduct, EnrichmentResult

EXTRACTION_SCHEMA = {
    "type":"object",
    "properties":{
        "product_name":{"type":"string"},
        "manufacturer":{"type":["string","null"]},
        "model":{"type":["string","null"]},
        "category":{"type":"string"},
        "subcategory":{"type":["string","null"]},
        "attributes":{"type":"array","items":{"type":"object","properties":{
            "name":{"type":"string"},"value":{"type":"string"},"confidence":{"type":"number"},
            "source_page":{"type":["integer","null"]},"source_text":{"type":["string","null"]}
        },"required":["name","value","confidence","source_page","source_text"],"additionalProperties":False}},
        "description":{"type":["string","null"]},
        "applications":{"type":"array","items":{"type":"string"}},
        "keywords":{"type":"array","items":{"type":"string"}}
    },
    "required":["product_name","manufacturer","model","category","subcategory","attributes","description","applications","keywords"],
    "additionalProperties":False
}

ENRICHMENT_SCHEMA = {
    "type":"object",
    "properties":{
        "description":{"type":"string"},
        "feature_bullets":{"type":"array","items":{"type":"string"}},
        "applications":{"type":"array","items":{"type":"string"}},
        "search_keywords":{"type":"array","items":{"type":"string"}}
    },
    "required":["description","feature_bullets","applications","search_keywords"],
    "additionalProperties":False
}

def client():
    if not OPENAI_API_KEY:
        raise RuntimeError("OPENAI_API_KEY is missing. Put it in backend/.env or use MOCK_MODE=true.")
    return OpenAI(api_key=OPENAI_API_KEY)

def extract_product(context: str) -> ExtractedProduct:
    response = client().responses.create(
        model=OPENAI_MODEL,
        instructions=("You are ProductMind AI, an industrial product intelligence engine. "
                      "Extract one canonical product from the supplied technical document. "
                      "Never invent specifications. Only use supplied evidence. Preserve units. "
                      "For every attribute provide confidence, page and short evidence text. "
                      "If a value is absent, do not guess."),
        input=context,
        text={"format":{"type":"json_schema","name":"product_extraction",
                         "description":"Canonical industrial product record",
                         "strict":True,"schema":EXTRACTION_SCHEMA}}
    )
    return ExtractedProduct.model_validate(json.loads(response.output_text))

def enrich_product(product: ExtractedProduct) -> EnrichmentResult:
    verified = product.model_dump_json(indent=2)
    response = client().responses.create(
        model=OPENAI_MODEL,
        instructions=("You are an industrial B2B product-content enrichment engine. "
                      "Generate commerce-ready content ONLY from verified product data. "
                      "Do not invent certifications, performance claims, dimensions, materials, "
                      "compatibility, safety claims, pressure/temperature ratings or unsupported applications."),
        input=f"Verified product data:\n{verified}",
        text={"format":{"type":"json_schema","name":"product_enrichment",
                         "description":"Safe product enrichment based only on verified data",
                         "strict":True,"schema":ENRICHMENT_SCHEMA}}
    )
    return EnrichmentResult.model_validate(json.loads(response.output_text))
