import dataclasses

import litestar
import modern_di_litestar
from advanced_alchemy.exceptions import DuplicateKeyError
from lite_bootstrap import LitestarBootstrapper
from litestar.config.app import AppConfig
from opentelemetry.instrumentation.asyncpg import AsyncPGInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor

from server import exceptions, ioc
# from server.api.auth import ROUTER as auth_router
from server.api.events import ROUTER as events_router
from server.api.agent import ROUTER as agent_router
from server.api.email import ROUTER as email_router
from server.api.auth import ROUTER as auth_router
from server.settings import settings


def build_server() -> litestar.Litestar:
    bootstrap_config = dataclasses.replace(
        settings.api_bootstrapper_config,
        application_config=AppConfig(
            exception_handlers={
                DuplicateKeyError: exceptions.duplicate_key_error_handler,
            },
            route_handlers=[events_router, agent_router, email_router,auth_router],
            plugins=[modern_di_litestar.ModernDIPlugin()],
            dependencies={
                'mailer_grpc_client': modern_di_litestar.FromDI(ioc.Dependencies.mailer_grpc_client),
                'auth_grpc_client': modern_di_litestar.FromDI(ioc.Dependencies.auth_grpc_client),
                'session': modern_di_litestar.FromDI(ioc.Dependencies.session),
                'events_service': modern_di_litestar.FromDI(
                    ioc.Dependencies.events_service
                ),
                'formats_service': modern_di_litestar.FromDI(
                    ioc.Dependencies.formats_service
                ),
                'regions_service': modern_di_litestar.FromDI(
                    ioc.Dependencies.regions_service
                ),
                'categories_service': modern_di_litestar.FromDI(
                    ioc.Dependencies.categories_service
                ),
                'event_types_service': modern_di_litestar.FromDI(
                    ioc.Dependencies.event_types_service
                ),
                'agent_config_service': modern_di_litestar.FromDI(
                    ioc.Dependencies.agent_config_service
                ),
            },
            request_max_body_size=settings.request_max_body_size,
        ),
        opentelemetry_instrumentors=[
            SQLAlchemyInstrumentor(),
            AsyncPGInstrumentor(capture_parameters=True),  # type: ignore[no-untyped-call]
        ],
    )
    bootstrapper = LitestarBootstrapper(bootstrap_config=bootstrap_config)
    return bootstrapper.bootstrap()

