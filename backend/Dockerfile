# Multi-stage build for Go Backend
FROM golang:1.23-alpine AS builder

WORKDIR /app

# Install git/build-base if needed
RUN apk add --no-cache git

# Copy dependency manifests
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build statically-linked binary
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /app/server main.go

# Production runtime image
FROM alpine:3.20

WORKDIR /app

# Add ca-certificates for secure HTTPS outbound traffic to Supabase
RUN apk --no-cache add ca-certificates tzdata

COPY --from=builder /app/server /app/server

# Copy .env if available, or .env.example
COPY .env* ./

# Ensure uploads directory exists
RUN mkdir -p /app/uploads

EXPOSE 3000

ENV PORT=3000

CMD ["/app/server"]
