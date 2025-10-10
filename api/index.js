module.exports = async function handler(req, res) {
  console.log('Function called:', req.method, req.url);
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  res.status(200).json({
    message: 'Minimal API is working!',
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString()
  });
};