
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  console.log('🔥 API called:', req.method, req.url);

  // Health check (GET request)
  if (req.method === 'GET') {
    res.json({
      status: 'Sports Dugout API Working!',
      timestamp: new Date().toISOString(),
      stripe_configured: !!process.env.STRIPE_SECRET_KEY,
      mode: process.env.STRIPE_SECRET_KEY?.includes('test') ? 'test' : 'live'
    });
    return;
  }

  // Create payment intent (POST request)
  if (req.method === 'POST') {
    try {
      console.log('💳 Creating payment intent...');
      console.log('Request body:', req.body);
      
      const { amount, currency = 'usd', email } = req.body;
      
      // Validation
      if (!amount || amount < 1000) {
        console.error('❌ Invalid amount:', amount);
        return res.status(400).json({ error: 'Minimum amount is $10' });
      }

      if (!email || !email.includes('@')) {
        console.error('❌ Invalid email:', email);
        return res.status(400).json({ error: 'Valid email required' });
      }

      if (!process.env.STRIPE_SECRET_KEY) {
        console.error('❌ Stripe not configured');
        return res.status(500).json({ error: 'Payment system not configured' });
      }

      console.log('✅ Creating Stripe payment intent...');

      const paymentIntent = await stripe.paymentIntents.create({
        amount: parseInt(amount),
        currency: currency,
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          contest: 'sports_dugout_1000',
          email: email,
          timestamp: new Date().toISOString()
        },
        receipt_email: email,
        description: 'Sports Dugout Contest Entry (TEST)'
      });

      console.log('🎉 Payment intent created:', paymentIntent.id);

      res.json({
        success: true,
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id
      });

    } catch (error) {
      console.error('💥 Stripe error:', error);
      res.status(500).json({ 
        error: error.message,
        type: error.type || 'stripe_error'
      });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
