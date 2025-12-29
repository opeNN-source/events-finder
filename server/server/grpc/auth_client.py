import grpc
import asyncio
import logging

from proto.gen.auth import auth_pb2,auth_pb2_grpc
from server.settings import settings


class AuthClient:
    def __init__(self):
        self.target = f"{settings.auth_host}:{settings.auth_port}" 
        self.channel = None
        self.stub = None
        self._lock = asyncio.Lock()

    async def _ensure_channel(self):

        if self.channel is not None:
            return
        
        async with self._lock:
            if self.channel is not None:
                return
            
            logging.info("Initializing GRPC auth channel and stub")
            self.channel = grpc.aio.insecure_channel(self.target)
            self.stub = auth_pb2_grpc.AuthServiceStub(self.channel)
            logging.info("GRPC auth channel and stub initialized")

    async def signup_auth(self,req: auth_pb2.RegisterRequest):
        await self._ensure_channel()
        try:
            return await self.stub.Register(req) # type: ignore
       
        except grpc.aio.AioRpcError as e:
            if e.code() in (grpc.StatusCode.UNAVAILABLE, grpc.StatusCode.DEADLINE_EXCEEDED):
                await self._reconnect()
                try:
                    return await self.stub.Register(req) # type: ignore 
                except grpc.aio.AioRpcError as e2:
                    raise ConnectionError(f"Auth service failed after reconnect: {e2}") from e2
            if e.code() == grpc.StatusCode.ALREADY_EXISTS:
                raise ValueError("User already exists") from e
            if e.code() == grpc.StatusCode.INVALID_ARGUMENT:
                raise ValueError("Invalid registration data") from e
        raise
    
    async def login_auth(self, req: auth_pb2.LoginRequest):
        await self._ensure_channel()
        try:
            return await self.stub.Login(req) # type: ignore 
        except grpc.aio.AioRpcError as e:
            if e.code() in (grpc.StatusCode.UNAVAILABLE, grpc.StatusCode.DEADLINE_EXCEEDED):
                await self._reconnect()
                try:
                    return await self.stub.Login(req) # type: ignore 
                except grpc.aio.AioRpcError as e2:
                    raise ConnectionError(f"Auth service failed after reconnect: {e2}") from e2
            if e.code() == grpc.StatusCode.NOT_FOUND:
                raise ValueError("User not found") from e
            if e.code() == grpc.StatusCode.UNAUTHENTICATED:
                raise PermissionError("Invalid credentials") from e
            if e.code() == grpc.StatusCode.INVALID_ARGUMENT:
                raise ValueError("Invalid login data") from e
        raise

    async def refresh_auth(self, req: auth_pb2.RefreshRequest):
        await self._ensure_channel()
        try:
            return await self.stub.Refresh(req) # type: ignore 
        except grpc.aio.AioRpcError as e:
            if e.code() in (grpc.StatusCode.UNAVAILABLE, grpc.StatusCode.DEADLINE_EXCEEDED):
                await self._reconnect()
                try:
                    return await self.stub.Refresh(req) # type: ignore 
                except grpc.aio.AioRpcError as e2:
                    raise ConnectionError(f"Auth service failed after reconnect: {e2}") from e2
            if e.code() == grpc.StatusCode.NOT_FOUND:
                raise ValueError("token not found") from e
            if e.code() == grpc.StatusCode.INVALID_ARGUMENT:
                raise ValueError("Invalid refresh data") from e
        raise    

    async def logout_auth(self, req: auth_pb2.LogoutRequest):
        await self._ensure_channel()
        try:
            return await self.stub.Logout(req) # type: ignore 
        except grpc.aio.AioRpcError as e:
            if e.code() in (grpc.StatusCode.UNAVAILABLE, grpc.StatusCode.DEADLINE_EXCEEDED):
                await self._reconnect()
                try:
                    return await self.stub.Logout(req) # type: ignore 
                except grpc.aio.AioRpcError as e2:
                    raise ConnectionError(f"Auth service failed after reconnect: {e2}") from e2
            if e.code() == grpc.StatusCode.NOT_FOUND:
                raise ValueError("token not found") from e
            if e.code() == grpc.StatusCode.INVALID_ARGUMENT:
                raise ValueError("Invalid refresh data") from e
        raise



    async def _reconnect(self):
        async with self._lock:
            if self.channel:
                await self.channel.close()
                self.channel = grpc.aio.insecure_channel(self.target)
                self.stub = auth_pb2_grpc.AuthServiceStub(self.channel)
                logging.info("GRPC auth channel has been reconnected")

    async def close(self):
        if self.channel:
            logging.info("Closing GRPC auth channel")
            await self.channel.close()

    async def __aenter__(self):
        await self._ensure_channel()
        return self

    async def __aexit__(self, *args, **kwargs): 
        await self.close() 



