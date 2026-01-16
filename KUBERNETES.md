# Kubernetes Deployment Guide

This guide provides instructions for deploying the NodeK8SApp to a Kubernetes cluster.

## Prerequisites

- Access to a Kubernetes cluster
- `kubectl` CLI installed and configured
- Docker image pushed to `registry-server.micropigmentacion.cc/nodek8sapp:latest`
- **Important:** Docker image architecture must match your cluster architecture
  - ARM64 for Raspberry Pi, AWS Graviton, Apple Silicon
  - AMD64 for most Intel/AMD servers

**Check your cluster architecture before deploying:**
```bash
kubectl get nodes -o jsonpath='{.items[0].status.nodeInfo.architecture}'
```

See the [README.md](README.md) Docker section for instructions on building images for specific architectures.

## Kubernetes Resources

The application includes the following Kubernetes resources in the `k8s/` directory:

- `namespace.yaml` - Creates a dedicated namespace called `nodek8sapp`
- `deployment.yaml` - Deployment with 3 replicas
- `service.yaml` - NodePort service exposing the app on port 30301

**Important Note:** This application uses a dedicated namespace called `nodek8sapp`. When running `kubectl` commands, you must either:
- Add `-n nodek8sapp` to each command, OR
- Set it as your default namespace (see "Working with Namespaces" section below)

Without the namespace flag, `kubectl get all` will show the default namespace, which won't include this application.

## Deployment Steps

### 1. Create the Namespace

```bash
kubectl apply -f k8s/namespace.yaml
```

Verify the namespace was created:

```bash
kubectl get namespaces | grep nodek8sapp
```

### 2. Deploy the Application

```bash
kubectl apply -f k8s/deployment.yaml
```

Verify the deployment:

```bash
kubectl get deployments -n nodek8sapp
```

Check the pods:

```bash
kubectl get pods -n nodek8sapp
```

You should see 3 pods running.

### 3. Create the Service

```bash
kubectl apply -f k8s/service.yaml
```

Verify the service:

```bash
kubectl get services -n nodek8sapp
```

### 4. Deploy All Resources at Once (Alternative)

Instead of applying files individually, you can deploy all resources at once:

```bash
kubectl apply -f k8s/
```

## Working with Namespaces

This application is deployed in a dedicated namespace called `nodek8sapp`. Understanding namespaces is important for managing your deployment.

### Viewing Resources in the Namespace

**Important:** When you run `kubectl get all` without specifying a namespace, you'll only see resources in the `default` namespace. To see your application resources, you must specify the namespace:

```bash
# View all resources in the nodek8sapp namespace
kubectl get all -n nodek8sapp

# View specific resource types
kubectl get pods -n nodek8sapp
kubectl get services -n nodek8sapp
kubectl get deployments -n nodek8sapp
```

### Viewing All Namespaces

```bash
# List all namespaces in your cluster
kubectl get namespaces

# View resources across ALL namespaces
kubectl get all --all-namespaces

# Shorthand for all namespaces
kubectl get all -A

# View pods across all namespaces
kubectl get pods -A
```

### Setting Default Namespace

To avoid typing `-n nodek8sapp` with every command, you can change your default namespace:

```bash
# Set nodek8sapp as the default namespace for current context
kubectl config set-context --current --namespace=nodek8sapp

# Now you can run commands without -n flag
kubectl get all
kubectl get pods
kubectl logs <pod-name>

# To switch back to default namespace
kubectl config set-context --current --namespace=default
```

### Check Current Namespace

```bash
# View current default namespace
kubectl config view --minify | grep namespace:
```

### Useful Aliases

Add these to your shell profile (`~/.bashrc` or `~/.zshrc`):

```bash
# Shorthand for kubectl with namespace
alias k='kubectl -n nodek8sapp'

# Usage examples:
# k get all
# k logs <pod-name>
# k describe pod <pod-name>
```

## Accessing the Application

The application is exposed via a NodePort service on port 30301.

### Get Node IP

```bash
kubectl get nodes -o wide
```

### Access the Application

If your node IP is `192.168.1.100`, you can access the application at:

```
http://192.168.1.100:30301
```

### Test the Service

