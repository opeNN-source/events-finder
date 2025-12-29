from litestar import post, Router
import grpc
from proto.gen.auth.auth_pb2 import LoginRequest,RegisterRequest,RefreshRequest,LogoutRequest
from typing import Dict
from server import models, repositories, schemas, settings
from server.grpc.auth_client import AuthClient
import litestar.exceptions
from contextlib import asynccontextmanager

@post("/signup")
async def signup_via_grpc(data: schemas.SendLoginRequest,auth_grpc_client: AuthClient)->None:
    req = RegisterRequest(email=data.email, password=data.password)

    try:
        await auth_grpc_client.signup_auth(req)
        return {"status": "ok"}

    except ValueError as e:
        raise litestar.exceptions.HTTPException(
            status_code=409,
            detail=str(e),
        )

    except TimeoutError as e:
        raise litestar.exceptions.HTTPException(
            status_code=504,
            detail=str(e),
        )

    except ConnectionError as e:
        raise litestar.exceptions.HTTPException(
            status_code=503,
            detail=str(e),
        )
   

@post("/login")
async def login_via_grpc(data: schemas.SendLoginRequest,auth_grpc_client: AuthClient)->Dict[str,str]:
    req=LoginRequest(email=data.email,password=data.password)
    try:
        response= await auth_grpc_client.login_auth(req)
    except grpc.aio.AioRpcError as e:
        raise litestar.exceptions.HTTPException(
            status_code=e.code(),
            detail=e.details() or "",
        )
    return {
        "access": response.access_token,
        "refresh": response.refresh_token,
        }


@post("/refresh")
async def refresh_via_grpc(data: schemas.SendTokenRequest,auth_grpc_client: AuthClient)->Dict[str,str]:
    req=RefreshRequest(refresh_token=data.refresh)
    try:
        response= await auth_grpc_client.refresh_auth(req)
    except grpc.aio.AioRpcError as e:
        raise litestar.exceptions.HTTPException(
            status_code=e.code(),
            detail=e.details() or "",
        )
    except ValueError as e:
        raise litestar.exceptions.HTTPException(
            status_code=409,
            detail=str(e),
        )

    except TimeoutError as e:
        raise litestar.exceptions.HTTPException(
            status_code=504,
            detail=str(e),
        )

    except ConnectionError as e:
        raise litestar.exceptions.HTTPException(
            status_code=503,
            detail=str(e),
        )
    return {
        "access": response.access_token,
        "refresh": response.refresh_token,
        }


@post("/logout")
async def logout_via_grpc(data: schemas.SendTokenRequest,auth_grpc_client: AuthClient)->None:
    req = LogoutRequest(refresh_token=data.refresh)

    try:
        await auth_grpc_client.logout_auth(req)
        return {"status": "ok"}

    except ValueError as e:
        raise litestar.exceptions.HTTPException(
            status_code=409,
            detail=str(e),
        )

    except TimeoutError as e:
        raise litestar.exceptions.HTTPException(
            status_code=504,
            detail=str(e),
        )

    except ConnectionError as e:
        raise litestar.exceptions.HTTPException(
            status_code=503,
            detail=str(e),
        )
    


ROUTER = Router(
    path="/auth",
    route_handlers=[
        signup_via_grpc,
        login_via_grpc,
        refresh_via_grpc,
        logout_via_grpc,
    ],
)
