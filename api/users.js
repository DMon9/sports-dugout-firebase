// User management API endpoints
let authFunctions = null;
try {
  authFunctions = require('./auth');
  console.log('✅ Auth module loaded successfully');
} catch (error) {
  console.error('❌ Auth module failed to load:', error.message);
}

module.exports = async function handler(req, res) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
    
    if (!authFunctions) {
      return res.status(500).json({ 
        success: false, 
        error: 'Authentication system not available' 
      });
    }
    
    console.log('👤 User API Request:', req.method, req.url);
    
    const url = new URL(req.url, `http://${req.headers.host}`);
    const action = url.searchParams.get('action');
    
    // User registration
    if (req.method === 'POST' && action === 'register') {
      const { email, password, firstName, lastName, phone } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ 
          success: false, 
          error: 'Email and password are required' 
        });
      }
      
      if (password.length < 6) {
        return res.status(400).json({ 
          success: false, 
          error: 'Password must be at least 6 characters' 
        });
      }
      
      try {
        const user = await authFunctions.registerUser({
          email,
          password,
          firstName,
          lastName,
          phone
        });
        
        res.status(201).json({
          success: true,
          message: 'User registered successfully',
          data: {
            userId: user.userId,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            token: user.token
          }
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      }
      return;
    }
    
    // User login
    if (req.method === 'POST' && action === 'login') {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ 
          success: false, 
          error: 'Email and password are required' 
        });
      }
      
      try {
        const user = await authFunctions.loginUser({ email, password });
        
        res.status(200).json({
          success: true,
          message: 'Login successful',
          data: {
            userId: user.userId,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            token: user.token
          }
        });
      } catch (error) {
        res.status(401).json({
          success: false,
          error: error.message
        });
      }
      return;
    }
    
    // User logout
    if (req.method === 'POST' && action === 'logout') {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
          success: false, 
          error: 'No authorization token provided' 
        });
      }
      
      const token = authHeader.substring(7);
      
      try {
        await authFunctions.logoutUser(token);
        
        res.status(200).json({
          success: true,
          message: 'Logged out successfully'
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      }
      return;
    }
    
    // Get user profile (requires authentication)
    if (req.method === 'GET' && action === 'profile') {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
          success: false, 
          error: 'No authorization token provided' 
        });
      }
      
      const token = authHeader.substring(7);
      
      try {
        const decoded = await authFunctions.verifyToken(token);
        const profile = await authFunctions.getUserProfile(decoded.userId);
        
        res.status(200).json({
          success: true,
          data: profile
        });
      } catch (error) {
        res.status(401).json({
          success: false,
          error: error.message
        });
      }
      return;
    }
    
    // Update user profile (requires authentication)
    if (req.method === 'PUT' && action === 'profile') {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
          success: false, 
          error: 'No authorization token provided' 
        });
      }
      
      const token = authHeader.substring(7);
      const { firstName, lastName, phone } = req.body;
      
      try {
        const decoded = await authFunctions.verifyToken(token);
        const profile = await authFunctions.updateUserProfile(decoded.userId, {
          firstName,
          lastName,
          phone
        });
        
        res.status(200).json({
          success: true,
          message: 'Profile updated successfully',
          data: profile
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      }
      return;
    }
    
    // Link contest entry to user account
    if (req.method === 'POST' && action === 'link_entry') {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
          success: false, 
          error: 'No authorization token provided' 
        });
      }
      
      const token = authHeader.substring(7);
      const { entryId } = req.body;
      
      if (!entryId) {
        return res.status(400).json({ 
          success: false, 
          error: 'Entry ID is required' 
        });
      }
      
      try {
        const decoded = await authFunctions.verifyToken(token);
        await authFunctions.linkContestEntryToUser(decoded.userId, entryId);
        
        res.status(200).json({
          success: true,
          message: 'Contest entry linked successfully'
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      }
      return;
    }
    
    res.status(404).json({ 
      success: false, 
      error: 'Endpoint not found' 
    });
    
  } catch (error) {
    console.error('❌ User API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: error.message
    });
  }
};
