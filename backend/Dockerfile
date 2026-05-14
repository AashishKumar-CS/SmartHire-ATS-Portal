# =========================================================
# STAGE 1 — BUILD APPLICATION
# =========================================================
FROM maven:3.9.6-eclipse-temurin-17 AS build

# Working directory inside container
WORKDIR /app

# Copy pom.xml first for dependency caching
COPY pom.xml .

# Download dependencies
RUN mvn dependency:go-offline

# Copy source code
COPY src ./src

# Build application
RUN mvn clean package -DskipTests


# =========================================================
# STAGE 2 — RUN APPLICATION
# =========================================================
FROM eclipse-temurin:17-jre

# Working directory
WORKDIR /app

# Copy built jar from build stage
COPY --from=build /app/target/*.jar app.jar

# Create upload directories
RUN mkdir -p uploads/images uploads/resumes

# Expose Spring Boot port
EXPOSE 8080

# Run application
ENTRYPOINT ["java", "-jar", "app.jar"]