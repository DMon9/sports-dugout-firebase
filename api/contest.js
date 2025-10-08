// This will connect to a real database later
let contestData = {
  totalUsers: 1247,
  totalDeposits: 15600,
  leaderboard: [
    { rank: 1, user: "SportsBeast47", referrals: 47, earnings: 470 },
    { rank: 2, user: "BetMaster23", referrals: 39, earnings: 390 },
    { rank: 3, user: "GridironPro", referrals: 31, earnings: 310 }
  ],
  contestEnd: "2024-03-31",
  daysLeft: 87
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'GET') {
    res.json(contestData);
  }
  
  if (req.method === 'POST') {
    const { action, userId, referrals } = req.body;
    
    if (action === 'update_referrals') {
      // Update user referrals
      contestData.totalUsers += 1;
      contestData.totalDeposits += 10;
    }
    
    res.json({ success: true, data: contestData });
  }
}
