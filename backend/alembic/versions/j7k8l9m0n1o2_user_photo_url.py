"""add photo_url to users

Revision ID: j7k8l9m0n1o2
Revises: i6j7k8l9m0n1
Create Date: 2026-06-24

"""
from alembic import op
import sqlalchemy as sa

revision = 'j7k8l9m0n1o2'
down_revision = 'i6j7k8l9m0n1'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('users', sa.Column('photo_url', sa.String(), nullable=True))


def downgrade():
    op.drop_column('users', 'photo_url')
