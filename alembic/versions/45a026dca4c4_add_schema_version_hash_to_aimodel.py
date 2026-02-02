"""Add schema_version_hash to AIModel

Revision ID: 45a026dca4c4
Revises: h1i2j3k4l5m6
Create Date: 2026-02-01 21:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '45a026dca4c4'
down_revision = 'h1i2j3k4l5m6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('ai_models', sa.Column('schema_version_hash', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('ai_models', 'schema_version_hash')
