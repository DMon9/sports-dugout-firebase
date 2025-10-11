const admin = require('firebase-admin');

// Initialize Firebase Admin with explicit credentials
if (!admin.apps.length) {
  try {
    console.log('🔑 Initializing Firebase Admin with explicit credentials...');
    
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
      throw new Error('GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable is required');
    }
    
    const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
    const credential = admin.credential.cert(serviceAccount);
    
    admin.initializeApp({
      credential: credential,
      projectId: serviceAccount.project_id
    });
    
    console.log('✅ Firebase Admin initialized with explicit credentials');
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error.message);
    throw error;
  }
}

const db = admin.firestore();

// Generate unique referral code
function generateReferralCode() {
  return 'TSD' + Math.random().toString(36).substr(2, 6).toUpperCase();
}

// Find entry by referral code
async function findEntryByReferralCode(referralCode) {
  try {
    const snapshot = await db.collection('contest_entries')
      .where('referralCode', '==', referralCode)
      .limit(1)
      .get();
    
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }
    return null;
  } catch (error) {
    console.error('❌ Error finding entry by referral code:', error);
    return null;
  }
}

// Add contest entry with referral tracking
async function addContestEntry(paymentData) {
  try {
    console.log('📝 Adding contest entry for:', paymentData.email);
    
    const referralCode = generateReferralCode();
    const entry = {
      email: paymentData.email,
      paymentIntentId: paymentData.paymentIntentId,
      amount: paymentData.amount,
      referralCode: referralCode,
      referredBy: paymentData.referredBy || null,
      userId: paymentData.userId || null, // Support linking to user account
      referrals: 0,
      status: 'active',
      created: admin.firestore.FieldValue.serverTimestamp(),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const docRef = await db.collection('contest_entries').add(entry);
    console.log('✅ Contest entry added with ID:', docRef.id);
    
    // Update referrer's count if this was a referral
    if (paymentData.referredBy) {
      await incrementReferralCount(paymentData.referredBy);
    }
    
    return { 
      ...entry, 
      id: docRef.id,
      referralLink: `https://thesportsdugout.com/api/referral?code=${referralCode}`
    };
  } catch (error) {
    console.error('❌ Error adding contest entry:', error);
    throw error;
  }
}

// Increment referral count
async function incrementReferralCount(referralCode) {
  try {
    console.log('🔗 Incrementing referrals for code:', referralCode);
    
    const snapshot = await db.collection('contest_entries')
      .where('referralCode', '==', referralCode)
      .limit(1)
      .get();
    
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      const currentReferrals = doc.data().referrals || 0;
      
      await doc.ref.update({
        referrals: admin.firestore.FieldValue.increment(1),
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });
      
      const newCount = currentReferrals + 1;
      console.log('✅ Referral count updated:', referralCode, 'now has', newCount);
      
      // Check for winner at 1000 referrals
      if (newCount >= 1000) {
        await markAsWinner(doc.id);
      }
      
      return newCount;
    }
    return 0;
  } catch (error) {
    console.error('❌ Error incrementing referral count:', error);
    return 0;
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
    console.log('📊 Fetching real contest statistics...');
    
    const snapshot = await db.collection('contest_entries').get();
    const entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const totalUsers = entries.length;
    const totalDeposits = entries.reduce((sum, entry) => sum + (entry.amount || 0), 0);
    
    const sortedEntries = entries.sort((a, b) => (b.referrals || 0) - (a.referrals || 0));
    const leader = sortedEntries[0];
    
    const winner = entries.find(entry => entry.status === 'winner');
    
    const stats = {
      totalUsers,
      totalDeposits: Math.round(totalDeposits / 100),
      currentLeader: leader?.referrals || 0,
      leaderEmail: leader?.email?.substring(0, 3) + '***' || 'None',
      hasWinner: !!winner,
      winnerEmail: winner?.email?.substring(0, 3) + '***' || null,
      lastUpdated: new Date().toISOString()
    };
    
    console.log('✅ Contest stats loaded:', stats);
    return stats;
  } catch (error) {
    console.error('❌ Error getting contest stats:', error);
    throw error;
  }
}

// Get live leaderboard
async function getLeaderboard(limit = 10) {
  try {
    const snapshot = await db.collection('contest_entries')
      .where('referrals', '>', 0)
      .orderBy('referrals', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map((doc, index) => {
      const data = doc.data();
      return {
        rank: index + 1,
        email: data.email?.substring(0, 3) + '***' || 'Anonymous',
        referrals: data.referrals || 0,
        referralCode: data.referralCode,
        status: data.status
      };
    });
  } catch (error) {
    console.error('❌ Error getting leaderboard:', error);
    throw error;
  }
}

// Check if email already entered
async function isEmailAlreadyEntered(email) {
  try {
    const snapshot = await db.collection('contest_entries')
      .where('email', '==', email.toLowerCase())
      .limit(1)
      .get();
    
    return !snapshot.empty;
  } catch (error) {
    console.error('❌ Error checking email:', error);
    return false;
  }
}

module.exports = {
  addContestEntry,
  incrementReferralCount,
  getContestStats,
  getLeaderboard,
  isEmailAlreadyEntered,
  markAsWinner,
  findEntryByReferralCode
};
