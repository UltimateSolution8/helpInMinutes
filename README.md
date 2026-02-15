# HelpInMinutes - On-Demand Service Platform

<p align="center">
  <img src="docs/assets/logo.png" alt="HelpInMinutes Logo" width="200"/>
</p>

<p align="center">
  <a href="#">Documentation</a> •
  <a href="#">API Reference</a> •
  <a href="#">Getting Started</a> •
  <a href="#">Contributing</a>
</p>

## 📋 Overview

HelpInMinutes is a microservices-based on-demand service platform connecting customers with local helpers for various tasks including cleaning, delivery, repairs, and more. The platform features real-time matching, secure payments, and seamless communication.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Load Balancer (Nginx)                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    ▼                   ▼                   ▼
            ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
            │   Identity   │    │    Task      │    │  Matching    │
            │   Service    │    │   Service    │    │   Service    │
            └──────────────┘    └──────────────┘    └──────────────┘
                    │                   │                   │
                    └───────────────────┼───────────────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    ▼                   ▼                   ▼
            ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
            │   Payment    │    │ Real-time    │    │   Admin      │
            │   Service    │    │   Service    │    │   Portal     │
            └──────────────┘    └──────────────┘    └──────────────┘
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
    ┌───────────┐      ┌───────────┐
    │  Redis    │      │PostgreSQL │
    │  Cache    │      │  Database │
    └───────────┘      └───────────┘
          │
          ▼
    ┌───────────┐
    │ RabbitMQ  │  (Event Bus)
    └───────────┘
```

## 🚀 Features

- **User Authentication**: JWT-based authentication with refresh tokens
- **Real-time Matching**: H3-based geospatial matching algorithm
- **Secure Payments**: Razorpay integration with ledger tracking
- **Live Updates**: Socket.io for real-time task status updates
- **Admin Dashboard**: Complete system monitoring and management
- **Mobile Apps**: React Native for iOS and Android

## 📦 Services

| Service | Port | Description |
|---------|------|-------------|
| Identity Service | 8081 | Authentication and user management |
| Task Service | 8082 | Task lifecycle management |
| Matching Service | 8083 | Helper matching and dispatch |
| Payment Service | 8084 | Payment processing and ledger |
| Real-time Service | 3001 | WebSocket handling |
| Admin Portal | 3000 | Admin dashboard |
| Mobile App | - | React Native mobile app |

## 🛠️ Tech Stack

### Backend
- **Java 17** with Spring Boot 3.2
- **PostgreSQL** for persistent storage
- **Redis** for caching and session management
- **RabbitMQ** for event-driven communication
- **JWT** for authentication

### Frontend
- **React Native** for mobile apps
- **Next.js** for admin portal
- **Redux Toolkit** for state management
- **Socket.io** for real-time updates

### DevOps
- **Docker** for containerization
- **Kubernetes** for orchestration
- **Grafana/Prometheus** for monitoring
- **JaCoCo** for code coverage

## 📁 Project Structure

```
helpinminutes/
├── services/
│   ├── identity-service/        # Authentication service
│   ├── task-service/            # Task management
│   ├── matching-service/        # Matching algorithm
│   ├── payment-service/         # Payment processing
│   └── realtime-service/        # WebSocket handling
├── admin-portal/                # Admin dashboard
├── mobile-app/                  # React Native app
├── infrastructure/
│   ├── docker/                  # Docker configurations
│   ├── k8s/                     # Kubernetes manifests
│   └── monitoring/              # Monitoring setup
├── docs/                        # Documentation
└── scripts/                     # Utility scripts
```

## 🏃‍♂️ Quick Start

### Prerequisites

- Docker & Docker Compose
- Java 17+
- Node.js 18+
- Maven or Gradle

### Development Setup

1. **Clone the repository**
```bash
git clone https://github.com/your-org/HelpInMinutes.git
cd HelpInMinutes
```

2. **Start infrastructure services**
```bash
cd infrastructure/docker
docker-compose up -d
```

3. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your configurations
```

4. **Build and run services**
```bash
# Backend services
cd services/identity-service
mvn spring-boot:run

# Repeat for other services...

# Frontend
cd admin-portal
npm install
npm run dev

cd mobile-app
npm install
npm start
```

### Running Tests

```bash
# Run all tests
./scripts/run-tests.sh

# Run only integration tests
./scripts/run-integration-tests.sh

# Generate coverage report
./scripts/generate-coverage.sh
```

## 📖 Documentation

- [API Documentation](docs/API.md)
- [Architecture Guide](docs/ARCHITECTURE.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Development Setup](docs/DEVELOPMENT.md)
- [Swagger UI](http://localhost:8081/swagger-ui.html)

## 🧪 Testing

### Unit Tests
- **Backend**: JUnit 5 + Mockito
- **Frontend**: Jest + React Testing Library

### Integration Tests
- Testcontainers for PostgreSQL, Redis, RabbitMQ
- API integration tests with RestAssured

### Performance Tests
- JMeter/Gatling for load testing
- Database query optimization benchmarks

### Coverage Targets
- Backend: 80%+ line coverage
- Frontend: 70%+ component coverage

## 📊 Monitoring

Access monitoring dashboards:
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001
- **Logs**: http://localhost:3100 (Loki)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

- **Documentation**: [docs.helpinminutes.com](https://docs.helpinminutes.com)
- **Issues**: GitHub Issues
- **Email**: support@helpinminutes.com

---

<p align="center">
  Made with ❤️ by the HelpInMinutes Team
</p>
