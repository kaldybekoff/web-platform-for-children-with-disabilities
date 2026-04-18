"""add email verification fields to users

Revision ID: 011
Revises: 0fabc3fafbce
Create Date: 2026-04-18

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "011"
down_revision: Union[str, None] = "0fabc3fafbce"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Existing users are considered verified (server_default='true').
    # New users inserted by the app will explicitly get is_verified=False.
    op.add_column(
        "users",
        sa.Column(
            "is_verified",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("true"),
        ),
    )
    op.add_column(
        "users",
        sa.Column("verification_token", sa.String(), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column("verification_token_expires", sa.DateTime(), nullable=True),
    )
    op.create_index(
        "ix_users_verification_token",
        "users",
        ["verification_token"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_users_verification_token", table_name="users")
    op.drop_column("users", "verification_token_expires")
    op.drop_column("users", "verification_token")
    op.drop_column("users", "is_verified")
