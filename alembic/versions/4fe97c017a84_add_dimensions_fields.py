"""add_dimensions_fields

Revision ID: 4fe97c017a84
Revises: g8h9i0j1k2l3
Create Date: 2026-01-17 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4fe97c017a84'
down_revision: Union[str, None] = 'g8h9i0j1k2l3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('jobs', sa.Column('width', sa.Integer(), nullable=True))
    op.add_column('jobs', sa.Column('height', sa.Integer(), nullable=True))
    op.add_column('jobs', sa.Column('duration', sa.Integer(), nullable=True))
    op.add_column('jobs', sa.Column('cover_image_url', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('jobs', 'cover_image_url')
    op.drop_column('jobs', 'duration')
    op.drop_column('jobs', 'height')
    op.drop_column('jobs', 'width')
