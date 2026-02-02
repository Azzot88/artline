
from typing import Dict, Any, List, Optional

class AccessControlService:
    """
    Central service for managing user access to catalog items, parameters, and values.
    """
    
    def __init__(self):
        # Hierarchy definition could be moved to config/DB
        self.tier_levels = {"starter": 1, "pro": 2, "studio": 3, "admin": 99}

    def can_access_parameter(self, param_config: Dict[str, Any], user_tier: str) -> bool:
        """
        Determines visibility of a parameter based on user/subscription tier.
        
        :param param_config: UI Config dictionary for the parameter
        :param user_tier: Current user's tier identifier
        :return: True if access is allowed
        """
        # 1. Global Visibility Override
        if param_config.get("hidden") is True:
            return False

        # 2. Tiered Access Check
        allowed_tiers = param_config.get("access_tiers")
        
        # If no access control defined, it's public (unless hidden above)
        if not allowed_tiers or len(allowed_tiers) == 0:
            return True
            
        # Admin Bypass
        if user_tier == "admin":
            return True
            
        # Explicit Allow
        if "all" in allowed_tiers:
            return True
            
        return user_tier in allowed_tiers

    def can_access_value(self, value_config: Dict[str, Any], user_tier: str) -> bool:
        """
        Determines visibility of a specific parameter value option.
        """
        allowed_tiers = value_config.get("access_tiers")
        
        if not allowed_tiers or len(allowed_tiers) == 0:
            return True
            
        if user_tier == "admin":
            return True
            
        if "all" in allowed_tiers:
            return True
            
        return user_tier in allowed_tiers
