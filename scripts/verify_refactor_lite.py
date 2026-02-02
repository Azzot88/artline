
import unittest
import sys
import os

# Add app to path if needed (though usually docker working dir is root)
sys.path.append(os.getcwd())

from app.domain.providers.replicate.request_normalizer import ReplicateRequestNormalizer

class TestReplicateRefactor(unittest.TestCase):
    def setUp(self):
        self.normalizer = ReplicateRequestNormalizer()

    def test_basic_normalization(self):
        schema = {"inputs": [{"name": "prompt", "type": "string"}]}
        data = {"prompt": "  hello  "}
        result = self.normalizer.normalize(data, schema)
        self.assertEqual(result["prompt"], "hello")

    def test_cinema_resolution_logic(self):
        # Cinema Strategy: orientation + format -> width/height
        schema = {
            "inputs": [
                {"name": "width", "type": "integer"},
                {"name": "height", "type": "integer"},
                {"name": "orientation", "type": "string"}, # Not strictly in schema but passed in input?
                {"name": "format", "type": "string"}
            ]
        }
        
        # Case 1: Square HD
        data = {"orientation": "square", "format": "hd"}
        # Note: orientation/format might get filtered out if not in schema, 
        # BUT the strategy runs BEFORE filtering (on input_data keys).
        # And the strategy INJECTS width/height into input_data.
        # Then the normalizer keeps width/height if they are in schema.
        
        # Update: We need to ensure 'orientation' and 'format' are NOT in schema map 
        # for them to be ignored in final output? Or are they?
        # The normalizer loop iterates over INPUT keys.
        # If 'orientation' is in input but not in schema, it gets dropped.
        # But 'width'/'height' are injected into input.
        
        result = self.normalizer.normalize(data, schema)
        self.assertEqual(result.get("width"), 2048)
        self.assertEqual(result.get("height"), 2048)

    def test_native_override_priority(self):
        # If 'aspect_ratio' is present in input AND schema, Cinema logic should yield
        schema = {
            "inputs": [
                {"name": "aspect_ratio", "type": "string", "enum": ["16:9", "1:1"]},
                {"name": "width", "type": "integer"},
                {"name": "height", "type": "integer"}
            ]
        }
        data = {
            "orientation": "square", # Would normally set 1024x1024
            "format": "hd",          # Would normally set 2048x2048
            "aspect_ratio": "16:9"   # Override present
        }
        
        result = self.normalizer.normalize(data, schema)
        self.assertEqual(result.get("aspect_ratio"), "16:9")
        # Should NOT have overwritten width/height with Cinema defaults (unless specific logic applies)
        # The current Cinema implementation CHECKS for aspect_ratio presence and skips logic if found.
        # So width/height should be None (not in input) or whatever they were.
        self.assertIsNone(result.get("width"))

    def test_legacy_resolution_string(self):
        schema = {
            "inputs": [
                {"name": "width", "type": "integer"},
                {"name": "height", "type": "integer"}
            ]
        }
        data = {"resolution": "800x600"}
        result = self.normalizer.normalize(data, schema)
        self.assertEqual(result.get("width"), 800)
        self.assertEqual(result.get("height"), 600)
        
    def test_seed_minus_one(self):
        schema = {
            "inputs": [{"name": "seed", "type": "integer", "min": 0}]
        }
        data = {"seed": -1}
        result = self.normalizer.normalize(data, schema)
        self.assertEqual(result["seed"], -1)

    def test_type_coercion(self):
        schema = {"inputs": [{"name": "strength", "type": "float"}]}
        data = {"strength": "0.85"}
        result = self.normalizer.normalize(data, schema)
        self.assertEqual(result["strength"], 0.85)

if __name__ == '__main__':
    unittest.main()
