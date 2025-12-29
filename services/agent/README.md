## .proto file generateon 

```bash
    uv run python -m grpc_tools.protoc \
  --proto_path=app/contract/proto \
  --proto_path=app/contract/third_party/googleapis \
  --python_out=app/contract/gen/python \
  --grpc_python_out=app/contract/gen/python \
  app/contract/proto/events.proto \
  app/contract/third_party/googleapis/google/type/date.proto \
  app/contract/third_party/googleapis/google/type/money.proto \
  app/contract/third_party/googleapis/google/type/timeofday.proto \
  app/contract/third_party/googleapis/google/protobuf/empty.proto

```