#!/bin/bash

# HelpInMinutes - Test Data Seeder
# Seeds test data for development and testing environments

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Seed Identity Service data
seed_identity_data() {
    print_header "Seeding Identity Service Data"
    
    cd "$PROJECT_ROOT/services/identity-service"
    
    # Create test users
    curl -s -X POST http://localhost:8081/api/v1/auth/signup \
        -H "Content-Type: application/json" \
        -d '{
            "email": "customer1@test.com",
            "password": "TestPassword123!",
            "firstName": "Test",
            "lastName": "Customer",
            "phone": "+1234567890"
        }' | jq -r '.userId' && print_success "Created customer1@test.com"
    
    curl -s -X POST http://localhost:8081/api/v1/auth/signup \
        -H "Content-Type: application/json" \
        -d '{
            "email": "helper1@test.com",
            "password": "TestPassword123!",
            "firstName": "Test",
            "lastName": "Helper",
            "phone": "+1234567891"
        }' | jq -r '.userId' && print_success "Created helper1@test.com"
    
    # Register helper
    curl -s -X POST http://localhost:8081/api/v1/helpers/register \
        -H "Content-Type: application/json" \
        -d '{
            "skills": ["CLEANING", "DELIVERY"],
            "hourlyRate": 25.0,
            "latitude": 40.7128,
            "longitude": -74.0060,
            "bio": "Professional cleaner with 5 years experience"
        }' && print_success "Registered helper1 as service provider"
    
    print_success "Identity data seeded"
}

# Seed Task Service data
seed_task_data() {
    print_header "Seeding Task Service Data"
    
    # Create sample tasks
    curl -s -X POST http://localhost:8082/api/v1/tasks \
        -H "Content-Type: application/json" \
        -d '{
            "title": "House Cleaning",
            "description": "Deep cleaning of 2-bedroom apartment",
            "category": "CLEANING",
            "latitude": 40.7128,
            "longitude": -74.0060,
            "address": "123 Main St, New York, NY",
            "estimatedDuration": 120,
            "budget": 50.0
        }' && print_success "Created task: House Cleaning"
    
    curl -s -X POST http://localhost:8082/api/v1/tasks \
        -H "Content-Type: application/json" \
        -d '{
            "title": "Package Delivery",
            "description": "Deliver package from store to customer",
            "category": "DELIVERY",
            "latitude": 40.7580,
            "longitude": -73.9855,
            "address": "456 Oak Ave, New York, NY",
            "estimatedDuration": 60,
            "budget": 30.0
        }' && print_success "Created task: Package Delivery"
    
    print_success "Task data seeded"
}

# Seed Payment Service data
seed_payment_data() {
    print_header "Seeding Payment Service Data"
    
    # Create sample payment
    curl -s -X POST http://localhost:8084/api/v1/payments/order \
        -H "Content-Type: application/json" \
        -d '{
            "taskId": "task-1",
            "amount": 50.0,
            "currency": "INR"
        }' && print_success "Created payment order"
    
    print_success "Payment data seeded"
}

# Verify seeded data
verify_data() {
    print_header "Verifying Seeded Data"
    
    print_info "Checking services..."
    
    # Check Identity Service
    if curl -s http://localhost:8081/actuator/health | grep -q '"status":"UP"'; then
        print_success "Identity Service is healthy"
    else
        print_info "Identity Service may not be running"
    fi
    
    # Check Task Service
    if curl -s http://localhost:8082/actuator/health | grep -q '"status":"UP"'; then
        print_success "Task Service is healthy"
    else
        print_info "Task Service may not be running"
    fi
    
    # Check Payment Service
    if curl -s http://localhost:8084/actuator/health | grep -q '"status":"UP"'; then
        print_success "Payment Service is healthy"
    else
        print_info "Payment Service may not be running"
    fi
}

main() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║          HelpInMinutes Test Data Seeder                  ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    print_info "Make sure all services are running before seeding"
    print_info "Seed data will be created with test@example.com accounts\n"
    
    read -p "Continue? (y/n) " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        seed_identity_data
        seed_task_data
        seed_payment_data
        verify_data
        
        print_header "Test Data Seeding Complete"
        print_success "Test data has been seeded successfully!"
        
        echo -e "\nTest Accounts:"
        echo "  Customer: customer1@test.com / TestPassword123!"
        echo "  Helper:   helper1@test.com / TestPassword123!"
    else
        print_info "Seeding cancelled"
    fi
}

main "$@"
