module.exports = async function handler(req, res) {
  try {
    console.log('Testing Stripe import...');
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
    
    // Test Stripe import
    const stripe = require('stripe');
    console.log('✅ Stripe module imported successfully');
    
    res.status(200).json({
      message: 'API working with Stripe import!',
      method: req.method,
      stripe_module_loaded: true,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({
      error: 'Function error',
      message: error.message,
      step: 'stripe_import_test'
    });
  }
};