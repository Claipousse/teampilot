"""notif add tag

Revision ID: g4h5i6j7k8l9
Revises: f3g4h5i6j7k8
Create Date: 2026-06-06

"""
from alembic import op
import sqlalchemy as sa

revision = 'g4h5i6j7k8l9'
down_revision = 'f3g4h5i6j7k8'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('notifications') as batch_op:
        batch_op.add_column(sa.Column('tag', sa.String(), nullable=True))


def downgrade():
    with op.batch_alter_table('notifications') as batch_op:
        batch_op.drop_column('tag')
