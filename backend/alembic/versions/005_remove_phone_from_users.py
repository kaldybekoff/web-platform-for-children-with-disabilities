"""remove phone from users

Revision ID: 005
Revises: 004
Create Date: 2026-03-12 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "005"
down_revision: Union[str, None] = "004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column("users", "phone")


def downgrade() -> None:
    op.add_column("users", sa.Column("phone", sa.String(), nullable=False, server_default=""))
