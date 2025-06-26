 // Clint/assest/js/wallets.js
const walletView = document.getElementById('wallet-view');
const withdrawView = document.getElementById('withdraw-view');
const historyView = document.getElementById('history-view');
const toantSpecificView = document.getElementById('toant-specific-view');
const tonSpecificView = document.getElementById('ton-specific-view');

const showWithdrawBtn = document.getElementById('show-withdraw-btn');
const showHistoryBtn = document.getElementById('show-history-btn');
const toantCurrencyItem = document.getElementById('toant-currency-item');
const tonCurrencyItem = document.getElementById('ton-currency-item');

const toantWithdrawBtn = document.getElementById('toant-withdraw-btn');
const toantHistoryBtn = document.getElementById('toant-history-btn');

const tonWithdrawBtn = document.getElementById('ton-withdraw-btn');
const tonHistoryBtn = document.getElementById('ton-history-btn');

const backToWalletBtnWithdraw = document.getElementById('back-to-wallet-btn-withdraw');
const backToWalletBtnHistory = document.getElementById('back-to-wallet-btn-history');
const backToHomeBtn = document.getElementById('back-to-home-btn');  
const backToWalletBtnToant = document.getElementById('back-to-wallet-btn-toant');
const backToWalletBtnTon = document.getElementById('back-to-wallet-btn-ton');


 const mainBalanceDisplay = document.getElementById('main-total-coin');  
const withdrawBalanceDisplay = document.getElementById('withdraw-available-coin');
const toantSpecificBalanceDisplay = document.getElementById('toant-specific-balance');
const tonSpecificBalanceDisplay = document.getElementById('ton-specific-balance');
const tonCurrencyItemBalance = document.querySelector('#ton-currency-item span:last-child');  
const toantCurrencyItemBalance = document.querySelector('#toant-currency-item span:last-child');  
const tonAddressInput = document.querySelector('#withdraw-view input[type="text"]');
const withdrawAmountInput = document.querySelector('#withdraw-view input[type="number"]');
const finalWithdrawButton = document.querySelector('.withdraw-button-final');
const historyTransactionList = document.querySelector('.transaction-list');
const API_BASE_URL = 'http://toant.store/api'; 

function getAuthToken() {
    return localStorage.getItem('token');  
}

function hideAllViews() {
    walletView.style.display = 'none';
    withdrawView.style.display = 'none';
    historyView.style.display = 'none';
    toantSpecificView.style.display = 'none';
    tonSpecificView.style.display = 'none';
}

async function showWalletView() {
    hideAllViews();
    walletView.style.display = 'flex';
    await fetchBalances();  
}


function showWithdrawView() {
    hideAllViews();
    withdrawView.style.display = 'flex';
    withdrawBalanceDisplay.textContent = mainBalanceDisplay.textContent;
    tonAddressInput.value = '';
    withdrawAmountInput.value = '';
}

async function showHistoryView() {
    hideAllViews();
    historyView.style.display = 'flex';
    await fetchHistory(); 
}
 
function showToantSpecificView() {
    hideAllViews();
    toantSpecificView.style.display = 'flex';
    toantSpecificBalanceDisplay.textContent = toantCurrencyItemBalance.textContent;  
}

function showTonSpecificView() {
    hideAllViews();
    tonSpecificView.style.display = 'flex';
    tonSpecificBalanceDisplay.textContent = tonCurrencyItemBalance.textContent; 
}


