cat > api/create-payment-intent.js << 'EOF'
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('💳 Payment Intent Request:', req.body);
    
    const { amount, currency = 'usd', email } = req.body;
    
    // Validation
    if (!amount || amount < 1000) {
      return res.status(400).json({ error: 'Minimum amount is $10' });
    }

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email required' });
    }

    // Create payment intent
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

    console.log('✅ Payment intent created:', paymentIntent.id);

    res.json({
      success: true,
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({ 
      error: error.message,
      type: error.type 
    });
  }
}
EOF