"""notif kind string

Revision ID: f3g4h5i6j7k8
Revises: e2f3a4b5c6d7
Create Date: 2026-06-06

"""
from alembic import op
import sqlalchemy as sa

revision = 'f3g4h5i6j7k8'
down_revision = 'e2f3a4b5c6d7'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('notifications') as batch_op:
        batch_op.alter_column(
            'kind',
            existing_type=sa.Enum('added', 'rescheduled', 'cancelled', name='notif_kind'),
            type_=sa.String(),
            existing_nullable=False,
        )


def downgrade():
    with op.batch_alter_table('notifications') as batch_op:
        batch_op.alter_column(
            'kind',
            existing_type=sa.String(),
            type_=sa.Enum('added', 'rescheduled', 'cancelled', name='notif_kind'),
            existing_nullable=False,
        )
