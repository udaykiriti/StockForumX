# Go Development & Compilation Guide

The microservices in Stock Forum X are written in Go (Golang). This guide explains how to set up your environment, compile the code, and run these services.

## Prerequisites
- **Go 1.22+** installed on your system.
- **MongoDB** instance running (all services require a connection string).

## Working with Services

### 1. Initializing a New Service
If you create a new folder for a service, you must initialize it as a Go module:
```bash
cd services/my-new-service
go mod init my-new-service
```

### 2. Dependency Management (`go mod tidy`)
The most important command for dependencies is `go mod tidy`. You should run this whenever you add, remove, or update code imports. It syncs your code with the `go.mod` file.

```bash
# Cleans up unused dependencies and adds missing ones
go mod tidy

# Verification
go mod verify
```

### 3. Compiling to a Binary
Compiling creates a standalone executable file that doesn't require Go to be installed on the destination machine.

**On Windows (PowerShell):**
```powershell
cd services/sentiment-service
go build -o sentiment.exe main.go
./sentiment.exe
```

**On Linux/macOS:**
```bash
cd services/sentiment-service
go build -o sentiment main.go
chmod +x sentiment
./sentiment
```

## How to Run Services

There are three ways to run these microservices depending on your environment.

### 1. Development Mode (`go run`)
The fastest way to test changes without compiling. Go will compile the code to a temporary directory and execute it.
```bash
cd services/alert-engine
go run main.go
```

### 2. Docker Orchestration (Recommended)
This is the easiest way to run the entire project (Frontend, Backend, and all 5 Go Services) at once.
```bash
# In the project root
docker-compose up --build
```
To run only a specific service:
```bash
docker-compose up alert-engine
```

### 3. Running Compiled Binaries
Use this if you want to run the service without having Go installed or if you are deploying to a server.
```bash
# Compile first
cd services/analytics-service
go build -o analytics.exe main.go

# Then run the binary
./analytics.exe
```

> [!TIP]
> **Environment Variables**: All services look for the `MONGODB_URI` environment variable. If you are running with `go run` or binaries, ensure your shell has this variable exported or a `.env` file exists.
- **Change Stream Failures**: Most services require MongoDB to be running in **Replica Set** mode to support Change Streams.
- **Context Deadlines**: If a service fails to connect, verify your `MONGODB_URI` environment variable is accessible from the service's runtime.
