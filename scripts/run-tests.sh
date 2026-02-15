#!/bin/bash

# HelpInMinutes Integration Test Runner
# This script runs all integration tests for the microservices

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}HelpInMinutes Integration Test Suite${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Test Configuration
SERVICES=("identity-service" "task-service" "matching-service" "payment-service" "realtime-service")
TEST_REPORTS_DIR="test-results"
COVERAGE_DIR="coverage"

# Create directories
mkdir -p $TEST_REPORTS_DIR
mkdir -p $COVERAGE_DIR

# Function to print status
print_status() {
    local service=$1
    local status=$2
    local message=$3
    
    if [ "$status" == "PASS" ]; then
        echo -e "${GREEN}✓${NC} $service: $message"
    elif [ "$status" == "FAIL" ]; then
        echo -e "${RED}✗${NC} $service: $message"
    elif [ "$status" == "SKIP" ]; then
        echo -e "${YELLOW}⊘${NC} $service: $message"
    else
        echo -e "${BLUE}→${NC} $service: $message"
    fi
}

# Check if Docker is running
check_docker() {
    echo -e "${BLUE}Checking Docker...${NC}"
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}Error: Docker is not running. Please start Docker first.${NC}"
        exit 1
    fi
    print_status "Docker" "PASS" "Docker is running"
}

# Check if Docker Compose is available
check_docker_compose() {
    echo -e "${BLUE}Checking Docker Compose...${NC}"
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${YELLOW}Warning: docker-compose not found, trying 'docker compose'${NC}"
        if ! command -v docker &> /dev/null; then
            print_status "Docker Compose" "FAIL" "Not found"
            exit 1
        fi
    fi
    print_status "Docker Compose" "PASS" "Available"
}

# Wait for services to be healthy
wait_for_services() {
    echo -e "${BLUE}Waiting for services to be healthy...${NC}"
    
    local services=("postgres:5432" "redis:6379" "rabbitmq:15672")
    local max_attempts=30
    local attempt=0
    
    for service in "${services[@]}"; do
        local host=$(echo $service | cut -d: -f1)
        local port=$(echo $service | cut -d: -f2)
        
        while [ $attempt -lt $max_attempts ]; do
            if nc -z $host $port 2>/dev/null; then
                print_status "$host:$port" "PASS" "Healthy"
                break
            fi
            
            attempt=$((attempt + 1))
            echo "  Waiting for $host:$port... ($attempt/$max_attempts)"
            sleep 2
        done
        
        if [ $attempt -eq $max_attempts ]; then
            print_status "$host:$port" "FAIL" "Not responding"
            exit 1
        fi
    done
}

# Run Java service tests
run_java_tests() {
    local service=$1
    echo -e "${BLUE}Running tests for $service...${NC}"
    
    cd services/$service
    
    # Check if Maven is available
    if ! command -v mvn &> /dev/null; then
        print_status $service "SKIP" "Maven not found, using Docker"
        
        # Run tests using Docker
        docker run --rm \
            -v $(pwd):/app \
            -v ~/.m2:/root/.m2 \
            -w /app \
            maven:3.9-eclipse-temurin-21 \
            mvn test -f pom.xml \
            -DskipTests=false \
            -Dspring.profiles.active=test \
            -Dtest="*IntegrationTest"
    else
        # Run tests using local Maven
        mvn test \
            -DskipTests=false \
            -Dspring.profiles.active=test \
            -Dtest="*IntegrationTest" \
            -Djacoco.skip=false \
            -Djacoco.outputDirectory=$COVERAGE_DIR \
            -Dmaven.test.failure.ignore=false
    fi
    
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        print_status $service "PASS" "All tests passed"
    else
        print_status $service "FAIL" "Some tests failed"
        return 1
    fi
}

# Run Node.js service tests
run_node_tests() {
    local service=$1
    echo -e "${BLUE}Running tests for $service...${NC}"
    
    cd services/$service
    
    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        print_status $service "SKIP" "No package.json found"
        return 0
    fi
    
    # Run tests using Docker
    docker run --rm \
        -v $(pwd):/app \
        -w /app \
        node:20-alpine \
        npm install --silent 2>/dev/null && \
        npm test -- --coverage
    
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        print_status $service "PASS" "All tests passed"
    else
        print_status $service "FAIL" "Some tests failed"
        return 1
    fi
}

