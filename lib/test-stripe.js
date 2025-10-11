module.exports = async function handler(req, res) {
  try {
    console.log('Testing Stripe import...');
    
    // Test if stripe can be required
    const stripe = require('stripe');
    console.log('Stripe imported successfully');
    
    res.status(200).json({
      message: 'Stripe import test successful',
      stripe_available: true
    });
  } catch (error) {
    console.error('Stripe import failed:', error);
    res.status(500).json({
      message: 'Stripe import failed',
      error: error.message,
      stack: error.stack
    });
  }
};