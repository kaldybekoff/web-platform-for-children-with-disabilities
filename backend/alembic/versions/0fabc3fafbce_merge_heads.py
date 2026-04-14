"""merge heads

Revision ID: 0fabc3fafbce
Revises: 009, 010
Create Date: 2026-04-14 21:48:10.219723

"""
from typing import Sequence, Union

from alembic import op
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '0fabc3fafbce'
down_revision: Union[str, None] = ('009', '010')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
