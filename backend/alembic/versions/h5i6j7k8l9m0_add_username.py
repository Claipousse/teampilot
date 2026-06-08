"""add username and must_change_password

Revision ID: h5i6j7k8l9m0
Revises: g4h5i6j7k8l9
Create Date: 2026-06-07

"""
from alembic import op
import sqlalchemy as sa

revision = 'h5i6j7k8l9m0'
down_revision = 'g4h5i6j7k8l9'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('users') as batch_op:
        batch_op.add_column(sa.Column('username', sa.String(), nullable=True))
        batch_op.add_column(sa.Column(
            'must_change_password', sa.Boolean(), server_default='0', nullable=False
        ))
        batch_op.alter_column('email', existing_type=sa.String(), nullable=True)

    op.create_index('ix_users_username', 'users', ['username'], unique=True)


def downgrade():
    op.drop_index('ix_users_username', table_name='users')
    with op.batch_alter_table('users') as batch_op:
        batch_op.drop_column('must_change_password')
        batch_op.drop_column('username')
        batch_op.alter_column('email', existing_type=sa.String(), nullable=False)
