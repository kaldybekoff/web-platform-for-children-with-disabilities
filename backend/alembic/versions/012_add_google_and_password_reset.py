"""add google_id and password reset fields to users

Revision ID: 012
Revises: 011
Create Date: 2026-04-18

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "012"
down_revision: Union[str, None] = "011"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("google_id", sa.String(), nullable=True))
    op.add_column("users", sa.Column("reset_token", sa.String(), nullable=True))
    op.add_column("users", sa.Column("reset_token_expires", sa.DateTime(), nullable=True))
    op.create_index("ix_users_google_id", "users", ["google_id"], unique=False)
    op.create_index("ix_users_reset_token", "users", ["reset_token"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_users_reset_token", table_name="users")
    op.drop_index("ix_users_google_id", table_name="users")
    op.drop_column("users", "reset_token_expires")
    op.drop_column("users", "reset_token")
    op.drop_column("users", "google_id")
