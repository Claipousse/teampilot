"""make staff email nullable

Revision ID: i6j7k8l9m0n1
Revises: h5i6j7k8l9m0
Create Date: 2026-06-11

"""
from alembic import op
import sqlalchemy as sa


revision = 'i6j7k8l9m0n1'
down_revision = 'h5i6j7k8l9m0'
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table('staff_members', schema=None) as batch_op:
        batch_op.alter_column('email', existing_type=sa.String(), nullable=True)


def downgrade() -> None:
    with op.batch_alter_table('staff_members', schema=None) as batch_op:
        batch_op.alter_column('email', existing_type=sa.String(), nullable=False)
