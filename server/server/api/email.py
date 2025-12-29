import datetime
import litestar
import grpc
import litestar.exceptions
from sqlalchemy import orm

from typing import Dict, List
from contextlib import asynccontextmanager
import server.grpc.google_type as google

from proto.gen.mailer.mailer_pb2 import EmailEvent, RegistrationRequest
from server.grpc.mailer_client import MailerClient


from server import models, repositories, schemas, settings


@litestar.post('/event-registration')
async def send_registration_email(
    events_service: repositories.EventsService,
    mailer_grpc_client: MailerClient,
    data: schemas.SendEmailRequest,
) -> Dict[str, str]:
    """
    Отправить email со списком мероприятий.

    Args:
        data: Данные для отправки email (email, список ID мероприятий)

    Returns:
        Статус отправки
    """
    print("hohlbi")
    events = await events_service.list(
        models.Event.id.in_(data.event_ids),
        auto_expunge=True,
        load=[
            orm.selectinload(models.Event.format),
            orm.selectinload(models.Event.region),
            orm.selectinload(models.Event.category),
            orm.selectinload(models.Event.event_type),
        ],
    )

    if not events:
        raise litestar.exceptions.NotFoundException(
            detail="No events found with provided IDs"
        )

    email_events: List[EmailEvent] = []

    for event in events:
        e = EmailEvent(
            id=event.id,
            name=event.name,
            description=event.description or "",
            format=event.format.name if event.format else "",
            region=event.region.name if event.region else "",
            category=event.category.name if event.category else "",
            type=event.event_type.name if event.event_type else "",
            start_time=google.create_timestamp(event.date_start, event.time_start or datetime.time(0, 0, 0)),
            end_time=google.create_timestamp(event.date_end or event.date_start, event.time_end or datetime.time(0, 0, 0))
        )

        email_events.append(e)

    req = RegistrationRequest(to=data.email, events=email_events) 

    try:
        await mailer_grpc_client.send_registration_notification(req)

    except grpc.aio.AioRpcError as e:
        raise litestar.exceptions.HTTPException(
            status_code=502,
            detail=e.details() or "",
        )


    return {"message": "success"}

ROUTER = litestar.Router(
    path="/email",
    route_handlers=[
        send_registration_email,
    ],
)