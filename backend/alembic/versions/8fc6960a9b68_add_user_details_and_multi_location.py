"""add_user_details_and_multi_location

Revision ID: 8fc6960a9b68
Revises: 186dac9d2d05
Create Date: 2026-08-18 11:54:48.718755

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '8fc6960a9b68'
down_revision = '186dac9d2d05'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Upgrade users table
    try:
        op.add_column('users', sa.Column('full_name', sa.String(), nullable=True))
    except Exception:
        pass
    try:
        op.add_column('users', sa.Column('phone_number', sa.String(), nullable=True))
    except Exception:
        pass
    try:
        op.add_column('users', sa.Column('created_at', sa.DateTime(), nullable=True))
    except Exception:
        pass
    try:
        op.add_column('users', sa.Column('status', sa.String(), nullable=True))
    except Exception:
        pass
    try:
        op.create_index('uq_users_phone_number', 'users', ['phone_number'], unique=True)
    except Exception:
        pass

    # Upgrade agents table (representing BusinessLocation)
    try:
        op.add_column('agents', sa.Column('city', sa.String(), nullable=True))
    except Exception:
        pass
    try:
        op.add_column('agents', sa.Column('specific_location', sa.String(), nullable=True))
    except Exception:
        pass
    try:
        op.add_column('agents', sa.Column('owner_id', sa.Integer(), nullable=True))
    except Exception:
        pass


def downgrade() -> None:
    # Downgrade agents table
    op.drop_column('agents', 'owner_id')
    op.drop_column('agents', 'specific_location')
    op.drop_column('agents', 'city')

    # Downgrade users table
    op.drop_index('uq_users_phone_number', table_name='users')
    op.drop_column('users', 'status')
    op.drop_column('users', 'created_at')
    op.drop_column('users', 'phone_number')
    op.drop_column('users', 'full_name')
