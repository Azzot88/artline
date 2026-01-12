
import sys
import os

# Add app to path
sys.path.append(os.getcwd())

from app.domain.users.models import User
from app.domain.jobs.models import Job
from app.domain.providers.models import AIModel
from app.domain.billing.models import LedgerEntry
from app.domain.users.likes_model import Like
from app.schemas import UserRead, JobRead
from pydantic import BaseModel

def check_field_exists(model_class, schema_class=None, expected_fields=None, field_map=None):
    if field_map is None:
        field_map = {}
        
    print(f"\nChecking {model_class.__name__}...")
    
    if schema_class:
        check_fields = schema_class.model_fields.keys()
        print(f"  Against Schema: {schema_class.__name__}")
    else:
        check_fields = expected_fields
        print(f"  Against Expected Fields List")
    
    model_columns = [c.name for c in model_class.__table__.columns]
    
    missing = []
    for field in check_fields:
        # Check explicit map or direct name
        model_field = field_map.get(field, field)
        
        if model_field not in model_columns:
            # Check if it's a property or relationship (simple check)
            if not hasattr(model_class, model_field):
                missing.append(field)
            else:
                print(f"  [OK] {field} (property/relationship)")
        else:
            print(f"  [OK] {field}")
            
    if missing:
        print(f"❌ MISSING FIELDS in DB Model {model_class.__name__}: {missing}")
        return False
    
    print(f"✅ Model {model_class.__name__} has all required fields.")
    return True

print("=== VERIFYING SCHEMA CONSISTENCY ===")

# 1. User
check_field_exists(User, schema_class=UserRead)

# 2. Job
# Map credits_spent (schema) -> credits_spent (property)
check_field_exists(Job, schema_class=JobRead)

# 3. AIModel (No public schema yet, checking expected fields)
ai_model_fields = [
    'description', 'capabilities', 'credits_per_generation', 
    'total_generations', 'average_rating'
]
check_field_exists(AIModel, expected_fields=ai_model_fields)

# 4. LedgerEntry
ledger_fields = [
    'related_job_id', 'payment_amount', 'payment_currency', 
    'balance_before', 'balance_after'
]
check_field_exists(LedgerEntry, expected_fields=ledger_fields)

# 5. Like
like_fields = ['user_id', 'job_id']
check_field_exists(Like, expected_fields=like_fields)

print("\n=== VERIFICATION COMPLETE ===")
