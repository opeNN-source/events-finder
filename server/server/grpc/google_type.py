from datetime import datetime, time

from google.protobuf import timestamp_pb2

Timestamp = timestamp_pb2.Timestamp

def create_timestamp(date: datetime, time: time) -> timestamp_pb2.Timestamp:
    ts = Timestamp()
    
    dt = datetime.combine(date, time)

    ts.FromDatetime(dt)

    return ts

__all__ = [
    "Timestamp",
]