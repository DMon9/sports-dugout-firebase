const admin = require('firebase-admin');

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
  try {
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token"
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Firebase Admin initialized');
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
  }
}

const db = admin.firestore();

// Generate unique referral code
function generateReferralCode() {
  return 'TSD' + Math.random().toString(36).substr(2, 6).toUpperCase();
}

// Add contest entry to database
async function addContestEntry(paymentData) {
  try {
    const referralCode = generateReferralCode();
    const entry = {
      email: paymentData.email,
      paymentIntentId: paymentData.paymentIntentId,
      amount: paymentData.amount,
      referralCode: referralCode,
      referredBy: paymentData.referredBy || null,
      referrals: 0,
      status: 'active',
      created: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const docRef = await db.collection('contest_entries').add(entry);
    console.log('✅ Contest entry added:', docRef.id);
    
    // Update referrer's count if this was a referral
    if (paymentData.referredBy) {
      await incrementReferralCount(paymentData.referredBy);
    }
    
    return { 
      ...entry, 
      id: docRef.id,
      referralLink: `https://thesportsdugout.com/ref/${referralCode}`
    };
  } catch (error) {
    console.error('❌ Error adding contest entry:', error);
    throw error;
  }
}

// Increment referral count
async function incrementReferralCount(referralCode) {
  try {
    const snapshot = await db.collection('contest_entries')
      .where('referralCode', '==', referralCode)
      .limit(1)
      .get();
    
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      await doc.ref.update({
        referrals: admin.firestore.FieldValue.increment(1)
      });
      
      const newCount = (doc.data().referrals || 0) + 1;
      console.log('✅ Referral count updated:', referralCode, 'now has', newCount);
      
      // Check for winner (1000 referrals)
      if (newCount >= 1000) {
        await markAsWinner(doc.id);
      }
    }
  } catch (error) {
    console.error('❌ Error incrementing referral count:', error);
  }
}

// Mark contest winner
async function markAsWinner(entryId) {
  try {
    await db.collection('contest_entries').doc(entryId).update({
      status: 'winner',
      wonAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('🏆 WINNER DETECTED! Entry ID:', entryId);
  } catch (error) {
    console.error('❌ Error marking winner:', error);
  }
}

// Get real contest statistics
async function getContestStats() {
  try {
    const snapshot = await db.collection('contest_entries').get();
    const entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const totalUsers = entries.length;
    const totalDeposits = entries.reduce((sum, entry) => sum + (entry.amount || 0), 0);
    const sortedEntries = entries.sort((a, b) => (b.referrals || 0) - (a.referrals || 0));
    const leader = sortedEntries[0];
    
    return {
      totalUsers,
      totalDeposits: Math.round(totalDeposits / 100),
      currentLeader: leader?.referrals || 0,
      leaderEmail: leader?.email?.substring(0, 3) + '***' || 'None',
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Error getting stats:', error);
    return { totalUsers: 0, totalDeposits: 0, currentLeader: 0 };
  }
}

module.exports = {
  addContestEntry,
  incrementReferralCount,
  getContestStats,
  markAsWinner
};