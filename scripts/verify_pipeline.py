
import unittest
import sys
import os
import json

sys.path.append(os.getcwd())

from app.domain.catalog.pipeline import SchemaProcessingPipeline

class TestSchemaPipeline(unittest.TestCase):
    def setUp(self):
        self.pipeline = SchemaProcessingPipeline()

    def test_pipeline_hashing(self):
        schema = {"properties": {"prompt": {"type": "string"}}}
        config = {"prompt": {"label": "Custom"}}
        
        spec1, hash1 = self.pipeline.process("m1", schema, config, "starter")
        spec2, hash2 = self.pipeline.process("m1", schema, config, "starter")
        
        self.assertEqual(hash1, hash2)
        
        # Change config
        config2 = {"prompt": {"label": "Custom 2"}}
        spec3, hash3 = self.pipeline.process("m1", schema, config2, "starter")
        
        self.assertNotEqual(hash1, hash3)
        self.assertEqual(spec3.parameters[0].label, "Custom 2")

    def test_pipeline_integration(self):
        # A semi-complex schema
        schema = {
            "components": {
                "schemas": {
                    "Input": {
                        "properties": {
                            "prompt": {"type": "string"},
                            "steps": {"type": "integer", "default": 20},
                            "secret_param": {"type": "string"}
                        }
                    }
                }
            }
        }
        
        # Config hidden
        config = {
            "secret_param": {"hidden": True},
            "steps": {"access_tiers": ["pro"]}
        }
        
        # 1. Starter Tier (should not see steps, should not see secret)
        spec, _ = self.pipeline.process("m1", schema, config, "starter")
        param_ids = [p.id for p in spec.parameters]
        self.assertIn("prompt", param_ids)
        self.assertNotIn("steps", param_ids)       # Tier restricted
        self.assertNotIn("secret_param", param_ids) # Hidden
        
        # 2. Pro Tier (should see steps)
        spec_pro, _ = self.pipeline.process("m1", schema, config, "pro")
        param_ids_pro = [p.id for p in spec_pro.parameters]
        self.assertIn("steps", param_ids_pro)

if __name__ == '__main__':
    unittest.main()
