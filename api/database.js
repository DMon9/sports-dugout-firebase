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
    console.log('✅ Firebase Admin initialized successfully');
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
    console.log('📝 Adding contest entry for:', paymentData.email);
    
    const referralCode = generateReferralCode();
    const entry = {
      email: paymentData.email,
      paymentIntentId: paymentData.paymentIntentId,
      amount: paymentData.amount, // Amount in cents
      referralCode: referralCode,
      referredBy: paymentData.referredBy || null,
      referrals: 0,
      status: 'active',
      created: admin.firestore.FieldValue.serverTimestamp(),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Add to contest_entries collection
    const docRef = await db.collection('contest_entries').add(entry);
    console.log('✅ Contest entry added with ID:', docRef.id);
    
    // Update referrer's count if this was a referral
    if (paymentData.referredBy) {
      await incrementReferralCount(paymentData.referredBy);
    }
    
    // Also store in payments collection for tracking
    await db.collection('payments').doc(paymentData.paymentIntentId).set({
      email: paymentData.email,
      amount: paymentData.amount,
      status: 'completed',
      contestEntryId: docRef.id,
      created: admin.firestore.FieldValue.serverTimestamp()
    });
    
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

// Increment referral count for referrer
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
      console.log('✅ Referral count updated:', referralCode, 'now has', newCount, 'referrals');
      
      // Check if they hit 1000 referrals (WINNER!)
      if (newCount >= 1000) {
        await markAsWinner(doc.id);
      }
      
      return newCount;
    } else {
      console.log('⚠️ Referral code not found:', referralCode);
      return 0;
    }
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
    
    // Add to winners collection
    await db.collection('winners').add({
      contestEntryId: entryId,
      prize: 1000,
      currency: 'USD',
      wonAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'pending_payout'
    });
    
    console.log('🏆 WINNER DETECTED! Entry ID:', entryId);
    console.log('🎉 $1,000 PRIZE AWARDED!');
  } catch (error) {
    console.error('❌ Error marking winner:', error);
  }
}

// Get real-time contest statistics
async function getContestStats() {
  try {
    console.log('📊 Fetching real contest statistics...');
    
    const snapshot = await db.collection('contest_entries').get();
    const entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const totalUsers = entries.length;
    const totalDeposits = entries.reduce((sum, entry) => sum + (entry.amount || 0), 0);
    
    // Find current leader
    const sortedEntries = entries.sort((a, b) => (b.referrals || 0) - (a.referrals || 0));
    const leader = sortedEntries[0];
    
    // Check for winner
    const winner = entries.find(entry => entry.status === 'winner');
    
    const stats = {
      totalUsers,
      totalDeposits: Math.round(totalDeposits / 100), // Convert cents to dollars
      currentLeader: leader?.referrals || 0,
      leaderEmail: leader?.email?.substring(0, 3) + '***' || 'None',
      hasWinner: !!winner,
      winnerEmail: winner?.email?.substring(0, 3) + '***' || null,
      lastUpdated: new Date().toISOString(),
      averageDeposit: totalUsers > 0 ? Math.round((totalDeposits / 100) / totalUsers) : 0
    };
    
    console.log('✅ Contest stats loaded:', stats);
    return stats;
  } catch (error) {
    console.error('❌ Error getting contest stats:', error);
    // Return fallback data if database fails
    return {
      totalUsers: 0,
      totalDeposits: 0,
      currentLeader: 0,
      leaderEmail: 'None',
      hasWinner: false,
      winnerEmail: null,
      lastUpdated: new Date().toISOString(),
      averageDeposit: 0
    };
  }
}

// Get live leaderboard
async function getLeaderboard(limit = 10) {
  try {
    console.log('🏆 Fetching live leaderboard...');
    
    const snapshot = await db.collection('contest_entries')
      .where('referrals', '>', 0)
      .orderBy('referrals', 'desc')
      .orderBy('created', 'asc') // Tie-breaker: earlier entry wins
      .limit(limit)
      .get();
    
    const leaderboard = snapshot.docs.map((doc, index) => {
      const data = doc.data();
      return {
        rank: index + 1,
        email: data.email?.substring(0, 3) + '***' || 'Anonymous',
        referrals: data.referrals || 0,
        referralCode: data.referralCode,
        status: data.status,
        joinedDate: data.created?.toDate()?.toLocaleDateString() || 'Recently'
      };
    });
    
    console.log('✅ Leaderboard loaded:', leaderboard.length, 'entries');
    return leaderboard;
  } catch (error) {
    console.error('❌ Error getting leaderboard:', error);
    return [];
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
  markAsWinner
};