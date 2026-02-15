const jwt = require('jsonwebtoken');
const token = "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiQlVZRVIiLCJ0eXBlIjoiQUNDRVNTIiwidXNlcklkIjoiNmMwNzQ3YTktYzM1My00OWU2LTk1YzctM2IxMTE4ZjA1M2ZkIiwiZW1haWwiOiJqYW5lLnNtaXRoQGV4YW1wbGUuY29tIiwic3ViIjoiNmMwNzQ3YTktYzM1My00OWU2LTk1YzctM2IxMTE4ZjA1M2ZkIiwiaWF0IjoxNzcwODg4NzYyLCJleHAiOjE3NzA5NzUxNjJ9.K489nr00Gt9KPPbDALwh1JMJFBxiUP-2nzmUeWvmITY";
const secret = "super-long-jwt-secret-key-for-testing-32bytes";

console.log('Token:', token);
console.log('Secret:', secret);
console.log('Secret Length:', secret.length);

try {
    const decoded = jwt.verify(token, secret);
    console.log('Decoded Token:', JSON.stringify(decoded, null, 2));
} catch (err) {
    console.error('Error:', err.name);
    console.error('Message:', err.message);
}
