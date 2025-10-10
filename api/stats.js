// Import database functions (only if Firebase is configured)
let dbFunctions = null;
try {
  if (process.env.FIREBASE_PROJECT_ID) {
    dbFunctions = require('./db-functions');
  }
} catch (error) {
  console.log('Database not available:', error.message);
}

module.exports = async function handler(req, res) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    console.log('📊 Stats endpoint called directly');
    
    // Use real database data if available
    if (dbFunctions) {
      try {
        const stats = await dbFunctions.getContestStats();
        
        console.log('✅ Returning real stats:', stats);
        
        res.status(200).json({ 
          success: true, 
          data: stats,
          source: 'database',
          timestamp: new Date().toISOString()
        });
      } catch (dbError) {
        console.error('Database error:', dbError);
        // Fall back to mock data if database fails
        throw dbError;
      }
    } else {
      // Return simple mock data if database not configured
      const stats = {
        totalUsers: 0,
        totalDeposits: 0,
        currentLeader: 0,
        leaderEmail: 'None',
        hasWinner: false,
        lastUpdated: new Date().toISOString()
      };
      
      console.log('⚠️ Returning mock stats (database not configured):', stats);
      
      res.status(200).json({ 
        success: true, 
        data: stats,
        source: 'mock_data',
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch stats', 
      message: error.message 
    });
  }
};
