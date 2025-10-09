cat > api/index.js << 'EOF'
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

  console.log('🔥 API Request:', {
    method: req.method,
    url: req.url,
    body: req.body,
    headers: Object.keys(req.headers)
  });

  // Health check (GET request)
  if (req.method === 'GET') {
    const response = {
      status: 'Sports Dugout API is running!',
      timestamp: new Date().toISOString(),
      stripe_configured: !!process.env.STRIPE_SECRET_KEY,
      mode: process.env.STRIPE_SECRET_KEY?.includes('test') ? 'test' : 'live',
      version: '2.1.0'
    };
    
    console.log('✅ Health check response:', response);
    res.json(response);
    return;
  }

  // Create payment intent (POST request)
  if (req.method === 'POST') {
    try {
      console.log('💳 Processing payment request...');
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      
      const { amount, currency = 'usd', email } = req.body;
      
      // Validate input
      if (!amount) {
        console.error('❌ Missing amount');
        return res.status(400).json({ 
          error: 'Amount is required',
          received: { amount, currency, email }
        });
      }
      
      if (typeof amount !== 'number' || amount < 1000) {
        console.error('❌ Invalid amount:', amount);
        return res.status(400).json({ 
          error: 'Minimum amount is $10 (1000 cents)',
          received_amount: amount
        });
      }

      if (!email || !email.includes('@')) {
        console.error('❌ Invalid email:', email);
        return res.status(400).json({ 
          error: 'Valid email is required',
          received_email: email
        });
      }

      if (!process.env.STRIPE_SECRET_KEY) {
        console.error('❌ Stripe not configured');
        return res.status(500).json({ error: 'Payment system not configured' });
      }

      console.log('✅ Input validation passed:', { amount, email });
      console.log('🔧 Creating Stripe payment intent...');

      // Create payment intent with Stripe
      const paymentIntent = await stripe.paymentIntents.create({
        amount: parseInt(amount),
        currency: currency,
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          contest: 'sports_dugout_1000',
          email: email,
          timestamp: new Date().toISOString(),
          mode: 'test',
          source: 'website'
        },
        receipt_email: email,
        description: 'Sports Dugout Contest Entry (TEST)',
        statement_descriptor: 'SPORTS DUGOUT',
      });

      console.log('🎉 Payment intent created successfully:', {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        status: paymentIntent.status,
        client_secret_exists: !!paymentIntent.client_secret
      });

      // Return success response
      const response = {
        success: true,
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency
      };
      
      console.log('📤 Sending response:', { ...response, client_secret: '[HIDDEN]' });
      res.json(response);

    } catch (error) {
      console.error('💥 Stripe API Error:', {
        message: error.message,
        type: error.type,
        code: error.code,
        param: error.param,
        stack: error.stack?.split('\n')[0]
      });

      // Send detailed error response
      res.status(500).json({ 
        error: error.message || 'Payment setup failed',
        error_type: error.type || 'unknown_error',
        error_code: error.code || 'unknown_code',
        stripe_error: true
      });
    }
    return;
  }

  // Method not allowed
  console.log('❌ Method not allowed:', req.method);
  res.status(405).json({ 
    error: 'Method not allowed',
    allowed_methods: ['GET', 'POST']
  });
}
EOF