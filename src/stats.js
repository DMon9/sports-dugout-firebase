module.exports = async function handler(req, res) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    console.log('📊 Stats endpoint called');
    
    // Check if Firebase is configured
    const firebaseConfigured = !!(
      process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON || 
      (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL)
    );
    
    console.log('Firebase configured:', firebaseConfigured);
    console.log('Environment variables present:', {
      hasJSON: !!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON,
      hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
      hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL
    });
    
    if (firebaseConfigured) {
      // Try to use real database
      try {
        const { getContestStats } = require('./database');
        const stats = await getContestStats();
        
        res.status(200).json({ 
          success: true, 
          data: stats,
          source: 'firebase'
        });
      } catch (dbError) {
        console.error('Database error:', dbError.message);
        
        // Fall back to mock data
        const mockStats = {
          totalUsers: 0,
          totalDeposits: 0,
          currentLeader: 0,
          leaderEmail: 'None',
          hasWinner: false,
          lastUpdated: new Date().toISOString()
        };
        
        res.status(200).json({ 
          success: true, 
          data: mockStats,
          source: 'fallback',
          error: dbError.message
        });
      }
    } else {
      // Return mock data if not configured
      const mockStats = {
        totalUsers: Math.floor(Math.random() * 10) + 1,
        totalDeposits: Math.floor(Math.random() * 100) + 50,
        currentLeader: Math.floor(Math.random() * 5),
        leaderEmail: 'tes***',
        hasWinner: false,
        lastUpdated: new Date().toISOString()
      };
      
      res.status(200).json({ 
        success: true, 
        data: mockStats,
        source: 'mock',
        note: 'Firebase not configured - showing sample data'
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