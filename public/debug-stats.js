// Add this to your HTML to test the direct endpoint:

async function testStatsEndpoint() {
    console.log('🧪 Testing stats endpoints...');
    
    // Test 1: Main API health
    try {
        console.log('Testing /api...');
        const healthResponse = await fetch('/api');
        const healthData = await healthResponse.json();
        console.log('✅ API Health:', healthData);
    } catch (error) {
        console.error('❌ API Health failed:', error);
    }
    
    // Test 2: Stats with query parameter
    try {
        console.log('Testing /api?action=stats...');
        const statsResponse = await fetch('/api?action=stats');
        const statsData = await statsResponse.json();
        console.log('✅ Stats (query):', statsData);
    } catch (error) {
        console.error('❌ Stats (query) failed:', error);
    }
    
    // Test 3: Direct stats endpoint
    try {
        console.log('Testing /api/stats...');
        const directStatsResponse = await fetch('/api/stats');
        const directStatsData = await directStatsResponse.json();
        console.log('✅ Stats (direct):', directStatsData);
    } catch (error) {
        console.error('❌ Stats (direct) failed:', error);
    }
}

// Run the test
testStatsEndpoint();
