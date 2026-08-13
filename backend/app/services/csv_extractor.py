import csv
from pathlib import Path
from typing import Any


def extract_csv_products(file_path: str) -> list[dict[str, Any]]:
    """
    Read product records from a CSV catalog.

    Each row becomes one product dictionary.
    """

    path = Path(file_path)

    if not path.exists():
        raise FileNotFoundError(f"CSV file not found: {file_path}")

    products = []

    with path.open("r", encoding="utf-8-sig", newline="") as file:
        reader = csv.DictReader(file)

        if not reader.fieldnames:
            raise ValueError("CSV file does not contain a header row.")

        for row_number, row in enumerate(reader, start=2):
            cleaned = {}

            for key, value in row.items():
                if key is None:
                    continue

                clean_key = key.strip().lower()
                clean_value = value.strip() if value else ""

                cleaned[clean_key] = clean_value

            if any(cleaned.values()):
                cleaned["_row_number"] = row_number
                products.append(cleaned)

    return products