---
order: 3
---

# Platform Architecture

<br/>

![Architecture Diagram](./img/architecture.png)

## Explanation of Components

### Frontend (Angular)

- Connects to the **NestJS API backend** for data retrieval and real-time updates
- Does not interact directly with any database or caching layer

### Backend (NestJS)

- Acts as the central hub for managing and processing requests
- Directly interacts with:
  - **PostgreSQL**: For relational data such as user accounts, configurations, and logs
  - **InfluxDB**: For time-series data such as meter readings or telemetry
  - **Redis**: For:
    - **Caching**: Frequently accessed data (e.g., session tokens, configuration values)
    - **Queues**: Background job processing or real-time event handling (e.g., WebSocket message distribution)

### PostgreSQL

- Handles structured and relational data
- Used for permanent storage of business-critical data

### InfluxDB

- Handles time-series data
- Optimized for rapid ingestion and querying of time-stamped data like meter reads

### Redis

- Used as an **in-memory data store** for high-speed operations
- Use cases include:
  - Session storage for user authentication tokens
  - Caching results of expensive queries to PostgreSQL or InfluxDB
  - Pub/Sub or job queues for background task execution

## Deployment Tools Overview

- **AWS EKS**: Container orchestration for frontend and backend
- **AWS RDS**: Managed PostgreSQL database
- **AWS EC2**: InfluxDB hosting
- **AWS ElastiCache**: Managed Redis service
- **AWS VPC**: Network infrastructure
- **AWS ALB**: Load balancing

## Deployment Details

### Frontend (Angular)

- **Deployment Platform**:
  - Deployed on **AWS Elastic Kubernetes Service (EKS)** as a Docker container
- **Configuration:**
  - Static assets served using **NGINX** within Kubernetes pods

### Backend (NestJS)

- **Deployment Platform**:
  - Deployed on **AWS EKS** as a Docker container
- **Configuration**:
  - Exposed via Kubernetes **Ingress** with AWS **ALB** for secure API routing
  - Communicates securely with databases (PostgreSQL on RDS and InfluxDB on EC2)
- **Security**:
  - Secrets managed using Kubernetes **Secrets**

### PostgreSQL

- **Deployment Platform**:
  - Managed using **AWS RDS** for high availability and automated backups
- **Configuration**:
  - Private VPC access for security
  - Optimized with read replicas for heavy read workloads

### InfluxDB

- **Deployment Platform**:
  - Hosted on **AWS EC2**
- **Configuration**:
  - High-performance instance optimization
  - Secured with VPC firewall rules for backend-only access
