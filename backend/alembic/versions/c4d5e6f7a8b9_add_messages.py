"""add messages

Revision ID: c4d5e6f7a8b9
Revises: 39f5ba0ea579
Create Date: 2026-06-06 10:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'c4d5e6f7a8b9'
down_revision: Union[str, None] = '39f5ba0ea579'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('conversations',
    sa.Column('id',         sa.Integer(),                                         nullable=False),
    sa.Column('name',       sa.String(),                                          nullable=False),
    sa.Column('category',   sa.Enum('team', 'staff', name='conv_category'),       nullable=False),
    sa.Column('role_type',  sa.String(),                                          nullable=False),
    sa.Column('is_group',   sa.Boolean(),                                         nullable=False),
    sa.Column('is_ai',      sa.Boolean(),                                         nullable=False),
    sa.Column('initials',   sa.String(),                                          nullable=False),
    sa.Column('avatar_bg',  sa.String(),                                          nullable=False),
    sa.Column('role',       sa.String(),                                          nullable=True),
    sa.Column('created_at', sa.DateTime(),                                        nullable=False),
    sa.PrimaryKeyConstraint('id'),
    )
    op.create_table('conversation_participants',
    sa.Column('id',              sa.Integer(), nullable=False),
    sa.Column('conversation_id', sa.Integer(), nullable=False),
    sa.Column('user_id',         sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['conversation_id'], ['conversations.id']),
    sa.ForeignKeyConstraint(['user_id'],         ['users.id']),
    sa.PrimaryKeyConstraint('id'),
    )
    op.create_table('messages',
    sa.Column('id',              sa.Integer(),                                              nullable=False),
    sa.Column('conversation_id', sa.Integer(),                                              nullable=False),
    sa.Column('sender_id',       sa.Integer(),                                              nullable=True),
    sa.Column('msg_type',        sa.Enum('text', 'file', 'system', name='msg_type'),       nullable=False),
    sa.Column('text',            sa.Text(),                                                 nullable=True),
    sa.Column('created_at',      sa.DateTime(),                                             nullable=False),
    sa.ForeignKeyConstraint(['conversation_id'], ['conversations.id']),
    sa.ForeignKeyConstraint(['sender_id'],       ['users.id']),
    sa.PrimaryKeyConstraint('id'),
    )


def downgrade() -> None:
    op.drop_table('messages')
    op.drop_table('conversation_participants')
    op.drop_table('conversations')
