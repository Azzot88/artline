"""add_ui_config_and_cover

Revision ID: f90912121212
Revises: e092ab322305
Create Date: 2025-12-30 08:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'f90912121212'
down_revision = 'e092ab322305'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add ui_config column
    op.add_column('ai_models', sa.Column('ui_config', sa.JSON(), nullable=True))
    # Add cover_image_url column
    op.add_column('ai_models', sa.Column('cover_image_url', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('ai_models', 'cover_image_url')
    op.drop_column('ai_models', 'ui_config')
