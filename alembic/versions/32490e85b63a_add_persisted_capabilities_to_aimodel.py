"""Add persisted capabilities to AIModel

Revision ID: 32490e85b63a
Revises: 5a6d30608cf6
Create Date: 2026-01-05 02:00:25.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '32490e85b63a'
down_revision = '5a6d30608cf6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add replicate_owner column
    op.add_column('ai_models', sa.Column('replicate_owner', sa.String(), nullable=True))
    # Add replicate_name column
    op.add_column('ai_models', sa.Column('replicate_name', sa.String(), nullable=True))
    # Add raw_schema_json column
    op.add_column('ai_models', sa.Column('raw_schema_json', sa.JSON(), nullable=True))
    # Add normalized_caps_json column
    op.add_column('ai_models', sa.Column('normalized_caps_json', sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column('ai_models', 'normalized_caps_json')
    op.drop_column('ai_models', 'raw_schema_json')
    op.drop_column('ai_models', 'replicate_name')
    op.drop_column('ai_models', 'replicate_owner')
