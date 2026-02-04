FROM golang:1.22-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o main .

FROM alpine:latest

WORKDIR /app
COPY --from=builder /app/main .

# Install ca-certificates for HTTPS
RUN apk --no-cache add ca-certificates

EXPOSE 5001

CMD ["./main"]
