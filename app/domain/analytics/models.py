from sqlalchemy import Column, String, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.core.database import Base

class UserActivity(Base):
    __tablename__ = "user_activity"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    guest_id = Column(String, nullable=True) # Stored as string from cookie
    
    action = Column(String, nullable=False, index=True) # e.g. "login", "register", "generate"
    details = Column(JSONB, nullable=True) # Metadata: model_id, error_msg, etc.
    
    path = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    user = relationship("User", backref="activities")
