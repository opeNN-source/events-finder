import granian


from granian.constants import Interfaces, Loops
from granian.log import LogLevels

from server.settings import settings


if __name__ == '__main__':
    granian.Granian(
        target='server.server:build_server',
        factory=True,
        address=settings.server_host,
        port=settings.server_port,
        interface=Interfaces.ASGI,
        log_level=LogLevels(settings.log_level),
        loop=Loops.uvloop,
    ).serve()
