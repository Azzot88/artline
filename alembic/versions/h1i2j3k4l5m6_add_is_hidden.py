"""add_is_private_to_job

Revision ID: h1i2j3k4l5m6
Revises: g8h9i0j1k2l3
Create Date: 2026-01-27 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'h1i2j3k4l5m6'
down_revision = ('g8h9i0j1k2l3', 'c39d54744f15')
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('jobs', sa.Column('is_private', sa.Boolean(), server_default='false', nullable=False))
    op.create_index(op.f('ix_jobs_is_private'), 'jobs', ['is_private'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_jobs_is_private'), table_name='jobs')
    op.drop_column('jobs', 'is_private')
