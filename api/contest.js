const { 
  getContestStats, 
  getLeaderboard 
} = require('../lib/db-functions');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method === 'GET') {
    try {
      // Get real-time contest statistics from database
      const stats = await getContestStats();
      const leaderboard = await getLeaderboard(10);
      
      // Calculate days left until contest end
      const contestEndDate = new Date('2024-03-31');
      const now = new Date();
      const daysLeft = Math.max(0, Math.ceil((contestEndDate - now) / (1000 * 60 * 60 * 24)));
      
      // Format response to match expected structure
      const contestData = {
        totalUsers: stats.totalUsers,
        totalDeposits: stats.totalDeposits,
        leaderboard: leaderboard.map(entry => ({
          rank: entry.rank,
          user: entry.email,
          referrals: entry.referrals,
          earnings: entry.referrals * 10 // $10 per referral
        })),
        contestEnd: "2024-03-31",
        daysLeft: daysLeft,
        currentLeader: stats.currentLeader,
        hasWinner: stats.hasWinner
      };
      
      res.json(contestData);
    } catch (error) {
      console.error('❌ Error fetching contest data:', error);
      res.status(500).json({ 
        error: 'Failed to fetch contest data',
        message: error.message 
      });
    }
  }
  
  if (req.method === 'POST') {
    // POST requests are now handled by the main API endpoint
    // This endpoint is for read-only contest data
    res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Use the main API endpoint for creating contest entries' 
    });
  }
};
