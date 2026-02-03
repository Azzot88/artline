
import sys
import os
import logging
import json

# Add app to path
sys.path.append(os.getcwd())

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_extract_input_properties():
    logger.info("Testing extract_input_properties (Logic used in Schema Visualizer)...")
    
    try:
        from app.domain.catalog.schema_utils import extract_input_properties
    except ImportError:
        logger.error("Could not import extract_input_properties. Check python path.")
        sys.exit(1)

    # 1. Standard Replicate Schema (Nested in components/schemas/Input)
    replicate_schema = {
        "openapi": "3.0.0",
        "components": {
            "schemas": {
                "Input": {
                    "type": "object",
                    "properties": {
                        "prompt": {"type": "string"},
                        "width": {"type": "integer"}
                    },
                    "required": ["prompt"]
                },
                "Output": {"type": "array"}
            }
        }
    }

    logger.info("  Testing Standard Replicate Schema...")
    extracted = extract_input_properties(replicate_schema)
    assert "prompt" in extracted, "Missing prompt"
    assert "width" in extracted, "Missing width"
    assert extracted["prompt"]["type"] == "string"
    assert extracted["width"]["type"] == "integer"
    logger.info("    [Pass] Standard Replicate Schema")

    # 2. Flat Schema (Direct properties)
    flat_schema = {
        "type": "object",
        "properties": {
            "seed": {"type": "integer"}
        }
    }
    
    logger.info("  Testing Flat Schema...")
    extracted_flat = extract_input_properties(flat_schema)
    assert "seed" in extracted_flat
    logger.info("    [Pass] Flat Schema")

    # 3. Cog/Pydantic style (refs?)
    # ... assume standard behavior

    logger.info("Input Extraction Logic Verified.")

if __name__ == "__main__":
    try:
        test_extract_input_properties()
        print("\n✅ Schema Visualizer Backend Logic Verified")
    except Exception as e:
        logger.error(f"Verification Failed: {e}")
        sys.exit(1)
