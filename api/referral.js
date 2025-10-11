// Import database functions
let dbFunctions = null;
try {
  dbFunctions = require('./database');
} catch (error) {
  console.log('Database not available:', error.message);
}

module.exports = async function handler(req, res) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'text/html');
    
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    // Extract referral code from URL path like /api/referral?code=TSD123ABC
    const url = new URL(req.url, `http://${req.headers.host}`);
    const referralCode = url.searchParams.get('code');
    
    console.log('🔗 Referral link accessed:', referralCode);
    
    if (!referralCode) {
      // Redirect to main site if no code
      res.writeHead(302, { Location: 'https://thesportsdugout.com' });
      res.end();
      return;
    }
    
    // Validate referral code exists
    let referrerExists = false;
    if (dbFunctions) {
      try {
        const referrer = await dbFunctions.findEntryByReferralCode(referralCode);
        referrerExists = !!referrer;
        console.log(referrerExists ? '✅ Valid referral code' : '❌ Invalid referral code');
      } catch (error) {
        console.error('Error checking referral code:', error);
      }
    }
    
    // Generate HTML page with referral tracking
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Join The Sports Dugout Contest - Referred by ${referralCode}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .hero-gradient { background: linear-gradient(135deg, #1a202c 0%, #2d3748 25%, #4a5568 75%, #718096 100%); }
        .pulse-gold { animation: pulse-gold 2s ease-in-out infinite; }
        @keyframes pulse-gold { 0%, 100% { box-shadow: 0 0 20px #FFD700; } 50% { box-shadow: 0 0 40px #FFD700, 0 0 60px #FFA500; } }
    </style>
</head>
<body class="bg-gray-900 text-white">
    <!-- Referral Banner -->
    <div class="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-center py-4 font-bold text-lg">
        🎉 You've been invited to join the $1,000 Contest! 🎉
    </div>
    
    <div class="hero-gradient min-h-screen flex items-center justify-center">
        <div class="container mx-auto px-4 text-center">
            <div class="max-w-lg mx-auto bg-gradient-to-r from-green-500/20 to-emerald-600/20 backdrop-blur-lg rounded-2xl p-8 border-2 border-green-400">
                <div class="text-6xl mb-4">🏆</div>
                <h1 class="text-4xl font-black text-green-400 mb-4">You're Invited!</h1>
                <p class="text-xl text-gray-300 mb-6">Someone shared their referral link with you. Join the contest and you both benefit!</p>
                
                <div class="bg-gray-800/50 rounded-lg p-4 mb-6">
                    <div class="text-green-400 font-bold mb-2">✅ Your Benefits:</div>
                    <ul class="text-gray-300 text-left space-y-2">
                        <li>• Enter the $1,000 contest</li>
                        <li>• Get your own referral link</li>
                        <li>• Earn money for referrals</li>
                        <li>• Access premium features</li>
                    </ul>
                </div>
                
                ${referrerExists ? `
                <div class="bg-blue-500/20 rounded-lg p-3 mb-6 border border-blue-400">
                    <div class="text-blue-400 font-bold">🔗 Referral Code: ${referralCode}</div>
                    <div class="text-sm text-blue-200">This referrer will get credit when you join!</div>
                </div>
                ` : `
                <div class="bg-red-500/20 rounded-lg p-3 mb-6 border border-red-400">
                    <div class="text-red-400 font-bold">⚠️ Invalid referral code</div>
                    <div class="text-sm text-red-200">You can still join the contest normally!</div>
                </div>
                `}
                
                <button onclick="joinWithReferral('${referralCode}')" class="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold py-4 px-8 rounded-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 pulse-gold mb-4">
                    🚀 JOIN $1,000 CONTEST NOW
                </button>
                
                <div class="text-sm text-gray-400">
                    <a href="https://thesportsdugout.com" class="hover:text-white">Join without referral</a>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        // Store referral code and redirect to main site with signup
        function joinWithReferral(code) {
            console.log('🔗 Joining with referral code:', code);
            
            // Store referral code in localStorage
            localStorage.setItem('referralCode', code);
            
            // Redirect to main site and trigger signup
            window.location.href = 'https://thesportsdugout.com?ref=' + code + '&signup=true';
        }
        
        // Track page view
        console.log('📊 Referral page viewed for code:', '${referralCode}');
    </script>
</body>
</html>
    `;
    
    res.status(200).send(html);
    
  } catch (error) {
    console.error('❌ Referral handler error:', error);
    res.writeHead(302, { Location: 'https://thesportsdugout.com' });
    res.end();
  }
};
