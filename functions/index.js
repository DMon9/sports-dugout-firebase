const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(functions.config().stripe.secret_key);

admin.initializeApp();
const db = admin.firestore();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    status: 'Sports Dugout API is running!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.get('/test', (req, res) => {
  res.json({
    stripe_configured: !!functions.config().stripe?.secret_key,
    firebase_connected: true,
    environment: 'firebase'
  });
});

app.post('/create-payment-intent', async (req, res) => {
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

    await db.collection('payments').doc(paymentIntent.id).set({
      id: paymentIntent.id,
      amount: amount,
      email: email,
      status: 'created',
      created: admin.firestore.FieldValue.serverTimestamp()
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
});

app.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body, 
      sig, 
      functions.config().stripe.webhook_secret
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    
    await db.collection('payments').doc(paymentIntent.id).update({
      status: 'succeeded',
      completed: admin.firestore.FieldValue.serverTimestamp()
    });

    const email = paymentIntent.metadata.email;
    if (email) {
      await db.collection('contest_entries').add({
        email: email,
        amount: paymentIntent.amount,
        payment_id: paymentIntent.id,
        referral_code: 'TSD' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        created: admin.firestore.FieldValue.serverTimestamp(),
        referrals: 0
      });
    }
  }

  res.json({ received: true });
});

app.get('/leaderboard', async (req, res) => {
  try {
    const snapshot = await db.collection('contest_entries')
      .orderBy('referrals', 'desc')
      .limit(10)
      .get();
    
    const leaderboard = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      leaderboard.push({
        email: data.email?.substring(0, 3) + '***',
        referrals: data.referrals || 0,
        referral_code: data.referral_code
      });
    });

    res.json({ leaderboard });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

exports.api = functions.https.onRequest(app);
