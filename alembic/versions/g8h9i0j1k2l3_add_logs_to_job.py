"""add_logs_to_job

Revision ID: g8h9i0j1k2l3
Revises: b2c3d4e5f6g7
Create Date: 2024-03-20 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'g8h9i0j1k2l3'
down_revision = 'b2c3d4e5f6g7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('jobs', sa.Column('logs', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('jobs', 'logs')
