// Firebase database helper functions for contest management
const admin = require('firebase-admin');

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: process.env.FIREBASE_PROJECT_ID
    });
    console.log('✅ Firebase initialized successfully');
  } catch (error) {
    console.error('❌ Firebase initialization error:', error.message);
  }
}

const db = admin.firestore();

/**
 * Get contest statistics from the database
 */
async function getContestStats() {
  try {
    const entriesSnapshot = await db.collection('contest_entries').get();
    
    const totalUsers = entriesSnapshot.size;
    
    // Calculate total deposits
    let totalDeposits = 0;
    entriesSnapshot.forEach(doc => {
      const data = doc.data();
      totalDeposits += data.amount ? data.amount / 100 : 0; // Convert cents to dollars
    });
    
    // Find current leader (most referrals)
    let currentLeader = 0;
    let leaderEmail = null;
    let hasWinner = false;
    
    entriesSnapshot.forEach(doc => {
      const data = doc.data();
      const referrals = data.referrals || 0;
      
      if (referrals > currentLeader) {
        currentLeader = referrals;
        leaderEmail = data.email;
      }
      
      // Check if someone reached 1000 referrals
      if (referrals >= 1000) {
        hasWinner = true;
      }
    });
    
    return {
      totalUsers,
      totalDeposits: Math.round(totalDeposits),
      currentLeader,
      leaderEmail: leaderEmail ? leaderEmail.substring(0, 3) + '***' : 'None',
      hasWinner,
      winnerEmail: hasWinner ? leaderEmail : null
    };
  } catch (error) {
    console.error('Error fetching contest stats:', error);
    throw error;
  }
}

/**
 * Get leaderboard with top referrers
 */
async function getLeaderboard(limit = 10) {
  try {
    const snapshot = await db.collection('contest_entries')
      .orderBy('referrals', 'desc')
      .limit(limit)
      .get();
    
    const leaderboard = [];
    let rank = 1;
    
    snapshot.forEach(doc => {
      const data = doc.data();
      leaderboard.push({
        rank: rank++,
        email: data.email ? data.email.substring(0, 3) + '***' : 'Anonymous',
        referrals: data.referrals || 0,
        referralCode: data.referral_code || data.referralCode
      });
    });
    
    return leaderboard;
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    throw error;
  }
}

/**
 * Add a new contest entry to the database
 */
async function addContestEntry({ email, paymentIntentId, amount, referredBy }) {
  try {
    // Generate unique referral code
    const referralCode = 'TSD' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const referralLink = `https://thesportsdugout.com/ref/${referralCode}`;
    
    // Create contest entry
    const entryData = {
      email: email,
      paymentIntentId: paymentIntentId,
      amount: amount,
      referredBy: referredBy || null,
      referralCode: referralCode,
      referralLink: referralLink,
      referrals: 0,
      created: admin.firestore.FieldValue.serverTimestamp(),
      status: 'active'
    };
    
    // Add to database
    const docRef = await db.collection('contest_entries').add(entryData);
    
    console.log('✅ Contest entry added:', docRef.id);
    
    // If referred by someone, increment their referral count
    if (referredBy) {
      await incrementReferralCount(referredBy);
    }
    
    return {
      id: docRef.id,
      referralCode,
      referralLink,
      ...entryData
    };
  } catch (error) {
    console.error('Error adding contest entry:', error);
    throw error;
  }
}

/**
 * Check if an email has already entered the contest
 */
async function isEmailAlreadyEntered(email) {
  try {
    const snapshot = await db.collection('contest_entries')
      .where('email', '==', email)
      .limit(1)
      .get();
    
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking email:', error);
    throw error;
  }
}

/**
 * Increment referral count for a referrer
 */
async function incrementReferralCount(referralCode) {
  try {
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
      console.log('✅ Incremented referral count for:', referralCode, 'now has', newCount);
      
      // Check for winner at 1000 referrals
      if (newCount >= 1000) {
        await markAsWinner(doc.id);
      }
      
      return newCount;
    }
    return 0;
  } catch (error) {
    console.error('Error incrementing referral count:', error);
    // Don't throw - this is not critical
    return 0;
  }
}

/**
 * Find entry by referral code
 */
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
    console.error('Error finding entry by referral code:', error);
    return null;
  }
}

/**
 * Mark contest winner
 */
async function markAsWinner(entryId) {
  try {
    await db.collection('contest_entries').doc(entryId).update({
      status: 'winner',
      wonAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('🏆 WINNER DETECTED! Entry ID:', entryId);
  } catch (error) {
    console.error('Error marking winner:', error);
  }
}

module.exports = {
  getContestStats,
  getLeaderboard,
  addContestEntry,
  isEmailAlreadyEntered,
  incrementReferralCount,
  findEntryByReferralCode,
  markAsWinner
};
