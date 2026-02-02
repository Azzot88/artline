
import unittest
import sys
import os

sys.path.append(os.getcwd())

from app.domain.catalog.access_control import AccessControlService

class TestAccessControl(unittest.TestCase):
    def setUp(self):
        self.service = AccessControlService()

    def test_basic_access(self):
        config = {"access_tiers": ["pro"]}
        
        # Starter blocked
        self.assertFalse(self.service.can_access_parameter(config, "starter"))
        
        # Pro allowed
        self.assertTrue(self.service.can_access_parameter(config, "pro"))
        
        # Admin allowed
        self.assertTrue(self.service.can_access_parameter(config, "admin"))

    def test_wildcard_access(self):
        config = {"access_tiers": ["all"]}
        self.assertTrue(self.service.can_access_parameter(config, "starter"))
        self.assertTrue(self.service.can_access_parameter(config, "random_tier"))

    def test_hidden_override(self):
        config = {"hidden": True, "access_tiers": ["all"]}
        self.assertFalse(self.service.can_access_parameter(config, "admin"))

    def test_value_filtering(self):
        config = {"access_tiers": ["studio"]}
        self.assertFalse(self.service.can_access_value(config, "pro"))
        self.assertTrue(self.service.can_access_value(config, "studio"))

if __name__ == '__main__':
    unittest.main()
