cat > api/index.js << 'EOF'
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  console.log('API called:', req.method, req.url);

  // Health check
  if (req.method === 'GET') {
    res.json({
      status: 'Sports Dugout API is running!',
      timestamp: new Date().toISOString(),
      stripe_configured: !!process.env.STRIPE_SECRET_KEY,
      mode: process.env.STRIPE_SECRET_KEY?.includes('test') ? 'test' : 'live'
    });
    return;
  }

  // Create payment intent
  if (req.method === 'POST') {
    try {
      const { amount, currency = 'usd', email } = req.body;
      
      console.log('💳 Payment request:', { amount, email, mode: 'test' });
      
      if (!amount || amount < 1000) {
        return res.status(400).json({ error: 'Minimum amount is $10' });
      }

      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(500).json({ error: 'Stripe not configured' });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: parseInt(amount),
        currency: currency,
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          contest: 'sports_dugout_1000',
          email: email || '',
          timestamp: new Date().toISOString(),
          mode: 'test'
        },
        receipt_email: email,
        description: 'Sports Dugout Contest Entry - $1,000 Prize (TEST)',
      });

      console.log('✅ Payment intent created:', paymentIntent.id);

      res.json({
        success: true,
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id
      });

    } catch (error) {
      console.error('❌ Stripe error:', error);
      res.status(500).json({ 
        error: error.message || 'Payment processing failed',
        type: error.type || 'unknown_error'
      });
    }
    return;
  }

  res.status(404).json({ error: 'Endpoint not found' });
}
EOF
