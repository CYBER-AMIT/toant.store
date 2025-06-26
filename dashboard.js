// dashboard.js code
const API_BASE_URL = 'http://toant.store/api';
// Daily Claim Cooldown  
const DAILY_CLAIM_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

const toggleButton = document.getElementById("toggleMode");
const menuToggle = document.getElementById("menuToggle");
const sidebar = document.getElementById("sidebar");
const claimBtn = document.getElementById("claimBtn"); // Daily Login Claim button
const dailyClaimMessage = document.getElementById("dailyClaimMessage");
 
let currentUserState = {};

// --- UI Logic ---
// Light/Dark Mode Toggle
toggleButton.addEventListener("click", () => {
    document.body.classList.toggle("dark");
});

// ---- Logout button ---- //

function logout() {
    window.location.href ='login.html'
}

// Mobile Sidebar Toggle
menuToggle.addEventListener("click", () => {
    sidebar.classList.toggle("open");
});

// Copy Referral Link
function copyRefLink() {
    const input = document.getElementById("refLink");
    input.select();
    document.execCommand("copy");
    alert("Referral link copied!");
}

// --- API and Claim Logic ---
async function loadDashboardTasksState() {
    console.log("Loading dashboard tasks state...");
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('Authentication token not found. Redirecting to login.');
            window.location.assign('/login.html'); 
            return;
        }

        const response = await fetch(`${API_BASE_URL}/tasks/state`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                alert('Session expired. Please login again.');
                window.location.assign('/login.html');
            }
            const errorData = await response.json();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message || 'Unknown error'}`);
        }

        const data = await response.json();
        console.log('Dashboard Tasks State Data received:', data);
        if (data.success) {
            currentUserState = data;
            updateDashboardDailyClaimUI();
            updateTotalCoinsDisplay(currentUserState.userTotalCoins);
        } else {
            console.error('Failed to load dashboard task state:', data.message);
        }
    } catch (error) {
        console.error('Error loading dashboard task state:', error);
        alert('Failed to load dashboard data. Please try again.');
    }
}

function updateDashboardDailyClaimUI() {
    console.log("Updating daily claim UI...");
    if (!currentUserState || !currentUserState.dailyClaimInfo) {
        console.warn("currentUserState or dailyClaimInfo not available for UI update.");
        return;
    }

    const { dailyClaimInfo } = currentUserState;

    if (claimBtn) {
        if (dailyClaimInfo.canClaim) {
            claimBtn.textContent = `Claim Day ${dailyClaimInfo.currentDay}`;
            claimBtn.disabled = false;
            claimBtn.style.opacity = '1';
            claimBtn.style.cursor = 'pointer';
            dailyClaimMessage.textContent = `Get ${DAILY_REWARDS[dailyClaimInfo.currentDay] || 0} coins!`; 
            dailyClaimMessage.style.color = '#28a745';
        } else {
            const remainingTime = dailyClaimInfo.cooldownRemaining;
            const hours = Math.floor(remainingTime / (1000 * 60 * 60));
            const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);

            claimBtn.textContent = `Claim in ${hours}h ${minutes}m ${seconds}s`;
            claimBtn.disabled = true;
            claimBtn.style.opacity = '0.5';
            claimBtn.style.cursor = 'not-allowed';
            dailyClaimMessage.textContent = 'Come back later to claim your next reward.';
            dailyClaimMessage.style.color = '#ffc107';
 
            setTimeout(updateDashboardDailyClaimUI, 1000);
        }
    }
}

function updateTotalCoinsDisplay(coins) {
    console.log("Updating total coins display:", coins);
    const totalCoinsElement = document.querySelector('.total-coins-display');
    if (totalCoinsElement) {
        totalCoinsElement.textContent = coins || 0;
    }
}


if (claimBtn) {
    claimBtn.addEventListener('click', async () => {
        console.log("Claim button clicked.");
        if (!currentUserState.dailyClaimInfo || !currentUserState.dailyClaimInfo.canClaim) {
            alert('Daily reward is not ready to be claimed yet.');
            return;
        }

        const dayToClaim = currentUserState.dailyClaimInfo.currentDay;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/tasks/claim-daily-reward`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ dayToClaim })
            });

            const data = await response.json();
            console.log('Daily claim response:', data);

            if (data.success) {
                alert(data.message);
                 
                currentUserState.userTotalCoins = data.newTotalCoins;
                currentUserState.dailyClaimInfo.lastClaimedDay = data.dailyClaimState.lastClaimedDay;
                currentUserState.dailyClaimInfo.lastClaimTime = data.dailyClaimState.lastClaimTime;
                currentUserState.dailyClaimInfo.cooldownRemaining = DAILY_CLAIM_COOLDOWN_MS;
                currentUserState.dailyClaimInfo.canClaim = false;

                updateDashboardDailyClaimUI();
                updateTotalCoinsDisplay(currentUserState.userTotalCoins); 
            } else {
                alert(`Failed to claim daily reward: ${data.message}`);
            }
        } catch (error) {
            console.error('Error claiming daily reward from dashboard:', error);
            alert('An error occurred while claiming daily reward.');
        }
    });
}

