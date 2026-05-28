FROM golang:1.26-alpine
WORKDIR /app

RUN go install github.com/air-verse/air@latest

COPY go.mod go.sum ./
RUN go mod download

# Source is mounted as volume — Air watches for changes and rebuilds
CMD ["air", "-c", "backend/.air.toml"]