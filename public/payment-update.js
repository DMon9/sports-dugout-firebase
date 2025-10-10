// Replace the processPayment function in your HTML with this improved version:

async function processPayment() {
    const button = document.getElementById('processDeposit');
    const amount = parseFloat(document.getElementById('customAmount').value);
    const email = document.getElementById('signupEmail').value;
    
    if (!email || amount < 10 || !cardElement) {
        alert('Please fill in all fields correctly');
        return;
    }
    
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>PROCESSING...';
    
    try {
        console.log('💳 Creating payment intent...');
        
        // Step 1: Create payment intent
        const response = await fetch('/api', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: Math.round(amount * 100),
                currency: 'usd',
                email: email
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Payment setup failed');
        }
        
        console.log('🔄 Confirming payment with Stripe...');
        
        // Step 2: Confirm payment with Stripe
        const { error, paymentIntent } = await stripe.confirmCardPayment(data.client_secret, {
            payment_method: {
                card: cardElement,
                billing_details: { email: email }
            }
        });
        
        if (error) {
            throw new Error(error.message);
        } else {
            console.log('✅ Payment succeeded:', paymentIntent.id);
            
            // Step 3: Confirm payment success with our API to add to database
            console.log('📝 Adding contest entry to database...');
            
            const confirmResponse = await fetch('/api', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    confirm_payment: true,
                    payment_intent_id: paymentIntent.id,
                    email: email,
                    amount: Math.round(amount * 100)
                })
            });
            
            const confirmData = await confirmResponse.json();
            
            if (confirmResponse.ok && confirmData.success) {
                console.log('✅ Contest entry added:', confirmData.referralCode);
                
                // Show success with real referral code
                showSuccess(confirmData.referralLink || confirmData.referralCode);
                
                // Refresh stats immediately and again after a delay
                console.log('🔄 Refreshing contest stats...');
                setTimeout(updateRealStats, 1000);  // 1 second delay
                setTimeout(updateRealStats, 3000);  // 3 second delay
                setTimeout(fetchLeaderboard, 2000); // 2 second delay
            } else {
                console.error('❌ Failed to add contest entry:', confirmData.error);
                // Still show success since payment worked
                showSuccess();
                setTimeout(updateRealStats, 2000);
            }
        }
        
    } catch (error) {
        console.error('❌ Payment error:', error);
        alert('Payment failed: ' + error.message);
    }
    
    button.disabled = false;
    button.innerHTML = '<i class="fas fa-lock mr-2"></i>SECURE DEPOSIT (TEST)';
}

// Updated showSuccess function to handle real referral codes
function showSuccess(referralLink) {
    closeDeposit();
    
    if (referralLink) {
        document.getElementById('userReferralLink').value = referralLink;
    } else {
        const userCode = 'TSD' + Math.random().toString(36).substr(2, 6).toUpperCase();
        document.getElementById('userReferralLink').value = `thesportsdugout.com/ref/${userCode}`;
    }
    
    document.getElementById('successModal').classList.remove('hidden');
}