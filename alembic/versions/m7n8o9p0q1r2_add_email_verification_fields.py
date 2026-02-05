"""add_email_verification_fields

Revision ID: m7n8o9p0q1r2
Revises: h1i2j3k4l5m6
Create Date: 2026-02-05 08:21:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'm7n8o9p0q1r2'
down_revision = '45a026dca4c4'  # Fixed: actual current version from server
branch_labels = None
depends_on = None



def upgrade() -> None:
    # Add email verification fields to users table
    op.add_column('users', sa.Column('is_email_verified', sa.Boolean(), server_default='false', nullable=False))
    op.add_column('users', sa.Column('email_verification_code', sa.String(length=6), nullable=True))
    op.add_column('users', sa.Column('email_verification_code_expires_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('users', sa.Column('email_verification_sent_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('users', sa.Column('email_verification_reminder_3d_sent', sa.Boolean(), server_default='false', nullable=False))
    op.add_column('users', sa.Column('email_verification_reminder_15d_sent', sa.Boolean(), server_default='false', nullable=False))
    
    # Create index for efficient querying of unverified users
    op.create_index(op.f('ix_users_is_email_verified'), 'users', ['is_email_verified'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_users_is_email_verified'), table_name='users')
    op.drop_column('users', 'email_verification_reminder_15d_sent')
    op.drop_column('users', 'email_verification_reminder_3d_sent')
    op.drop_column('users', 'email_verification_sent_at')
    op.drop_column('users', 'email_verification_code_expires_at')
    op.drop_column('users', 'email_verification_code')
    op.drop_column('users', 'is_email_verified')