async function fetchBalances() {
    const token = getAuthToken();
    if (!token) {
        console.error('Please Try to  log in.');
         
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/wallet/balance`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            mainBalanceDisplay.textContent = `$${data.totalBalance.toFixed(2)}`;
            tonCurrencyItemBalance.textContent = `$${data.tonBalance.toFixed(2)}`;
            toantCurrencyItemBalance.textContent = `$${data.toantBalance.toFixed(2)}`;
            withdrawBalanceDisplay.textContent = `$${data.tonBalance.toFixed(2)}`;
            tonSpecificBalanceDisplay.textContent = `$${data.tonBalance.toFixed(2)}`;
            toantSpecificBalanceDisplay.textContent = `$${data.toantBalance.toFixed(2)}`;

        } else {
            console.error('Failed to bring balance:', data.message);
            alert(`ত্রুটি: ${data.message || 'It was not possible to bring the balance.'}`);
        }
    } catch (error) {
        console.error('Network error while fetching balance:', error);
        alert('Network error. Please try again.');
    }
}

async function submitWithdrawal() {
    const token = getAuthToken();
    if (!token) {
        console.error('No authentication token found. Please login.');
        return;
    }

    const walletAddress = tonAddressInput.value.trim();
    const amount = parseFloat(withdrawAmountInput.value);

    if (!walletAddress || !amount || isNaN(amount) || amount <= 0) {
        alert('অনু গ্রহ করেPlease enter a valid TON address and a positive amount.');
        return;
    }

    if (!confirm(`Would you like to withdraw $${amount.toFixed(2)} TON to ${walletAddress}? A 0.5% fee will apply.`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/wallet/withdraw`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                coinType: 'Ton',
                walletAddress: walletAddress,
                amount: amount
            })
        });

        const data = await response.json();

        if (response.ok) {
            alert(data.message);
            tonAddressInput.value = '';
            withdrawAmountInput.value = '';
            await fetchBalances(); 
            showWalletView();
        } else {
            alert(`Withdrawal failed.: ${data.message || 'Unknown error'}`);
            console.error('Lifting error:', data);
        }
    } catch (error) {
        console.error('Network error during extraction.:', error);
        alert('Network error. Please try again.');
    }
}

async function fetchHistory() {
    const token = getAuthToken();
    if (!token) {
        console.error('No authentication token found. Please login.');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/wallet/history`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();   

        if (response.ok) {
            historyTransactionList.innerHTML = '';

            if (data.length === 0) {
                historyTransactionList.innerHTML = '<p style="text-align: center; color: #6c757d; padding: 20px;">No transaction history is available for the last 6 months.</p>';
            } else {
                data.forEach(transaction => {
                    const transactionItem = document.createElement('div');
                    transactionItem.classList.add('transaction-item');
                    transactionItem.classList.add(transaction.requestedAmount > 0 ? 'sent' : 'received'); 

                    let displayStatus = transaction.status;
                    if (transaction.status === 'Pending') {
                        const now = new Date();
                        const requestTime = new Date(transaction.requestTime);
                        const twoMinutes = 2 * 60 * 1000;
                        if (now.getTime() - requestTime.getTime() > twoMinutes) {
                            displayStatus = 'In Processing';
                        }
                    }

                    transactionItem.innerHTML = `
                        <div class="transaction-details">
                            <span class="transaction-type">Withdrawal (${displayStatus})</span>
                            <span class="transaction-address">${transaction.walletAddress.substring(0, 10)}...${transaction.walletAddress.substring(transaction.walletAddress.length - 10)}</span>
                            <span class="transaction-date">${new Date(transaction.requestTime).toLocaleDateString()} ${new Date(transaction.requestTime).toLocaleTimeString()}</span>
                        </div>
                        <span class="transaction-amount">-$${transaction.requestedAmount.toFixed(2)}</span>
                    `;
                    historyTransactionList.appendChild(transactionItem);
                });
            }
        } else {
            console.error('Failed to fetch history', data.message);
            alert(`ত্রুটি: ${data.message || 'It was not possible to bring history.'}`);
        }
    } catch (error) {
        console.error('Network error while fetching history:', error);
        alert('Network error. Please try again.');
    }
}


showWithdrawBtn.addEventListener('click', showWithdrawView);
showHistoryBtn.addEventListener('click', showHistoryView);
toantCurrencyItem.addEventListener('click', showToantSpecificView);
tonCurrencyItem.addEventListener('click', showTonSpecificView);

toantHistoryBtn.addEventListener('click', showHistoryView);

tonWithdrawBtn.addEventListener('click', showWithdrawView);
tonHistoryBtn.addEventListener('click', showHistoryView);

backToWalletBtnWithdraw.addEventListener('click', showWalletView);
backToWalletBtnHistory.addEventListener('click', showWalletView);
backToHomeBtn.addEventListener('click', () => {
    window.location.href = '/Clint/dashboard.html';
});
backToWalletBtnToant.addEventListener('click', showWalletView);
backToWalletBtnTon.addEventListener('click', showWalletView);

finalWithdrawButton.addEventListener('click', submitWithdrawal);

document.addEventListener('DOMContentLoaded', showWalletView);