```bash
# Get service info
curl http://<NODE_IP>:30301/info

# Health check
curl http://<NODE_IP>:30301/health

# Get all customers
curl http://<NODE_IP>:30301/customers

# Create a customer
curl -X POST http://<NODE_IP>:30301/customers \
  -H "Content-Type: application/json" \
  -d '{"name": "Jane Doe", "email": "jane@example.com"}'
```

## Monitoring and Management

**Note:** All commands below require the `-n nodek8sapp` flag to target the correct namespace. If you've set `nodek8sapp` as your default namespace (see "Working with Namespaces" above), you can omit the `-n` flag.

### View Pod Logs

View logs from all pods:

```bash
kubectl logs -n nodek8sapp -l app=nodek8sapp
```

View logs from a specific pod:

```bash
kubectl logs -n nodek8sapp <pod-name>
```

Follow logs in real-time:

```bash
kubectl logs -n nodek8sapp -l app=nodek8sapp -f
```

### Get Pod Details

```bash
kubectl describe pods -n nodek8sapp
```

### Get Deployment Details

```bash
kubectl describe deployment nodek8sapp-deployment -n nodek8sapp
```

### Get Service Details

```bash
kubectl describe service nodek8sapp-service -n nodek8sapp
```

### Check Pod Status

```bash
kubectl get pods -n nodek8sapp -o wide
```

## Scaling the Application

Scale the deployment to a different number of replicas:

```bash
kubectl scale deployment nodek8sapp-deployment -n nodek8sapp --replicas=5
```

Verify the scaling:

```bash
kubectl get pods -n nodek8sapp
```

## Updating the Application

### Update to a New Image Version

1. Build and push the new image version:

```bash
docker build -t nodek8sapp:2.0.0 .
docker tag nodek8sapp:2.0.0 registry-server.micropigmentacion.cc/nodek8sapp:2.0.0
docker push registry-server.micropigmentacion.cc/nodek8sapp:2.0.0
```

2. Update the deployment image:

```bash
kubectl set image deployment/nodek8sapp-deployment \
  nodek8sapp=registry-server.micropigmentacion.cc/nodek8sapp:2.0.0 \
  -n nodek8sapp
```

3. Monitor the rollout:

```bash
kubectl rollout status deployment/nodek8sapp-deployment -n nodek8sapp
```

### Update Using Configuration File

1. Edit `k8s/deployment.yaml` and change the image version
2. Apply the changes:

```bash
kubectl apply -f k8s/deployment.yaml
```

## Rollback

If there's an issue with a deployment, you can rollback:

```bash
kubectl rollout undo deployment/nodek8sapp-deployment -n nodek8sapp
```

View rollout history:

```bash
kubectl rollout history deployment/nodek8sapp-deployment -n nodek8sapp
```

## Troubleshooting

### Pods Not Starting

Check pod events:

```bash
kubectl describe pods -n nodek8sapp
```

Check pod logs:

```bash
kubectl logs -n nodek8sapp <pod-name>
```

### Image Pull Errors

Verify the image exists in the registry:

```bash
curl http://registry-server.micropigmentacion.cc/v2/nodek8sapp/tags/list
```

### Architecture Mismatch (CrashLoopBackOff with "exec format error")

If pods are crashing with errors like:
- `exec /usr/local/bin/docker-entrypoint.sh: no such file or directory`
- `exec format error`
- `CrashLoopBackOff` immediately after starting

This typically means your Docker image architecture doesn't match your cluster's architecture.

**Diagnose the issue:**

```bash
# Check your node's architecture
kubectl get nodes -o jsonpath='{.items[0].status.nodeInfo.architecture}'

# Check the current image architecture (run on your build machine)
docker pull registry-server.micropigmentacion.cc/nodek8sapp:latest
docker inspect registry-server.micropigmentacion.cc/nodek8sapp:latest --format='{{.Architecture}}'
```

**Fix for ARM64 clusters (Raspberry Pi, AWS Graviton, etc.):**

If your cluster is ARM64 but your image is AMD64, rebuild and push for ARM64:

```bash
# Build and push ARM64 image directly
docker buildx build --platform linux/arm64 \
  -t registry-server.micropigmentacion.cc/nodek8sapp:latest \
  --push .

# Delete pods to pull new image
kubectl delete pods -n nodek8sapp --all

# Wait for pods to restart
kubectl get pods -n nodek8sapp -w
```

