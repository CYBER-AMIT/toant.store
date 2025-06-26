// client/assets/js/Leaderboards.js
 document.addEventListener('DOMContentLoaded', () => {
    const leaderboardContainer = document.getElementById('topPlayers');
    const currentPlayerInfoContainer = document.getElementById('currentPlayerInfo');
    const totalUsersSpan = document.getElementById('totalUsers');

    const firstPlaceAvatar = document.getElementById('firstPlaceAvatar');
    const firstPlaceName = document.getElementById('firstPlaceName');
    const firstPlaceCoins = document.getElementById('firstPlaceCoins');

    const secondPlaceAvatar = document.getElementById('secondPlaceAvatar');
    const secondPlaceName = document.getElementById('secondPlaceName');
    const secondPlaceCoins = document.getElementById('secondPlaceCoins');

    const thirdPlaceAvatar = document.getElementById('thirdPlaceAvatar');
    const thirdPlaceName = document.getElementById('thirdPlaceName');
    const thirdPlaceCoins = document.getElementById('thirdPlaceCoins');

    const salaryButton = document.getElementById('salaryButton');
    const salaryModal = document.getElementById('salaryModal');
    const backToMainButton = document.getElementById('backToMain');
    const salaryTabs = document.querySelectorAll('.salary-tab');
    const weeklyAchievementsDiv = document.getElementById('weekly-achievements');
    const sixteenDaysAchievementsDiv = document.getElementById('sixteen-days-achievements');
    const monthlyAchievementsDiv = document.getElementById('monthly-achievements');

    const BACKEND_BASE_URL = 'http://toant.store/api';
    const WEBSOCKET_URL = 'ws://toant.store';

    async function fetchData(url) {
        try {
            const token = localStorage.getItem('token');
            const headers = {
                'Content-Type': 'application/json',
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            const response = await fetch(url, {
                method: 'GET',
                headers: headers,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
                throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorData.message || response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching data:', error);
            return null;
        }
    }

    function getMedalIcon(rank) {
        if (rank === 1) return '<i class="fas fa-crown medal-icon gold-icon"></i>';
        if (rank === 2) return '<i class="fas fa-medal medal-icon silver-icon"></i>';
        if (rank === 3) return '<i class="fas fa-medal medal-icon bronze-icon"></i>';
        return '';
    }

    function updateTopThree(first, second, third) {
        if (first) {
            firstPlaceAvatar.innerHTML = `${first.name.charAt(0).toUpperCase()}<div class="medal-badge gold-badge"><i class="fas fa-crown"></i></div>`;
            firstPlaceName.textContent = first.name;
            firstPlaceCoins.textContent = first.coins.toLocaleString();
        } else {
            firstPlaceAvatar.textContent = 'N/A';
            firstPlaceName.textContent = 'No Player';
            firstPlaceCoins.textContent = '0';
        }

        if (second) {
            secondPlaceAvatar.innerHTML = `${second.name.charAt(0).toUpperCase()}<div class="medal-badge silver-badge"><i class="fas fa-medal"></i></div>`;
            secondPlaceName.textContent = second.name;
            secondPlaceCoins.textContent = second.coins.toLocaleString();
        } else {
            secondPlaceAvatar.textContent = 'N/A';
            secondPlaceName.textContent = 'No Player';
            secondPlaceCoins.textContent = '0';
        }

        if (third) {
            thirdPlaceAvatar.innerHTML = `${third.name.charAt(0).toUpperCase()}<div class="medal-badge bronze-badge"><i class="fas fa-medal"></i></div>`;
            thirdPlaceName.textContent = third.name;
            thirdPlaceCoins.textContent = third.coins.toLocaleString();
        } else {
            thirdPlaceAvatar.textContent = 'N/A';
            thirdPlaceName.textContent = 'No Player';
            thirdPlaceCoins.textContent = '0';
        }
    }

    function updateLeaderboardList(topPlayers) {
        leaderboardContainer.innerHTML = '';
        if (topPlayers.length === 0) {
            leaderboardContainer.innerHTML = '<p style="text-align: center; padding: 20px; color: #888;">No players on the leaderboard yet.</p>';
            return;
        }
        topPlayers.forEach(player => {
            const medalIcon = getMedalIcon(player.rank);
            leaderboardContainer.innerHTML += `
                <div class="player-card">
                    <div class="player-rank">${player.rank}</div>
                    <div class="player-name">${player.name}${medalIcon}</div>
                    <div class="player-coins">${player.coins.toLocaleString()}</div>
                    <div class="player-rank-value">#${player.rank}</div>
                </div>
            `;
        });
    }

    function updateCurrentPlayer(currentPlayer, top100thPlayer) {
        if (currentPlayer) {
            const gap = top100thPlayer ? top100thPlayer.coins - currentPlayer.coins : null;
            currentPlayerInfoContainer.innerHTML = `
                <div class="player-card">
                    <div class="player-rank">${currentPlayer.rank}</div>
                    <div class="player-name">${currentPlayer.name}</div>
                    <div class="player-coins">${currentPlayer.coins.toLocaleString()}</div>
                    <div class="player-rank-value">#${currentPlayer.rank}</div>
                </div>
                <p style="margin-top: 8px; font-size: 0.7rem; opacity: 0.8;">
                    ${currentPlayer.rank <= 100 ? 'You are in the top 100 players!' : (gap ? `You need ${gap} more coins to reach top 100!` : 'Keep playing to reach top 100!')}
                </p>
            `;
        } else {
            currentPlayerInfoContainer.innerHTML = `
                <p style="text-align: center; font-size: 0.8rem; opacity: 0.7;">
                    Please log in to see your rank.
                </p>
            `;
        }
    }

    async function fetchAndDisplayLeaderboard() {
        const data = await fetchData(`${BACKEND_BASE_URL}/leaderboard`);
        if (data && data.success) {
            totalUsersSpan.textContent = data.total_users.toLocaleString();
            updateTopThree(data.first_place, data.second_place, data.third_place);
            updateLeaderboardList(data.top_players);
            updateCurrentPlayer(data.current_player, data.top_players[99]);
        } else {
            console.error('Failed to fetch leaderboard data:', data);
        }
    }

    function setupWebSocket() {
        const ws = new WebSocket(WEBSOCKET_URL);
        ws.onopen = () => console.log('Connected to WebSocket server');
        ws.onmessage = event => {
            const message = JSON.parse(event.data);
            if (message.type === 'leaderboard_update') {
                totalUsersSpan.textContent = message.total_users.toLocaleString();
                updateTopThree(message.first_place, message.second_place, message.third_place);
                updateLeaderboardList(message.top_players);
                if (message.current_player_updated) {
                    updateCurrentPlayer(message.current_player_updated, message.top_players[99]);
                } else {
                    fetchAndDisplayLeaderboard();
                }
            }
        };
        ws.onclose = () => {
            console.warn('WebSocket disconnected. Reconnecting in 5 seconds...');
            setTimeout(setupWebSocket, 5000);
        };
        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            ws.close();
        };
    }

    function renderSalaryAchievements(container, achievements) {
        container.innerHTML = '';
        if (achievements.length === 0) {
            container.innerHTML = '<p style="text-align: center; padding: 15px; opacity: 0.7;">No achievements available for this period.</p>';
            return;
        }

        achievements.forEach(item => {
            let rankClass = 'rank-other';
            if (item.rank === 1) rankClass = 'rank-1';
            else if (item.rank === 2) rankClass = 'rank-2';
            else if (item.rank === 3) rankClass = 'rank-3';

            container.innerHTML += `
                <div class="salary-item" data-id="${item._id}">
                    <div class="salary-name">${item.name}</div>
                    <div class="salary-amount">${item.amount}</div>
                    <div class="salary-rank">
                        <span class="rank-badge ${rankClass}">#${item.rank}</span>
                    </div>
                </div>
            `;
        });
    }

    async function fetchAndDisplaySalaryAchievements(period) {
        const data = await fetchData(`${BACKEND_BASE_URL}/salary-achievements?period=${period}`);
        if (data && data.success) {
            const container = {
                'weekly': weeklyAchievementsDiv,
                'sixteen-days': sixteenDaysAchievementsDiv,
                'monthly': monthlyAchievementsDiv
            }[period];
            renderSalaryAchievements(container, data.achievements);
        } else {
            console.error(`Failed to fetch ${period} salary achievements`, data);
        }
    }

    async function initializePage() {
        await fetchAndDisplayLeaderboard();
        setupWebSocket();
        await fetchAndDisplaySalaryAchievements('weekly');
        await fetchAndDisplaySalaryAchievements('sixteen-days');
        await fetchAndDisplaySalaryAchievements('monthly');
        document.querySelectorAll('.current-player, .salary-achievements, .salary-tabs, .salary-title-box').forEach(el => {
            el.classList.add('visible-to-all', 'no-restriction');
        });
    }

    initializePage();

    salaryButton.addEventListener('click', () => {
        salaryModal.classList.add('active');
    });

    backToMainButton.addEventListener('click', () => {
        salaryModal.classList.remove('active');
    });

const backToMain2 = document.getElementById('backToMain2');

if (backToMain2) {
    backToMain2.addEventListener('click', () => {
        window.location.href = '/Clint/dashboard.html';
    });
}

    
    salaryTabs.forEach(tab => {
        tab.addEventListener('click', function () {
            document.querySelectorAll('.salary-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            weeklyAchievementsDiv.style.display = 'none';
            sixteenDaysAchievementsDiv.style.display = 'none';
            monthlyAchievementsDiv.style.display = 'none';
            const tabId = this.getAttribute('data-tab');
            document.getElementById(`${tabId}-achievements`).style.display = 'block';
        });
    });
});
