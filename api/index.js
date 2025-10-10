module.exports = async function handler(req, res) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
    
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    if (req.method === 'GET') {
      res.status(200).json({
        status: 'Sports Dugout API Working!',
        timestamp: new Date().toISOString(),
        stripe_configured: !!process.env.STRIPE_SECRET_KEY,
        mode: process.env.STRIPE_SECRET_KEY?.includes('test') ? 'test' : 'live'
      });
      return;
    }
    
    if (req.method === 'POST') {
      const { amount, currency = 'usd', email } = req.body;
      
      if (!amount || amount < 1000) {
        return res.status(400).json({ error: 'Minimum amount is $10' });
      }
      
      if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Valid email required' });
      }
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: parseInt(amount),
        currency: currency,
        automatic_payment_methods: { enabled: true },
        metadata: {
          contest: 'sports_dugout_1000',
          email: email,
          timestamp: new Date().toISOString()
        },
        receipt_email: email,
        description: 'Sports Dugout Contest Entry (TEST)'
      });
      
      res.status(200).json({
        success: true,
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id
      });
      return;
    }
    
    res.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    console.error('❌ API Error:', error);
    res.status(500).json({
      error: 'Server error',
      message: error.message
    });
  }
};