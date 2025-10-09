const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { 
  addContestEntry, 
  getContestStats, 
  getLeaderboard,
  isEmailAlreadyEntered
} = require('./database');

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Stripe-Signature');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { pathname } = new URL(req.url || '', `http://${req.headers.host}`);
  console.log('🔥 API Request:', req.method, pathname);

  // Health check
  if (req.method === 'GET' && pathname === '/api') {
    res.json({
      status: 'Sports Dugout API with Database Integration!',
      timestamp: new Date().toISOString(),
      stripe_configured: !!process.env.STRIPE_SECRET_KEY,
      firebase_configured: !!(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL),
      mode: process.env.STRIPE_SECRET_KEY?.includes('test') ? 'test' : 'live',
      version: '3.0.0'
    });
    return;
  }

  // Get live contest statistics
  if (req.method === 'GET' && pathname === '/api/stats') {
    try {
      const stats = await getContestStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      console.error('❌ Error getting stats:', error);
      res.status(500).json({ error: 'Failed to fetch contest statistics' });
    }
    return;
  }

  // Get live leaderboard
  if (req.method === 'GET' && pathname === '/api/leaderboard') {
    try {
      const leaderboard = await getLeaderboard(10);
      res.json({ success: true, data: leaderboard });
    } catch (error) {
      console.error('❌ Error getting leaderboard:', error);
      res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
    return;
  }

  // Create payment intent with database integration
  if (req.method === 'POST' && pathname === '/api') {
    try {
      const { amount, currency = 'usd', email, referredBy } = req.body;
      
      console.log('💳 Payment request:', { amount, email, referredBy });
      
      // Validation
      if (!amount || amount < 1000) {
        return res.status(400).json({ error: 'Minimum amount is $10' });
      }

      if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Valid email required' });
      }

      // Check if email already entered contest
      const emailExists = await isEmailAlreadyEntered(email);
      if (emailExists) {
        return res.status(400).json({ 
          error: 'This email has already entered the contest',
          code: 'email_already_exists'
        });
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

      res.json({
        success: true,
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id
      });

    } catch (error) {
      console.error('💥 Payment creation error:', error);
      res.status(500).json({ 
        error: error.message,
        type: error.type || 'payment_error'
      });
    }
    return;
  }

  // Webhook for completed payments
  if (req.method === 'POST' && pathname === '/api/webhook') {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body, 
        sig, 
        process.env.STRIPE_WEBHOOK_SECRET
      );
      console.log('✅ Webhook verified:', event.type);
    } catch (err) {
      console.error('❌ Webhook verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle successful payment
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      
      console.log('🎉 Payment succeeded, adding to database:', paymentIntent.id);

      try {
        // Add entry to contest database
        const contestEntry = await addContestEntry({
          email: paymentIntent.metadata.email,
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount,
          referredBy: paymentIntent.metadata.referredBy || null
        });

        console.log('✅ Contest entry created:', contestEntry.id);
      } catch (dbError) {
        console.error('❌ Database error after successful payment:', dbError);
        // Payment succeeded but database failed - need manual intervention
      }
    }

    res.json({ received: true });
    return;
  }

  res.status(404).json({ error: 'Endpoint not found' });
}