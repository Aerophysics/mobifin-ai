"""make_agent_phone_unique

Revision ID: 186dac9d2d05
Revises: 55acbe893a8f
Create Date: 2026-08-18 11:42:04.470978

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '186dac9d2d05'
down_revision = '55acbe893a8f'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index('uq_agents_phone', 'agents', ['phone'], unique=True)


def downgrade() -> None:
    op.drop_index('uq_agents_phone', table_name='agents')