**Fix for AMD64 clusters:**

If your cluster is AMD64 but your image is ARM64, rebuild for AMD64:

```bash
# Build and push AMD64 image directly
docker buildx build --platform linux/amd64 \
  -t registry-server.micropigmentacion.cc/nodek8sapp:latest \
  --push .

# Delete pods to pull new image
kubectl delete pods -n nodek8sapp --all
```

### Service Not Accessible

Check if the service is running:

```bash
kubectl get svc -n nodek8sapp
```

Check if pods are ready:

```bash
kubectl get pods -n nodek8sapp
```

Test from within the cluster:

```bash
kubectl run -it --rm debug --image=alpine --restart=Never -n nodek8sapp -- sh
# Inside the pod:
wget -qO- http://nodek8sapp-service:3000/health
```

## Updating Environment Variables

To update the `APP_ENV_SERVICE_INFO` environment variable:

1. Edit `k8s/deployment.yaml` and modify the env value
2. Apply the changes:

```bash
kubectl apply -f k8s/deployment.yaml
```

3. Restart the pods to pick up the new value:

```bash
kubectl rollout restart deployment/nodek8sapp-deployment -n nodek8sapp
```

## Cleanup

This section covers how to completely remove the application after testing.

### Option 1: Delete Resources Using Configuration Files

Delete all resources defined in the k8s directory:

```bash
kubectl delete -f k8s/
```

This will delete:
- Deployment (and all pods)
- Service
- Namespace

Verify deletion:

```bash
kubectl get all -n nodek8sapp
# Should show: No resources found in nodek8sapp namespace.

kubectl get namespace nodek8sapp
# Should show: Error from server (NotFound): namespaces "nodek8sapp" not found
```

### Option 2: Delete the Entire Namespace

Deleting the namespace will automatically delete all resources within it:

```bash
# Delete the namespace (removes all resources inside)
kubectl delete namespace nodek8sapp
```

This is faster and ensures everything is removed. Verify:

```bash
# Check that namespace is gone
kubectl get namespaces | grep nodek8sapp

# Verify no resources remain
kubectl get all -A | grep nodek8sapp
```

### Option 3: Delete Resources Individually

If you want more control, delete resources one by one:

```bash
# Delete the service
kubectl delete service nodek8sapp-service -n nodek8sapp

# Delete the deployment (this also deletes pods)
kubectl delete deployment nodek8sapp-deployment -n nodek8sapp

# Delete the namespace
kubectl delete namespace nodek8sapp
```

### Cleanup Local Docker Images

After removing from Kubernetes, you may also want to clean up Docker images on your local machine:

```bash
# List images
docker images | grep nodek8sapp

# Remove local images
docker rmi nodek8sapp:latest
docker rmi registry-server.micropigmentacion.cc/nodek8sapp:latest

# Remove all unused images, containers, and networks
docker system prune -a
```

### Remove Images from Registry

To remove images from the Docker registry:

```bash
# List tags in registry
curl http://registry-server.micropigmentacion.cc/v2/nodek8sapp/tags/list

# Note: Deletion from registry depends on registry configuration
# Most registries require registry API access or web UI to delete images
```

### Complete Cleanup Checklist

After cleanup, verify everything is removed:

- [ ] Namespace deleted: `kubectl get namespace nodek8sapp` (should return NotFound)
- [ ] No pods running: `kubectl get pods -A | grep nodek8sapp` (should return nothing)
- [ ] Service removed: `kubectl get svc -A | grep nodek8sapp` (should return nothing)
- [ ] Local images removed: `docker images | grep nodek8sapp` (should return nothing)
- [ ] Application not accessible: `curl http://<NODE_IP>:30301/info` (should fail)

### Reset Default Namespace

If you changed your default namespace to `nodek8sapp`, reset it back to default:

```bash
kubectl config set-context --current --namespace=default
```

## Port Forwarding (Alternative Access Method)

If NodePort access is not available, you can use port forwarding:

```bash
kubectl port-forward -n nodek8sapp service/nodek8sapp-service 3000:3000
```

Then access the application at `http://localhost:3000`
