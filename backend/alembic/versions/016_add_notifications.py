"""add notifications table

Revision ID: 016_add_notifications
Revises: 015_merge_013_014
Create Date: 2025-01-01 00:00:02.000000
"""
from alembic import op
import sqlalchemy as sa

revision = '016_add_notifications'
down_revision = '015_merge_013_014'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'notifications',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('type', sa.String(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('body', sa.Text(), nullable=False),
        sa.Column('lesson_id', sa.Integer(), sa.ForeignKey('lessons.id', ondelete='SET NULL'), nullable=True),
        sa.Column('is_read', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
    )
    op.create_index('ix_notifications_user_id', 'notifications', ['user_id'])
    op.create_index('ix_notifications_is_read', 'notifications', ['is_read'])


def downgrade():
    op.drop_index('ix_notifications_is_read')
    op.drop_index('ix_notifications_user_id')
    op.drop_table('notifications')
