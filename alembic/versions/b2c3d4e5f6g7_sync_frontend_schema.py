"""sync_frontend_schema

Revision ID: b2c3d4e5f6g7
Revises: a1b2c3d4e5f6
Create Date: 2026-01-11 23:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'b2c3d4e5f6g7'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # --- Users ---
    op.add_column('users', sa.Column('username', sa.String(), nullable=True))
    op.add_column('users', sa.Column('avatar_url', sa.String(), nullable=True))
    op.add_column('users', sa.Column('language', sa.String(), server_default='ru', nullable=False))
    op.add_column('users', sa.Column('balance', sa.Integer(), server_default='0', nullable=False))
    op.add_column('users', sa.Column('total_generations', sa.Integer(), server_default='0', nullable=False))
    op.add_column('users', sa.Column('total_credits_spent', sa.Integer(), server_default='0', nullable=False))
    op.add_column('users', sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False))
    
    op.create_unique_constraint(None, 'users', ['username'])
    
    # Backfill username from email
    op.execute("UPDATE users SET username = split_part(email, '@', 1) WHERE username IS NULL")
    
    # --- Jobs ---
    op.add_column('jobs', sa.Column('model_id', sa.UUID(), nullable=True))
    op.add_column('jobs', sa.Column('input_type', sa.String(), server_default='text', nullable=False))
    op.add_column('jobs', sa.Column('input_image_url', sa.String(), nullable=True))
    op.add_column('jobs', sa.Column('format', sa.String(), server_default='square', nullable=False))
    op.add_column('jobs', sa.Column('resolution', sa.String(), server_default='1080', nullable=False))
    op.add_column('jobs', sa.Column('duration', sa.Integer(), nullable=True))
    op.add_column('jobs', sa.Column('generation_params', sa.JSON(), nullable=True))
    op.add_column('jobs', sa.Column('views', sa.Integer(), server_default='0', nullable=False))
    op.add_column('jobs', sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True))
    
    op.create_foreign_key(None, 'jobs', 'ai_models', ['model_id'], ['id'])
    
    # --- AI Models ---
    op.add_column('ai_models', sa.Column('description', sa.Text(), nullable=True))
    op.add_column('ai_models', sa.Column('capabilities', sa.JSON(), nullable=True))
    op.add_column('ai_models', sa.Column('credits_per_generation', sa.Integer(), server_default='5', nullable=False))
    op.add_column('ai_models', sa.Column('total_generations', sa.Integer(), server_default='0', nullable=False))
    op.add_column('ai_models', sa.Column('average_rating', sa.Float(), nullable=True))
    
    # --- Ledger Entries ---
    op.add_column('ledger_entries', sa.Column('related_job_id', sa.String(), nullable=True))
    op.add_column('ledger_entries', sa.Column('payment_amount', sa.Integer(), nullable=True))
    op.add_column('ledger_entries', sa.Column('payment_currency', sa.String(), server_default='USD', nullable=False))
    op.add_column('ledger_entries', sa.Column('balance_before', sa.Integer(), nullable=True))
    op.add_column('ledger_entries', sa.Column('balance_after', sa.Integer(), nullable=True))
    
    op.create_foreign_key(None, 'ledger_entries', 'jobs', ['related_job_id'], ['id'])
    
    # --- Likes Table ---
    op.create_table('likes',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('job_id', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['job_id'], ['jobs.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'job_id', name='uq_user_job_like')
    )
    op.create_index(op.f('ix_likes_job_id'), 'likes', ['job_id'], unique=False)
    op.create_index(op.f('ix_likes_user_id'), 'likes', ['user_id'], unique=False)


def downgrade() -> None:
    # --- Likes ---
    op.drop_index(op.f('ix_likes_user_id'), table_name='likes')
    op.drop_index(op.f('ix_likes_job_id'), table_name='likes')
    op.drop_table('likes')
    
    # --- Ledger Entries ---
    op.drop_constraint(None, 'ledger_entries', type_='foreignkey')
    op.drop_column('ledger_entries', 'balance_after')
    op.drop_column('ledger_entries', 'balance_before')
    op.drop_column('ledger_entries', 'payment_currency')
    op.drop_column('ledger_entries', 'payment_amount')
    op.drop_column('ledger_entries', 'related_job_id')
    
    # --- AI Models ---
    op.drop_column('ai_models', 'average_rating')
    op.drop_column('ai_models', 'total_generations')
    op.drop_column('ai_models', 'credits_per_generation')
    op.drop_column('ai_models', 'capabilities')
    op.drop_column('ai_models', 'description')
    
    # --- Jobs ---
    op.drop_constraint(None, 'jobs', type_='foreignkey')
    op.drop_column('jobs', 'completed_at')
    op.drop_column('jobs', 'views')
    op.drop_column('jobs', 'generation_params')
    op.drop_column('jobs', 'duration')
    op.drop_column('jobs', 'resolution')
    op.drop_column('jobs', 'format')
    op.drop_column('jobs', 'input_image_url')
    op.drop_column('jobs', 'input_type')
    op.drop_column('jobs', 'model_id')
    
    # --- Users ---
    op.drop_constraint(None, 'users', type_='unique')
    op.drop_column('users', 'updated_at')
    op.drop_column('users', 'total_credits_spent')
    op.drop_column('users', 'total_generations')
    op.drop_column('users', 'balance')
    op.drop_column('users', 'language')
    op.drop_column('users', 'avatar_url')
    op.drop_column('users', 'username')
