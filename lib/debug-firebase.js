module.exports = async function handler(req, res) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    
    console.log('🔍 DEBUG: Starting Firebase connection test');
    console.log('🔍 Environment variables check:');
    console.log('- GOOGLE_APPLICATION_CREDENTIALS_JSON exists:', !!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
    console.log('- FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID);
    console.log('- FIREBASE_CLIENT_EMAIL exists:', !!process.env.FIREBASE_CLIENT_EMAIL);
    console.log('- FIREBASE_PRIVATE_KEY exists:', !!process.env.FIREBASE_PRIVATE_KEY);
    
    // Test 1: Try to parse JSON credentials
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
      try {
        const creds = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
        console.log('✅ JSON credentials parsed successfully');
        console.log('- Project ID from JSON:', creds.project_id);
        console.log('- Client email from JSON:', creds.client_email?.substring(0, 20) + '...');
        console.log('- Private key exists in JSON:', !!creds.private_key);
      } catch (parseError) {
        console.error('❌ Failed to parse JSON credentials:', parseError.message);
      }
    }
    
    // Test 2: Try Firebase Admin initialization
    let firebaseStatus = 'not_attempted';
    try {
      console.log('🔍 Attempting Firebase Admin initialization...');
      const admin = require('firebase-admin');
      
      if (admin.apps.length > 0) {
        console.log('✅ Firebase Admin already initialized');
        firebaseStatus = 'already_initialized';
      } else {
        console.log('🔍 Initializing Firebase Admin...');
        
        let credential;
        if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
          const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
          credential = admin.credential.cert(serviceAccount);
          console.log('✅ Using JSON credential');
        } else {
          console.log('❌ No JSON credentials found');
          throw new Error('No credentials configured');
        }
        
        admin.initializeApp({
          credential: credential,
          projectId: process.env.FIREBASE_PROJECT_ID
        });
        
        console.log('✅ Firebase Admin initialized successfully');
        firebaseStatus = 'success';
      }
      
      // Test 3: Try database connection
      const db = admin.firestore();
      console.log('🔍 Testing Firestore connection...');
      
      // Simple test query
      const testRef = db.collection('test').limit(1);
      await testRef.get();
      console.log('✅ Firestore connection successful');
      firebaseStatus = 'firestore_connected';
      
    } catch (firebaseError) {
      console.error('❌ Firebase error:', firebaseError.message);
      console.error('❌ Firebase stack:', firebaseError.stack);
      firebaseStatus = 'failed: ' + firebaseError.message;
    }
    
    // Return debug info
    res.status(200).json({
      success: true,
      debug: {
        firebase_status: firebaseStatus,
        environment_variables: {
          has_json_creds: !!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON,
          has_project_id: !!process.env.FIREBASE_PROJECT_ID,
          has_client_email: !!process.env.FIREBASE_CLIENT_EMAIL,
          has_private_key: !!process.env.FIREBASE_PRIVATE_KEY
        },
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('💥 Debug endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
};