FROM golang:1.22-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN go build -o main .

FROM alpine:latest

WORKDIR /app
COPY --from=builder /app/main .

# The binary expects .env to be in the parent's parent directory
# But in Docker, we should use environment variables instead.

CMD ["./main"]
