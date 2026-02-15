const axios = require('axios');

async function testLogin() {
    try {
        console.log('Testing login API...');
        const response = await axios.post('http://localhost:8081/api/v1/auth/login', {
            email: 'admin@helpinminutes.com',
            password: 'admin123'
        }, {
            headers: { 'Content-Type': 'application/json' }
        });
        
        console.log('✅ Login successful!');
        console.log('Access Token:', response.data.accessToken);
        console.log('Refresh Token:', response.data.refreshToken);
        
        return response.data;
    } catch (error) {
        console.error('❌ Login failed:', error.response?.data || error.message);
        return null;
    }
}

async function testSocketConnection(token) {
    try {
        console.log('\nTesting socket connection...');
        const io = require('socket.io-client');
        const socket = io('http://localhost:3001', {
            auth: { token },
            transports: ['websocket', 'polling']
        });
        
        return new Promise((resolve) => {
            socket.on('connect', () => {
                console.log('✅ Socket connected:', socket.id);
                socket.disconnect();
                resolve(true);
            });
            
            socket.on('connect_error', (error) => {
                console.error('❌ Socket connection error:', error);
                resolve(false);
            });
            
            socket.on('disconnect', (reason) => {
                console.log('Socket disconnected:', reason);
            });
            
            // Timeout after 5 seconds
            setTimeout(() => {
                if (socket.connected) {
                    socket.disconnect();
                }
                console.error('❌ Socket connection timeout');
                resolve(false);
            }, 5000);
        });
    } catch (error) {
        console.error('❌ Socket error:', error);
        return false;
    }
}

async function testAll() {
    const loginData = await testLogin();
    
    if (loginData) {
        const socketSuccess = await testSocketConnection(loginData.accessToken);
        
        console.log('\n=== Test Results ===');
        console.log('✅ Login: Success');
        console.log(`✅ Socket Connection: ${socketSuccess ? 'Success' : 'Failed'}`);
        
        if (socketSuccess) {
            console.log('\nAll tests passed!');
        } else {
            console.log('\nSome tests failed!');
        }
    } else {
        console.log('\nLogin failed, skipping socket test');
    }
}

testAll().then(() => {
    process.exit(0);
}).catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
});
