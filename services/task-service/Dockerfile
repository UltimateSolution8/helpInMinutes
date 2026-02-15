# Multi-stage build for task-service
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /app

# Install Git and Maven
RUN apk add --no-cache git maven

# Copy the parent pom.xml and install it
COPY pom.xml .
RUN mvn install -N -B

# Copy shared module pom.xml and source
COPY shared/pom.xml ./shared/pom.xml
COPY shared/src ./shared/src

# Build the shared module first
WORKDIR /app/shared
RUN mvn clean install -DskipTests -B

# Return to app directory and copy service source
WORKDIR /app
COPY services/task-service/pom.xml .
COPY services/task-service/src ./src

# Build the task service (skip test compilation)
RUN mvn clean package -DskipTests -Dmaven.test.skip=true -B

# Runtime stage
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Create non-root user
RUN addgroup -S helpinminutes && adduser -S helpinminutes -G helpinminutes

# Copy JAR from builder
COPY --from=builder /app/target/task-service-1.0.0.jar app.jar

# Change ownership
RUN chown -R helpinminutes:helpinminutes /app

# Switch to non-root user
USER helpinminutes

# Expose port
EXPOSE 8082

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8082/actuator/health || exit 1

# Run the application
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