# Run end-to-end tests
run_e2e_tests() {
    echo -e "${BLUE}Running End-to-End Tests...${NC}"
    
    # Check if Cypress is available
    if [ -d "e2e" ]; then
        cd e2e
        
        # Run Cypress tests
        if command -v cypress &> /dev/null; then
            cypress run --spec "cypress/e2e/**/*" --reporter junit --reporter-options "mochaFile=$TEST_REPORTS_DIR/e2e-results.xml"
        else
            print_status "E2E Tests" "SKIP" "Cypress not installed"
        fi
        
        cd ..
    else
        print_status "E2E Tests" "SKIP" "No e2e directory found"
    fi
}

# Run API contract tests
run_contract_tests() {
    echo -e "${BLUE}Running API Contract Tests...${NC}"
    
    # Check for Postman collection
    if [ -f "docs/postman/HelpInMinutes.postman_collection.json" ]; then
        # Run Newman tests if available
        if command -v newman &> /dev/null; then
            newman run "docs/postman/HelpInMinutes.postman_collection.json" \
                --environment "docs/postman/test-environment.json" \
                --reporters cli,junit \
                --reporter-junit-export "$TEST_REPORTS_DIR/contract-results.xml"
            
            print_status "Contract Tests" "PASS" "Completed"
        else
            print_status "Contract Tests" "SKIP" "Newman not installed"
        fi
    else
        print_status "Contract Tests" "SKIP" "No Postman collection found"
    fi
}

# Generate test report
generate_report() {
    echo ""
    echo -e "${BLUE}Generating Test Report...${NC}"
    
    # Combine all test results
    {
        echo "# HelpInMinutes Test Report"
        echo ""
        echo "Generated: $(date)"
        echo ""
        echo "## Summary"
        echo ""
        echo "## Service Tests"
        for service in "${SERVICES[@]}"; do
            if [ -f "$TEST_REPORTS_DIR/$service-results.xml" ]; then
                echo "### $service"
                echo "- Report: $TEST_REPORTS_DIR/$service-results.xml"
            fi
        done
    } > $TEST_REPORTS_DIR/TEST_REPORT.md
    
    print_status "Report" "PASS" "Generated at $TEST_REPORTS_DIR"
}

# Main execution
main() {
    echo ""
    echo -e "${YELLOW}Starting test suite...${NC}"
    echo ""
    
    # Pre-flight checks
    check_docker
    check_docker_compose
    
    # Wait for infrastructure
    wait_for_services
    
    # Run tests for each service
    local failed=0
    
    for service in "${SERVICES[@]}"; do
        if [ -d "services/$service" ]; then
            if [ -f "services/$service/pom.xml" ]; then
                run_java_tests $service || failed=1
            elif [ -f "services/$service/package.json" ]; then
                run_node_tests $service || failed=1
            fi
        fi
    done
    
    # Run additional tests
    run_contract_tests
    run_e2e_tests
    
    # Generate report
    generate_report
    
    echo ""
    echo -e "${BLUE}========================================${NC}"
    
    if [ $failed -eq 0 ]; then
        echo -e "${GREEN}All tests passed!${NC}"
        exit 0
    else
        echo -e "${RED}Some tests failed. Please check the reports.${NC}"
        exit 1
    fi
}

# Parse arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Options:"
        echo "  --help, -h          Show this help message"
        echo "  --java              Run only Java service tests"
        echo "  --node              Run only Node.js service tests"
        echo "  --e2e               Run only E2E tests"
        echo "  --contract          Run only contract tests"
        echo "  --all               Run all tests (default)"
        exit 0
        ;;
    --java)
        for service in "${SERVICES[@]}"; do
            if [ -d "services/$service" ] && [ -f "services/$service/pom.xml" ]; then
                run_java_tests $service
            fi
        done
        ;;
    --node)
        for service in "${SERVICES[@]}"; do
            if [ -d "services/$service" ] && [ -f "services/$service/package.json" ]; then
                run_node_tests $service
            fi
        done
        ;;
    --e2e)
        run_e2e_tests
        ;;
    --contract)
        run_contract_tests
        ;;
    --all|*)
        main
        ;;
esac
