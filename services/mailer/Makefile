.PHONY: run

build:
	go build -o mailer ./app/cmd/main.go

run: build
	./mailer.exe

proto:
	
	cd contract && protoc \
		--proto_path=proto \
		--go_out=. \
		--go-grpc_out=. \
		mailer.proto

compose:
	docker compose up -d