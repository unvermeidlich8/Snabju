FROM golang:1.26-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o /server ./backend/cmd/main.go

FROM alpine:3.20
WORKDIR /app
RUN apk add --no-cache ca-certificates
COPY certs/russian_trusted_root_ca.crt certs/russian_trusted_sub_ca.crt /usr/local/share/ca-certificates/
RUN update-ca-certificates
COPY --from=builder /server /server
CMD ["/server"]
