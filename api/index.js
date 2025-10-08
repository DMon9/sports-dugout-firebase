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

  console.log('API called:', req.method, req.url);

  // Health check
  if (req.method === 'GET') {
    res.json({
      status: 'Sports Dugout API is running!',
      timestamp: new Date().toISOString(),
      stripe_configured: !!process.env.STRIPE_SECRET_KEY
    });
    return;
  }

  // Create payment intent
  if (req.method === 'POST') {
    try {
      const { amount, currency = 'usd', email } = req.body;
      
      console.log('Payment request:', { amount, email });
      
      if (!amount || amount < 1000) {
        return res.status(400).json({ error: 'Minimum amount is $10' });
      }

      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(500).json({ error: 'Stripe not configured' });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: parseInt(amount),
        currency: currency,
        metadata: {
          contest: 'sports_dugout_1000',
          email: email || '',
          timestamp: new Date().toISOString()
        },
        receipt_email: email,
        description: 'Sports Dugout Contest Entry - $1,000 Prize'
      });

      console.log('Payment intent created:', paymentIntent.id);

      res.json({
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id
      });

    } catch (error) {
      console.error('Payment error:', error);
      res.status(500).json({ 
        error: 'Payment processing failed',
        message: error.message 
      });
    }
    return;
  }

  res.status(404).json({ error: 'Endpoint not found' });
}
