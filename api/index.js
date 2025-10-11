const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Import database functions with error handling
let dbFunctions = null;
try {
  dbFunctions = require('./database');
  console.log('✅ Database module loaded successfully');
} catch (error) {
  console.error('❌ Database module failed to load:', error.message);
}

module.exports = async function handler(req, res) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Stripe-Signature');
    
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
    
    console.log('🔥 API Request:', req.method, req.url);
    
    const url = new URL(req.url, `http://${req.headers.host}`);
    const action = url.searchParams.get('action');
    
    // Health check
    if (req.method === 'GET' && !action) {
      res.status(200).json({
        status: 'Sports Dugout API with Full Referral Support!',
        timestamp: new Date().toISOString(),
        stripe_configured: !!process.env.STRIPE_SECRET_KEY,
        firebase_configured: !!dbFunctions,
        mode: process.env.STRIPE_SECRET_KEY?.includes('test') ? 'test' : 'live',
        version: '3.3.0',
        features: ['stats', 'leaderboard', 'referral_validation', 'payment_processing']
      });
      return;
    }
    
    // Get real contest statistics with fallback
    if (req.method === 'GET' && action === 'stats') {
      console.log('📊 Stats requested');
      
      if (dbFunctions) {
        try {
          const stats = await dbFunctions.getContestStats();
          res.status(200).json({ 
            success: true, 
            data: stats,
            source: 'database'
          });
        } catch (error) {
          console.error('❌ Database stats error:', error.message);
          
          // Return fallback data if database fails
          const fallbackStats = {
            totalUsers: 0,
            totalDeposits: 0,
            currentLeader: 0,
            leaderEmail: 'None',
            hasWinner: false,
            lastUpdated: new Date().toISOString()
          };
          
          res.status(200).json({ 
            success: true, 
            data: fallbackStats,
            source: 'fallback',
            error: 'Database temporarily unavailable'
          });
        }
      } else {
        // Database not available
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
          source: 'mock'
        });
      }
      return;
    }
    
    // Get live leaderboard with fallback
    if (req.method === 'GET' && action === 'leaderboard') {
      console.log('🏆 Leaderboard requested');
      
      if (dbFunctions) {
        try {
          const leaderboard = await dbFunctions.getLeaderboard(10);
          res.status(200).json({ 
            success: true, 
            data: leaderboard,
            source: 'database'
          });
        } catch (error) {
          console.error('❌ Database leaderboard error:', error.message);
          res.status(200).json({ 
            success: true, 
            data: [],
            source: 'fallback',
            error: 'Database temporarily unavailable'
          });
        }
      } else {
        res.status(200).json({ 
          success: true, 
          data: [],
          source: 'mock'
        });
      }
      return;
    }
    
    // Validate referral code
    if (req.method === 'GET' && action === 'validate_referral') {
      const referralCode = url.searchParams.get('code');
      
      console.log('🔗 Validating referral code:', referralCode);
      
      if (!referralCode) {
        return res.status(400).json({ 
          success: false, 
          error: 'Referral code is required' 
        });
      }
      
      if (dbFunctions) {
        try {
          const referrer = await dbFunctions.findEntryByReferralCode(referralCode);
          
          if (referrer) {
            res.status(200).json({ 
              success: true, 
              valid: true,
              referrerEmail: referrer.email?.substring(0, 3) + '***',
              referrals: referrer.referrals || 0,
              source: 'database'
            });
          } else {
            res.status(200).json({ 
              success: true, 
              valid: false,
              message: 'Referral code not found',
              source: 'database'
            });
          }
        } catch (error) {
          console.error('❌ Database validation error:', error.message);
          res.status(200).json({ 
            success: true, 
            valid: false,
            source: 'fallback',
            error: 'Database temporarily unavailable'
          });
        }
      } else {
        res.status(200).json({ 
          success: true, 
          valid: false,
          source: 'mock',
          message: 'Database not configured'
        });
      }
      return;
    }
    
    // Payment processing (existing code)
    if (req.method === 'POST') {
      const { amount, currency = 'usd', email, referredBy, confirm_payment, payment_intent_id } = req.body;
      
      // Handle payment confirmation
      if (confirm_payment && payment_intent_id && dbFunctions) {
        try {
          const contestEntry = await dbFunctions.addContestEntry({
            email: email,
            paymentIntentId: payment_intent_id,
            amount: amount,
            referredBy: referredBy || null
          });
          
          res.status(200).json({
            success: true,
            message: 'Contest entry added successfully',
            referralCode: contestEntry.referralCode,
            referralLink: contestEntry.referralLink
          });
        } catch (dbError) {
          console.error('❌ Database error:', dbError);
          res.status(500).json({ error: 'Failed to add contest entry', message: dbError.message });
        }
        return;
      }
      
      // Regular payment creation
      if (!amount || amount < 1000) {
        return res.status(400).json({ error: 'Minimum amount is $10' });
      }
      
      if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Valid email required' });
      }
      
      // Check if email already entered (if database available)
      if (dbFunctions) {
        try {
          const emailExists = await dbFunctions.isEmailAlreadyEntered(email);
          if (emailExists) {
            return res.status(400).json({ 
              error: 'This email has already entered the contest',
              code: 'email_already_exists'
            });
          }
        } catch (dbError) {
          console.error('Database check failed:', dbError);
        }
      }
      
      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(500).json({ error: 'Payment system not configured' });
      }
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: parseInt(amount),
        currency: currency,
        automatic_payment_methods: { enabled: true },
        metadata: {
          contest: 'sports_dugout_1000',
          email: email,
          referredBy: referredBy || '',
          timestamp: new Date().toISOString()
        },
        receipt_email: email,
        description: 'Sports Dugout Contest Entry (TEST)'
      });
      
      console.log('✅ Payment intent created:', paymentIntent.id);
      
      res.status(200).json({
        success: true,
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id
      });
      return;
    }
    
    res.status(404).json({ error: 'Endpoint not found' });
    
  } catch (error) {
    console.error('❌ API Error:', error);
    res.status(500).json({
      error: 'Server error',
      message: error.message
    });
  }
};