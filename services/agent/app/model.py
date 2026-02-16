import typing
from datetime import datetime, time

import sqlalchemy as sa
from advanced_alchemy.base import BigIntAuditBase, orm_registry
from sqlalchemy import orm

METADATA: typing.Final = orm_registry.metadata
orm.DeclarativeBase.metadata = METADATA


class Format(BigIntAuditBase):
    __tablename__ = 'formats'

    name: orm.Mapped[str] = orm.mapped_column(
        sa.String(100), nullable=False, unique=True
    )
    description: orm.Mapped[str | None] = orm.mapped_column(
        sa.Text, nullable=True
    )
    events: orm.Mapped[list['Event']] = orm.relationship(
        'Event', back_populates='format', lazy='noload'
    )


class Region(BigIntAuditBase):
    __tablename__ = 'regions'

    name: orm.Mapped[str] = orm.mapped_column(
        sa.String(255), nullable=False, unique=True
    )
    events: orm.Mapped[list['Event']] = orm.relationship(
        'Event', back_populates='region', lazy='noload'
    )


class Category(BigIntAuditBase):
    __tablename__ = 'categories'

    name: orm.Mapped[str] = orm.mapped_column(
        sa.String(100), nullable=False, unique=True
    )
    events: orm.Mapped[list['Event']] = orm.relationship(
        'Event', back_populates='category', lazy='noload'
    )


class EventType(BigIntAuditBase):
    __tablename__ = 'event_types'

    name: orm.Mapped[str] = orm.mapped_column(
        sa.String(100), nullable=False, unique=True
    )
    description: orm.Mapped[str | None] = orm.mapped_column(
        sa.Text, nullable=True
    )
    events: orm.Mapped[list['Event']] = orm.relationship(
        'Event', back_populates='event_type', lazy='noload'
    )


class Event(BigIntAuditBase):
    __tablename__ = 'events'

    name: orm.Mapped[str] = orm.mapped_column(sa.String(255), nullable=False)
    description: orm.Mapped[str | None] = orm.mapped_column(
        sa.Text, nullable=True
    )

    date_start: orm.Mapped[datetime] = orm.mapped_column(
        sa.DateTime, nullable=False, index=True
    )
    date_end: orm.Mapped[datetime | None] = orm.mapped_column(
        sa.DateTime, nullable=True
    )
    time_start: orm.Mapped[time | None] = orm.mapped_column(
        sa.Time, nullable=True
    )
    time_end: orm.Mapped[time | None] = orm.mapped_column(
        sa.Time, nullable=True
    )

    format_id: orm.Mapped[int | None] = orm.mapped_column(
        sa.ForeignKey('formats.id', ondelete='SET NULL'),
        nullable=True,
        index=True,
    )
    region_id: orm.Mapped[int | None] = orm.mapped_column(
        sa.ForeignKey('regions.id', ondelete='SET NULL'),
        nullable=True,
        index=True,
    )
    category_id: orm.Mapped[int | None] = orm.mapped_column(
        sa.ForeignKey('categories.id', ondelete='SET NULL'),
        nullable=True,
        index=True,
    )
    event_type_id: orm.Mapped[int | None] = orm.mapped_column(
        sa.ForeignKey('event_types.id', ondelete='SET NULL'),
        nullable=True,
        index=True,
    )

    price: orm.Mapped[float | None] = orm.mapped_column(
        sa.Numeric(15, 6), nullable=True
    )

    source_url: orm.Mapped[str | None] = orm.mapped_column(
        sa.Text, nullable=True
    )
    organizer_name: orm.Mapped[str | None] = orm.mapped_column(
        sa.String(255), nullable=True
    )

    format: orm.Mapped['Format | None'] = orm.relationship(
        'Format', back_populates='events', lazy='joined'
    )
    region: orm.Mapped['Region | None'] = orm.relationship(
        'Region', back_populates='events', lazy='joined'
    )
    category: orm.Mapped['Category | None'] = orm.relationship(
        'Category', back_populates='events', lazy='joined'
    )
    event_type: orm.Mapped['EventType | None'] = orm.relationship(
        'EventType', back_populates='events', lazy='joined'
    )


class AgentConfig(BigIntAuditBase):
    __tablename__ = 'agent_configs'

    # Locations (regions) - JSON array of region names
    locations: orm.Mapped[list[str] | None] = orm.mapped_column(
        sa.JSON, nullable=True
    )
    # Event types - JSON array of event type names
    event_types: orm.Mapped[list[str] | None] = orm.mapped_column(
        sa.JSON, nullable=True
    )
    # Sources - JSON array of source URLs or names
    sources: orm.Mapped[list[str] | None] = orm.mapped_column(
        sa.JSON, nullable=True
    )
    # Honorary participants - JSON array of participant names
    honorary_participants: orm.Mapped[dict[str, list[str]] | None] = orm.mapped_column(
        sa.JSON, nullable=True
    )
    # Custom queries - JSON array of custom search queries
    custom_queries: orm.Mapped[list[str] | None] = orm.mapped_column(
        sa.JSON, nullable=True
    )
