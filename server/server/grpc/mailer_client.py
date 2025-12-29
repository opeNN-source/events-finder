import grpc
import  asyncio
import logging

from server.settings import settings
from proto.gen.mailer import mailer_pb2, mailer_pb2_grpc


class MailerClient:
    def __init__(self):
        self.target = f"{settings.mailer_host}:{settings.mailer_port}" 
        self.channel = None
        self.stub = None
        self._lock = asyncio.Lock()

    async def _ensure_channel(self):
        if self.channel is not None:
            return
        
        async with self._lock:
            if self.channel is not None:
                return
            
            logging.info("Initializing GRPC mailer channel and stub")
            self.channel = grpc.aio.insecure_channel(self.target)
            self.stub = mailer_pb2_grpc.EmailServiceStub(self.channel)
            logging.info("GRPC mailer channel and stub initialized")

    async def send_registration_notification(self, req: mailer_pb2.RegistrationRequest):
        await self._ensure_channel()
        try:
            return await self.stub.SendRegistrationNotification(req) # type: ignore 
        except grpc.aio.AioRpcError as e:
            if e.code() in (grpc.StatusCode.UNAVAILABLE, grpc.StatusCode.DEADLINE_EXCEEDED):
                await self._reconnect()
                try:
                    return await self.stub.SendRegistrationNotification(req) # type: ignore 
                except grpc.aio.AioRpcError as e2:
                    raise ConnectionError(f"Mailer service failed after reconnect: {e2}") from e2
        raise

    async def _reconnect(self):
        async with self._lock:
            if self.channel:
                await self.channel.close()
            self.channel = grpc.aio.insecure_channel(self.target)
            self.stub = mailer_pb2_grpc.EmailServiceStub(self.channel)
            logging.info("GRPC mailer channel has been reconnected")

    async def close(self):
        if self.channel:
            logging.info("Closing GRPC mailer channel")
            await self.channel.close()

    async def __aenter__(self):
        await self._ensure_channel()
        return self

    async def __aexit__(self, *args, **kwargs): 
        await self.close()   