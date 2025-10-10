module.exports = async function handler(req, res) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    console.log('📊 Stats endpoint called directly');
    
    // For now, return simple mock data that updates
    const stats = {
      totalUsers: Math.floor(Math.random() * 10) + 1,
      totalDeposits: Math.floor(Math.random() * 100) + 50,
      currentLeader: Math.floor(Math.random() * 5),
      leaderEmail: 'test***',
      hasWinner: false,
      lastUpdated: new Date().toISOString()
    };
    
    console.log('✅ Returning stats:', stats);
    
    res.status(200).json({ 
      success: true, 
      data: stats,
      source: 'mock_data',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch stats', 
      message: error.message 
    });
  }
};
