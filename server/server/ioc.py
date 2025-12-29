

from modern_di import BaseGraph, Scope, providers

from server import repositories
from server.grpc.auth_client import AuthClient
from server.grpc.mailer_client import MailerClient
from server.resources.db import create_sa_engine, create_session
class Dependencies(BaseGraph):
    mailer_grpc_client = providers.Resource(
        Scope.APP,
        MailerClient
    )
    
    database_engine = providers.Resource(Scope.APP, create_sa_engine)
    session = providers.Resource(
        Scope.REQUEST, create_session, engine=database_engine.cast
    )

    auth_grpc_client = providers.Resource(
        Scope.APP,
        AuthClient
    )

    events_service = providers.Factory(
        Scope.REQUEST,
        repositories.EventsService,
        session=session.cast,
        auto_commit=True,
    )

    formats_service = providers.Factory(
        Scope.REQUEST,
        repositories.FormatsService,
        session=session.cast,
        auto_commit=True,
    )

    regions_service = providers.Factory(
        Scope.REQUEST,
        repositories.RegionsService,
        session=session.cast,
        auto_commit=True,
    )

    categories_service = providers.Factory(
        Scope.REQUEST,
        repositories.CategoriesService,
        session=session.cast,
        auto_commit=True,
    )

    event_types_service = providers.Factory(
        Scope.REQUEST,
        repositories.EventTypesService,
        session=session.cast,
        auto_commit=True,
    )

    agent_config_service = providers.Factory(
        Scope.REQUEST,
        repositories.AgentConfigService,
        session=session.cast,
        auto_commit=True,
    )

