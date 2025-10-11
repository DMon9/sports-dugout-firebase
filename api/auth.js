const admin = require('firebase-admin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    console.log('🔑 Initializing Firebase Admin for auth...');
    
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
      throw new Error('GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable is required');
    }
    
    const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
    const credential = admin.credential.cert(serviceAccount);
    
    admin.initializeApp({
      credential: credential,
      projectId: serviceAccount.project_id
    });
    
    console.log('✅ Firebase Admin initialized for auth');
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error.message);
  }
}

const db = admin.firestore();

// JWT secret - should be in environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'sports-dugout-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

/**
 * Register a new user
 */
async function registerUser({ email, password, firstName, lastName, phone }) {
  try {
    console.log('📝 Registering new user:', email);
    
    // Check if user already exists
    const existingUser = await db.collection('users')
      .where('email', '==', email.toLowerCase())
      .limit(1)
      .get();
    
    if (!existingUser.empty) {
      throw new Error('User already exists with this email');
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user document
    const userData = {
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName: firstName || '',
      lastName: lastName || '',
      phone: phone || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLogin: admin.firestore.FieldValue.serverTimestamp(),
      status: 'active'
    };
    
    const userRef = await db.collection('users').add(userData);
    console.log('✅ User registered with ID:', userRef.id);
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: userRef.id, email: email.toLowerCase() },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    // Create session
    await db.collection('sessions').add({
      userId: userRef.id,
      token: token,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      status: 'active'
    });
    
    return {
      userId: userRef.id,
      email: email.toLowerCase(),
      firstName: firstName || '',
      lastName: lastName || '',
      token: token
    };
  } catch (error) {
    console.error('❌ Error registering user:', error);
    throw error;
  }
}

/**
 * Login user
 */
async function loginUser({ email, password }) {
  try {
    console.log('🔐 Logging in user:', email);
    
    // Find user by email
    const userSnapshot = await db.collection('users')
      .where('email', '==', email.toLowerCase())
      .limit(1)
      .get();
    
    if (userSnapshot.empty) {
      throw new Error('Invalid email or password');
    }
    
    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();
    
    // Check if user is active
    if (userData.status !== 'active') {
      throw new Error('Account is not active');
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, userData.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }
    
    // Update last login
    await userDoc.ref.update({
      lastLogin: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: userDoc.id, email: userData.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    // Create session
    await db.collection('sessions').add({
      userId: userDoc.id,
      token: token,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      status: 'active'
    });
    
    console.log('✅ User logged in:', userDoc.id);
    
    return {
      userId: userDoc.id,
      email: userData.email,
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      token: token
    };
  } catch (error) {
    console.error('❌ Error logging in user:', error);
    throw error;
  }
}

/**
 * Verify JWT token
 */
async function verifyToken(token) {
  try {
    // Verify JWT
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if session exists and is active
    const sessionSnapshot = await db.collection('sessions')
      .where('token', '==', token)
      .where('status', '==', 'active')
      .limit(1)
      .get();
    
    if (sessionSnapshot.empty) {
      throw new Error('Invalid or expired session');
    }
    
    const sessionData = sessionSnapshot.docs[0].data();
    
    // Check if session expired
    if (sessionData.expiresAt.toDate() < new Date()) {
      throw new Error('Session expired');
    }
    
    return decoded;
  } catch (error) {
    console.error('❌ Error verifying token:', error);
    throw error;
  }
}

/**
 * Get user profile
 */
async function getUserProfile(userId) {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data();
    
    // Get user's contest entries
    const entriesSnapshot = await db.collection('contest_entries')
      .where('userId', '==', userId)
      .get();
    
    const entries = entriesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return {
      userId: userDoc.id,
      email: userData.email,
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      phone: userData.phone || '',
      createdAt: userData.createdAt,
      lastLogin: userData.lastLogin,
      contestEntries: entries
    };
  } catch (error) {
    console.error('❌ Error getting user profile:', error);
    throw error;
  }
}

/**
 * Update user profile
 */
async function updateUserProfile(userId, updates) {
  try {
    console.log('📝 Updating user profile:', userId);
    
    const allowedUpdates = {
      firstName: updates.firstName,
      lastName: updates.lastName,
      phone: updates.phone
    };
    
    // Remove undefined values
    Object.keys(allowedUpdates).forEach(key => {
      if (allowedUpdates[key] === undefined) {
        delete allowedUpdates[key];
      }
    });
    
    if (Object.keys(allowedUpdates).length === 0) {
      throw new Error('No valid updates provided');
    }
    
    await db.collection('users').doc(userId).update({
      ...allowedUpdates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('✅ User profile updated:', userId);
    
    return await getUserProfile(userId);
  } catch (error) {
    console.error('❌ Error updating user profile:', error);
    throw error;
  }
}

/**
 * Logout user (invalidate session)
 */
async function logoutUser(token) {
  try {
    const sessionSnapshot = await db.collection('sessions')
      .where('token', '==', token)
      .where('status', '==', 'active')
      .limit(1)
      .get();
    
    if (!sessionSnapshot.empty) {
      await sessionSnapshot.docs[0].ref.update({
        status: 'inactive',
        loggedOutAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    console.log('✅ User logged out');
    return { success: true, message: 'Logged out successfully' };
  } catch (error) {
    console.error('❌ Error logging out user:', error);
    throw error;
  }
}

/**
 * Link contest entry to user account
 */
async function linkContestEntryToUser(userId, entryId) {
  try {
    console.log('🔗 Linking contest entry to user:', userId, entryId);
    
    await db.collection('contest_entries').doc(entryId).update({
      userId: userId,
      linkedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('✅ Contest entry linked to user');
    return { success: true };
  } catch (error) {
    console.error('❌ Error linking contest entry:', error);
    throw error;
  }
}

module.exports = {
  registerUser,
  loginUser,
  verifyToken,
  getUserProfile,
  updateUserProfile,
  logoutUser,
  linkContestEntryToUser
};
