const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Import database functions (only if Firebase is configured)
let dbFunctions = null;
try {
  if (process.env.FIREBASE_PROJECT_ID) {
    dbFunctions = require('./database');
  }
} catch (error) {
  console.log('Database not available:', error.message);
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
    
    // Parse the URL to get query parameters
    const url = new URL(req.url, `http://${req.headers.host}`);
    const action = url.searchParams.get('action');
    
    // Health check - main API endpoint
    if (req.method === 'GET' && !action) {
      res.status(200).json({
        status: 'Sports Dugout API with Database Integration!',
        timestamp: new Date().toISOString(),
        stripe_configured: !!process.env.STRIPE_SECRET_KEY,
        firebase_configured: !!(process.env.FIREBASE_PROJECT_ID && dbFunctions),
        mode: process.env.STRIPE_SECRET_KEY?.includes('test') ? 'test' : 'live',
        version: '3.0.0',
        available_actions: ['stats', 'leaderboard']
      });
      return;
    }
    
    // Get real contest statistics
    if (req.method === 'GET' && action === 'stats') {
      console.log('📊 Stats requested');
      if (dbFunctions) {
        try {
          const stats = await dbFunctions.getContestStats();
          res.status(200).json({ success: true, data: stats });
        } catch (error) {
          console.error('Stats error:', error);
          res.status(500).json({ error: 'Failed to fetch stats', message: error.message });
        }
      } else {
        res.status(503).json({ error: 'Database not configured' });
      }
      return;
    }
    
    // Get live leaderboard
    if (req.method === 'GET' && action === 'leaderboard') {
      console.log('🏆 Leaderboard requested');
      if (dbFunctions) {
        try {
          const leaderboard = await dbFunctions.getLeaderboard(10);
          res.status(200).json({ success: true, data: leaderboard });
        } catch (error) {
          console.error('Leaderboard error:', error);
          res.status(500).json({ error: 'Failed to fetch leaderboard', message: error.message });
        }
      } else {
        res.status(503).json({ error: 'Database not configured' });
      }
      return;
    }
    
    // Create payment intent with database integration
    if (req.method === 'POST') {
      const { amount, currency = 'usd', email, referredBy } = req.body;
      
      console.log('💳 Payment request:', { amount, email, referredBy });
      
      // Validation
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
          // Continue with payment even if DB check fails
        }
      }
      
      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(500).json({ error: 'Payment system not configured' });
      }
      
      // Create Stripe payment intent
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
    
    res.status(404).json({ 
      error: 'Endpoint not found',
      method: req.method,
      url: req.url,
      available_endpoints: [
        'GET /api - Health check',
        'GET /api?action=stats - Contest statistics',
        'GET /api?action=leaderboard - Leaderboard',
        'POST /api - Create payment'
      ]
    });
    
  } catch (error) {
    console.error('❌ API Error:', error);
    res.status(500).json({
      error: 'Server error',
      message: error.message
    });
  }
};