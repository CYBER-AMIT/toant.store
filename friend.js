// ---- Friend js code ---- //
document.addEventListener('DOMContentLoaded', function () {
    // ---- Referral page elements ---- //
    const referralLinkText = document.getElementById('referralLinkText');
    const copyBtn = document.getElementById('copyBtn');
    const referralBtn = document.getElementById('referralBtn');
    const generationBtn = document.getElementById('generationBtn');
    const directRefsElement = document.getElementById('directRefs');
    const totalRefsElement = document.getElementById('totalRefs');
    const earningsElement = document.getElementById('earnings');
    const levelElementRef = document.getElementById('level');
    const referralList = document.getElementById('referralList');
    const generationReport = document.getElementById('generationReport');
    const statsSection = document.getElementById('statsSection');
    const backToMain = document.getElementById('backToMain');

    const API_BASE_URL = 'http://toant.store/api';

    async function fetchReferralData() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('No authentication token found. Please log in.');
                return;
            }

            const response = await fetch(`${API_BASE_URL}/referrals/data`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch referral data');
            }

            const data = await response.json();
            console.log('Fetched referral data:', data);

            referralLinkText.textContent = data.referralLink;
            displayReferralList(data.referralList);
            directRefsElement.textContent = data.stats.directReferrals;
            totalRefsElement.textContent = data.stats.totalReferrals;
            earningsElement.textContent = data.stats.totalCoinEarned.toLocaleString();
            levelElementRef.textContent = data.stats.referralLevel;

        } catch (error) {
            console.error('Error fetching referral data:', error);
            referralList.innerHTML = '<p>Failed to load referral data. Please log in or try again later.</p>';
            generationReport.innerHTML = '<p>Failed to load generation data.</p>';
            directRefsElement.textContent = 'N/A';
            totalRefsElement.textContent = 'N/A';
            earningsElement.textContent = 'N/A';
            levelElementRef.textContent = 'N/A';
        }
    }

    function displayReferralList(referrals) {
        referralList.innerHTML = `
            <div class="referral-header-row">
                <div class="header-name">Name</div>
                <div class="header-generation">Generation</div>
                <div class="header-earnings">Earnings</div>
            </div>
        `;

        if (referrals.length === 0) {
            referralList.innerHTML += '<p>No referrals yet. Share your link to invite friends!</p>';
            return;
        }

        referrals.forEach(referral => {
            const item = document.createElement('div');
            item.className = 'referral-item';

            const referralDate = new Date(referral.referredAt).toLocaleDateString();
            item.innerHTML = `
                <div class="referral-name-container">
                    <div>${referral.name}</div>
                    <div class="referral-date">${referralDate}</div>
                </div>
                <div class="referral-generation">${referral.generation} Gen</div>
                <div class="referral-earnings">${referral.earnings.toLocaleString()}</div>
            `;
            referralList.appendChild(item);
        });
    }

    function copyReferralLink() {
        const link = referralLinkText.textContent;
        navigator.clipboard.writeText(link).then(() => {
            copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            setTimeout(() => {
                copyBtn.innerHTML = '<i class="far fa-copy"></i> Copy';
            }, 2000);
        }).catch(err => {
            console.error('Could not copy text: ', err);
            copyBtn.innerHTML = '<i class="fas fa-times"></i> Error';
            setTimeout(() => {
                copyBtn.innerHTML = '<i class="far fa-copy"></i> Copy';
            }, 2000);
        });
    }

    function shareReferralLink() {
        const link = referralLinkText.textContent;
        const shareData = {
            title: 'Play Ball Mania Enhanced',
            text: 'Check out this awesome game! Use my referral link to get bonus points:',
            url: link
        };

        if (navigator.share) {
            navigator.share(shareData).catch(err => {
                console.log('Error sharing:', err);
                fallbackShare(link);
            });
        } else {
            fallbackShare(link);
        }
    }

    function fallbackShare(link) {
        alert('Share this link with your friends:\n' + link);
    }

    function toggleViews(showReferral) {
        if (showReferral) {
            referralList.style.display = 'block';
            generationReport.style.display = 'none';
            statsSection.style.display = 'block';
            referralBtn.classList.add('active-tab');
            generationBtn.classList.remove('active-tab');
        } else {
            referralList.style.display = 'none';
            generationReport.style.display = 'block';
            statsSection.style.display = 'none';
            referralBtn.classList.remove('active-tab');
            generationBtn.classList.add('active-tab');
        }
    }

    function initReferralPage() {
        fetchReferralData();
        generationReport.style.display = 'none';
        statsSection.style.display = 'block';
    }

    // ---- Event listeners ---- //
    copyBtn.addEventListener('click', copyReferralLink);
    referralBtn.addEventListener('click', () => toggleViews(true));
    generationBtn.addEventListener('click', () => toggleViews(false));

    //  Back button functionality
    backToMain.addEventListener('click', () => {
        window.location.href = '/Clint/dashboard.html';  
    });

    // ---- Initialize the page ---- //
    initReferralPage();
});