// --- NEW: Fetch and Display Dashboard Card Data ---
async function loadDashboardCardsData() {
    console.log("Loading dashboard cards data...");
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('Authentication token not found for cards data. Redirecting to login.');
            window.location.assign('/login.html');
            return;
        }

        const response = await fetch(`${API_BASE_URL}/dashboard-cards-data`, { 
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                alert('Session expired for cards data. Please login again.');
                window.location.assign('/login.html');
            }
            const errorData = await response.json();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message || 'Unknown error'}`);
        }

        const data = await response.json();
        console.log('Dashboard Cards Data received:', data);

        // Total Mining (Toant)
        const totalMiningDisplay = document.getElementById('totalMiningDisplay');
        if (totalMiningDisplay) {
            totalMiningDisplay.innerText = (data.totalMiningToant !== undefined) ? data.totalMiningToant.toFixed(2) : 'N/A';
        } else {
            console.warn("Element with ID 'totalMiningDisplay' not found.");
        }

        // Total Earning
        const totalEarningUsdt = document.getElementById('totalEarningUsdt');
        if (totalEarningUsdt) {
            totalEarningUsdt.innerText = (data.totalEarningUsdt !== undefined) ? `$${data.totalEarningUsdt.toFixed(2)}` : 'N/A';
        } else {
            console.warn("Element with ID 'totalEarningUsdt' not found.");
        }
        
        const totalEarningTon = document.getElementById('totalEarningTon');
        if (totalEarningTon) {
            totalEarningTon.innerText = (data.totalEarningTon !== undefined) ? data.totalEarningTon.toFixed(2) : 'N/A';
        } else {
            console.warn("Element with ID 'totalEarningTon' not found.");
        }

        // Total Withdraw
        const totalWithdrawUsd = document.getElementById('totalWithdrawUsd');
        if (totalWithdrawUsd) {
            totalWithdrawUsd.innerText = (data.totalWithdrawUsd !== undefined) ? `$${data.totalWithdrawUsd.toFixed(2)}` : 'N/A';
        } else {
            console.warn("Element with ID 'totalWithdrawUsd' not found.");
        }

        const totalWithdrawTon = document.getElementById('totalWithdrawTon');
        if (totalWithdrawTon) {
            totalWithdrawTon.innerText = (data.totalWithdrawTon !== undefined) ? data.totalWithdrawTon.toFixed(2) : 'N/A';
        } else {
            console.warn("Element with ID 'totalWithdrawTon' not found.");
        }

        // Referral Link
        const refLinkInput = document.getElementById('refLink');
        if (refLinkInput) {
            refLinkInput.value = data.rafferLink || 'Error loading link';
        } else {
            console.warn("Element with ID 'refLink' not found.");
        }

    } catch (error) {
        console.error('Error loading dashboard cards data:', error);
        alert('Failed to load dashboard card data. Please try again.');
    }
}


// --- Navigation Functions (Existing from your code) ---
// ---- search ber ---- //
document.getElementById('searchInput').addEventListener('input', function () {
    const keyword = this.value.toLowerCase();
    const items = document.querySelectorAll('.card-box, .menu-item'); // Assuming card-box is a selector for your cards

    items.forEach(item => {
        const text = item.innerText.toLowerCase();
        if (text.includes(keyword)) {
            item.style.display = 'flex'; // for card
        } else {
            item.style.display = 'none';
        }
    });
});

// ---- dashboard to overvew page ---- // 
function Dashboard(event) {
    event.preventDefault(); 
    window.location.assign('dashboard.html');
} 
// ---- dashboard to Home page ---- // 
function Home(event) {
    event.preventDefault();  
    window.location.assign("Home.html");
} 

// ---- dashboard to Leaderboard page ---- // 
function Leaderboards(event) {
    event.preventDefault();  
    window.location.assign('Leaderboards.html');
} 
// ---- dashboard to Friend page ---- // 
function friend(event) {
    event.preventDefault();
    window.location.assign('friend.html');
} 
// ---- dashboard to Tasks page ---- // 
function Tasks(event) {
    event.preventDefault();
    window.location.assign('Tasks.html');
} 
// ---- dashboard to Wallet page ---- // 
function wallets(event) {
    event.preventDefault(); 
    window.location.assign('wallets.html');
} 
// ---- dashboard to Game & Earn page ---- // 
function Game(event) {
    event.preventDefault();
    window.location.assign('Game Comperment.html');
} 
// ---- dashboard to Downlode app page ---- // 
function downlode(event) {
    event.preventDefault();
    window.location.assign('Download app.html');
} 
// ---- dashboard to Get Supoort ---- // 
function support(event) {
    event.preventDefault();
    window.location.assign('Support.html');
} 

// --- Initial Load ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Content Loaded. Initiating data loads.");
    loadDashboardTasksState();
    loadDashboardCardsData();
});

const DAILY_REWARDS = {
    1: 260, 
    2: 2000,
    3: 6000,
    4: 12000,
    5: 16000,
    6: 20000,
    7: 2000000
};