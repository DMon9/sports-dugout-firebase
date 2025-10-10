module.exports = async function handler(req, res) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
    
    console.log('Initializing Stripe...');
    
    // Initialize Stripe with environment variable
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    console.log('Stripe key exists:', !!stripeKey);
    
    if (!stripeKey) {
      return res.status(500).json({
        error: 'Stripe secret key not configured',
        step: 'stripe_key_check'
      });
    }
    
    const stripe = require('stripe')(stripeKey);
    console.log('✅ Stripe initialized successfully');
    
    if (req.method === 'GET') {
      res.status(200).json({
        status: 'Sports Dugout API Working!',
        timestamp: new Date().toISOString(),
        stripe_configured: true,
        mode: stripeKey.includes('test') ? 'test' : 'live'
      });
      return;
    }
    
    res.status(200).json({ message: 'API working with Stripe!' });
    
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({
      error: 'Function error',
      message: error.message,
      step: 'stripe_initialization'
    });
  }
};