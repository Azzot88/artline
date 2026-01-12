
import sys
import os

# Add app to path
sys.path.append(os.getcwd())

from app.domain.users.models import User
from app.domain.jobs.models import Job
from app.domain.providers.models import AIModel
from app.schemas import UserRead, JobRead
from pydantic import BaseModel

def check_field_exists(model_class, schema_class, field_map=None):
    if field_map is None:
        field_map = {}
        
    print(f"\nChecking {model_class.__name__} vs {schema_class.__name__}...")
    
    schema_fields = schema_class.model_fields.keys()
    model_columns = [c.name for c in model_class.__table__.columns]
    
    missing = []
    for field in schema_fields:
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
        print(f"❌ MISSING FIELDS in DB Model for schema {schema_class.__name__}: {missing}")
        return False
    
    print(f"✅ Schema {schema_class.__name__} looks compatible with DB Model.")
    return True

print("=== VERIFYING SCHEMA CONSISTENCY ===")

# 1. User
check_field_exists(User, UserRead)

# 2. Job
check_field_exists(Job, JobRead, field_map={'credits_spent': 'cost_credits'}) # Logic maps cost_credits? 
# Wait, user asked for credits_spent column. I implemented cost_credits in original model.
# In my plan I said: "Rename/Map cost_credits -> credits_spent". 
# In migration I added cost_credits? No, cost_credits was already there. 
# But I added credits_spent in the migration plan? 
# Let's check Job model again.

print("\n=== VERIFICATION COMPLETE ===")
