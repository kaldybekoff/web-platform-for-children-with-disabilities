"""add lesson_comments table

Revision ID: 014_add_lesson_comments
Revises: 0fabc3fafbce
Create Date: 2025-01-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = '014_add_lesson_comments'
down_revision = '0fabc3fafbce'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'lesson_comments',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('lesson_id', sa.Integer(), sa.ForeignKey('lessons.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('parent_id', sa.Integer(), sa.ForeignKey('lesson_comments.id', ondelete='CASCADE'), nullable=True),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
    )
    op.create_index('ix_lesson_comments_lesson_id', 'lesson_comments', ['lesson_id'])
    op.create_index('ix_lesson_comments_parent_id', 'lesson_comments', ['parent_id'])


def downgrade():
    op.drop_index('ix_lesson_comments_parent_id')
    op.drop_index('ix_lesson_comments_lesson_id')
    op.drop_table('lesson_comments')
