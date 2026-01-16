# NodeK8SApp

A Node.js Web API application with Customer CRUD operations, designed for Kubernetes deployment.

## Features

- RESTful API for Customer management (CRUD operations)
- Thread-safe in-memory data storage
- Custom response headers for service instance tracking
- Health check endpoint
- Docker and Kubernetes ready

## API Endpoints

### Customer Management

- `GET /customers` - Get all customers
- `GET /customers/:id` - Get customer by ID
- `POST /customers` - Create new customer (requires `name` and `email` in request body)
- `PUT /customers/:id` - Update customer (requires `name` and `email` in request body)
- `DELETE /customers/:id` - Delete customer

### Service Information

- `GET /info` - Returns service instance ID and service info
- `GET /health` - Health check endpoint

### Response Headers

All responses include the following custom headers:
- `x-service-instance` - Unique instance ID
- `x-service-info` - Service information from environment variable

## Customer Object Structure

```json
{
  "id": "uuid-v4-guid",
  "name": "string",
  "email": "string"
}
```

## Local Development

### Prerequisites

- Node.js 18 or higher
- npm

### Installation

```bash
npm install
```

### Running Locally

```bash
npm start
```

The server will start on port 3000 (or the port specified in the `PORT` environment variable).

### Environment Variables

- `PORT` - Server port (default: 3000)
- `APP_ENV_SERVICE_INFO` - Service information string (default: "default-service-info")

### Running Tests

The project includes a comprehensive test suite that tests the `/info` endpoint and all CRUD operations.

```bash
# Start the server in one terminal
npm start

# Run tests in another terminal
npm test
```

The test suite includes:
- Info endpoint validation
- Customer creation (POST)
- Customer retrieval (GET single and list)
- Customer update (PUT)
- Customer deletion (DELETE)
- Error handling and validation tests
- Custom header verification

## Docker

### Building the Docker Image

**For local development (current architecture):**
```bash
docker build -t nodek8sapp:latest .
```

**For specific architecture (e.g., ARM64 for Raspberry Pi):**

If you're deploying to ARM64 devices like Raspberry Pi, you need to build for that architecture:

```bash
# Build for ARM64 (Raspberry Pi, AWS Graviton, etc.)
docker buildx build --platform linux/arm64 -t nodek8sapp:latest .

# Build for AMD64 (most Intel/AMD servers)
docker buildx build --platform linux/amd64 -t nodek8sapp:latest .

# Build for both architectures (multi-platform)
docker buildx build --platform linux/amd64,linux/arm64 -t nodek8sapp:latest .
```

**Important:** If your Kubernetes cluster uses ARM64 architecture (like Raspberry Pi), you must build and push the ARM64 image, otherwise pods will fail with "exec format error" or "docker-entrypoint.sh not found" errors.

### Running with Docker

```bash
docker run -p 3000:3000 -e APP_ENV_SERVICE_INFO="production" nodek8sapp:latest
```

### Running with Docker Compose

```bash
docker-compose up
```

## Docker Registry

### Tagging the Image for Registry

```bash
docker tag nodek8sapp:latest registry-server.micropigmentacion.cc/nodek8sapp:latest
```

You can also tag with a specific version:

```bash
docker tag nodek8sapp:latest registry-server.micropigmentacion.cc/nodek8sapp:1.0.0
```

### Publishing to Registry

Push the latest tag:

```bash
docker push registry-server.micropigmentacion.cc/nodek8sapp:latest
```

Push a specific version:

```bash
docker push registry-server.micropigmentacion.cc/nodek8sapp:1.0.0
```

### Complete Build and Publish Workflow

**For AMD64 architecture (standard servers):**
```bash
# Build the image
docker build -t nodek8sapp:latest .

# Tag for registry (latest)
docker tag nodek8sapp:latest registry-server.micropigmentacion.cc/nodek8sapp:latest

# Tag for registry (version)
docker tag nodek8sapp:latest registry-server.micropigmentacion.cc/nodek8sapp:1.0.0

# Push to registry
docker push registry-server.micropigmentacion.cc/nodek8sapp:latest
docker push registry-server.micropigmentacion.cc/nodek8sapp:1.0.0
```

**For ARM64 architecture (Raspberry Pi, AWS Graviton, etc.):**
```bash
# Build and push directly for ARM64
docker buildx build --platform linux/arm64 \
  -t registry-server.micropigmentacion.cc/nodek8sapp:latest \
  -t registry-server.micropigmentacion.cc/nodek8sapp:1.0.0 \
  --push .
```

**Check your cluster architecture:**
```bash
# Check Kubernetes node architecture
kubectl get nodes -o jsonpath='{.items[0].status.nodeInfo.architecture}'

# Check Docker image architecture
docker inspect registry-server.micropigmentacion.cc/nodek8sapp:latest --format='{{.Architecture}}'
```

The architecture of your Docker image must match your Kubernetes nodes.

## Kubernetes Deployment

See [KUBERNETES.md](KUBERNETES.md) for detailed Kubernetes deployment instructions.

### Quick Reference - Common Kubernetes Commands

The application is deployed in the `nodek8sapp` namespace. Remember to include `-n nodek8sapp` in your kubectl commands:

```bash
# View all resources
kubectl get all -n nodek8sapp

# View across all namespaces
kubectl get all -A

# Set default namespace (to avoid typing -n every time)
kubectl config set-context --current --namespace=nodek8sapp

# Check pods
kubectl get pods -n nodek8sapp

# View logs
kubectl logs -n nodek8sapp <pod-name>

# Access the application (after deployment)
curl http://<NODE_IP>:30301/info

# Cleanup - Remove everything
kubectl delete namespace nodek8sapp
```

For detailed cleanup instructions, see the "Cleanup" section in [KUBERNETES.md](KUBERNETES.md).

## Testing the API

### Create a Customer

```bash
curl -X POST http://localhost:3000/customers \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com"}'
```

### Get All Customers

```bash
curl http://localhost:3000/customers
```

### Get Service Info

```bash
curl http://localhost:3000/info
```

### Check Response Headers

```bash
curl -v http://localhost:3000/info
```

Look for `x-service-instance` and `x-service-info` headers in the response.
