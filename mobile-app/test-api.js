const axios = require('axios');

const IDENTITY_SERVICE = 'http://localhost:8081';
const TASK_SERVICE = 'http://localhost:8082';
const MATCHING_SERVICE = 'http://localhost:8083';
const PAYMENT_SERVICE = 'http://localhost:8084';
const REALTIME_SERVICE = 'http://localhost:3001';

async function testApiEndpoints() {
  console.log('Testing HelpInMinutes API endpoints...\n');

  try {
    // Test identity service health
    console.log('1. Testing identity service health:');
    const identityHealthResponse = await axios.get(`${IDENTITY_SERVICE}/api/v1/health`);
    console.log('✓ Success:', identityHealthResponse.data);

    // Test auth login endpoint
    console.log('\n2. Testing auth login endpoint:');
    try {
      const loginResponse = await axios.post(`${IDENTITY_SERVICE}/api/v1/auth/login`, {
        email: 'admin@helpinminutes.com',
        password: 'admin123'
      });
      console.log('✓ Login successful, got access token');
      const token = loginResponse.data.accessToken;

      // Test user profile with token
      console.log('\n3. Testing user profile endpoint (authenticated):');
      const profileResponse = await axios.get(`${IDENTITY_SERVICE}/api/v1/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✓ Success:', { name: profileResponse.data.name, email: profileResponse.data.email, role: profileResponse.data.role });
    } catch (authError) {
      console.log('✗ Auth test failed:', authError.message);
    }

    // Test task service health
    console.log('\n4. Testing task service health:');
    const taskHealthResponse = await axios.get(`${TASK_SERVICE}/api/v1/health`);
    console.log('✓ Success:', taskHealthResponse.data);

    // Test categories endpoint (task service)
    console.log('\n5. Testing categories endpoint (task service):');
    const categoriesResponse = await axios.get(`${TASK_SERVICE}/api/v1/categories`);
    console.log('✓ Success: Found', categoriesResponse.data.length, 'categories');

    // Test skills endpoint (task service)
    console.log('\n6. Testing skills endpoint (task service):');
    const skillsResponse = await axios.get(`${TASK_SERVICE}/api/v1/skills`);
    console.log('✓ Success: Found', skillsResponse.data.length, 'skills');

    // Test matching service health
    console.log('\n7. Testing matching service health:');
    const matchingHealthResponse = await axios.get(`${MATCHING_SERVICE}/api/v1/health`);
    console.log('✓ Success:', matchingHealthResponse.data);

    // Test payment service health
    console.log('\n8. Testing payment service health:');
    const paymentHealthResponse = await axios.get(`${PAYMENT_SERVICE}/api/v1/health`);
    console.log('✓ Success:', paymentHealthResponse.data);

    // Test payment breakdown calculation
    console.log('\n9. Testing payment breakdown calculation:');
    const breakdownResponse = await axios.get(`${PAYMENT_SERVICE}/api/v1/payments/calculate-breakdown?amount=1000`);
    console.log('✓ Success:', breakdownResponse.data);

    // Test realtime service health
    console.log('\n10. Testing realtime service health:');
    const realtimeHealthResponse = await axios.get(`${REALTIME_SERVICE}/health`);
    console.log('✓ Success:', { 
      status: realtimeHealthResponse.data.status, 
      redis: realtimeHealthResponse.data.connections.redis,
      rabbitmq: realtimeHealthResponse.data.connections.rabbitmq 
    });

    console.log('\n✅ All API endpoints are responding correctly!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testApiEndpoints();
