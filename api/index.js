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

  const { pathname } = new URL(req.url, `http://${req.headers.host}`);

  // Health check
  if (pathname === '/api' && req.method === 'GET') {
    res.json({
      status: 'Sports Dugout API is running!',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
    return;
  }

  // Create payment intent
  if (pathname === '/api/create-payment-intent' && req.method === 'POST') {
    try {
      const { amount, currency = 'usd', email } = req.body;
      
      if (!amount || amount < 1000) {
        return res.status(400).json({ error: 'Minimum amount is $10' });
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

  // Webhook
  if (pathname === '/api/webhook' && req.method === 'POST') {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body, 
        sig, 
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      console.log('✅ Payment succeeded:', paymentIntent.id);
      // TODO: Add to contest database
    }

    res.json({ received: true });
    return;
  }

  res.status(404).json({ error: 'Endpoint not found' });
}