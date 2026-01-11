"""add_curated_gallery_fields

Revision ID: a1b2c3d4e5f6
Revises: 32490e85b63a
Create Date: 2026-01-10 22:15:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = '32490e85b63a'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('jobs', sa.Column('is_public', sa.Boolean(), server_default='false', nullable=False))
    op.add_column('jobs', sa.Column('is_curated', sa.Boolean(), server_default='false', nullable=False))
    op.add_column('jobs', sa.Column('likes', sa.Integer(), server_default='0', nullable=False))
    op.create_index(op.f('ix_jobs_is_public'), 'jobs', ['is_public'], unique=False)
    op.create_index(op.f('ix_jobs_is_curated'), 'jobs', ['is_curated'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_jobs_is_curated'), table_name='jobs')
    op.drop_index(op.f('ix_jobs_is_public'), table_name='jobs')
    op.drop_column('jobs', 'likes')
    op.drop_column('jobs', 'is_curated')
    op.drop_column('jobs', 'is_public')
