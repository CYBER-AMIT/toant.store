// Clint/assest/js/Tasks.js 
const API_BASE_URL = 'http://toant.store/api'; // Adjust if your backend is on a different URL/port

// Utility function to get JWT token from localStorage
function getAuthToken() {
    return localStorage.getItem('token');
}

// Function to handle API requests
async function fetchData(url, method = 'GET', body = null) {
    const token = getAuthToken();
    const headers = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
        method,
        headers,
    };
    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(url, options);
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || `API Error: ${response.statusText}`);
        }
        return data;
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
}

// --- HTML Elements ---
const dailyTaskBoxes = document.querySelectorAll('#dailyTasks .daily-task-box');
const dailyTaskCooldownMessageElement = document.getElementById('dailyTaskCooldownMessage');
const quizImage = document.getElementById('quizImage');
const answerBoxes = document.querySelectorAll('.answer-box');
const submitAnswerBtn = document.getElementById('submitAnswerBtn');
const quizCooldownMessageElement = document.getElementById('cooldownMessage');
const submissionMessage = document.getElementById('submissionMessage');
const toantTasksContainer = document.getElementById('toantTasks');
const partnerTasksContainer = document.getElementById('partnerTasks');

// Global variables to store current user state and tasks
let currentUserState = null;
let currentQuiz = null;
let toantTasks = [];
let partnerTasks = [];

// --- Daily Task Claim Logic ---
const DAILY_CLAIM_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

async function loadUserTasksState() {
    try {
        const data = await fetchData(`${API_BASE_URL}/tasks/state`);
        currentUserState = data;
        console.log('User Task State:', currentUserState);
        updateDailyTaskBoxesUI();
        updateQuizUI();
        updateSocialTasksUI();
    } catch (error) {
        console.error('Failed to load user task state:', error);
        alert('Failed to load tasks. Please try again later.');
        // Redirect to login or show error prominently
    }
}

function updateDailyTaskBoxesUI() {
    if (!currentUserState || !currentUserState.dailyClaimInfo) return;

    const { currentDay, lastClaimTime, cooldownRemaining, canClaim } = currentUserState.dailyClaimInfo;
    const now = Date.now();

    dailyTaskBoxes.forEach(box => {
        const day = parseInt(box.dataset.day, 10);
        box.classList.remove('claimed', 'locked', 'available');
        box.style.pointerEvents = 'none';
        box.style.cursor = 'default';

        if (day < currentDay || (day === 7 && currentDay === 1 && lastClaimTime > 0 && !cooldownRemaining)) {
            // If day is past currentDay OR if day 7 was claimed and it's reset to Day 1
            box.classList.add('claimed');
        } else if (day === currentDay) {
            if (canClaim) {
                box.classList.add('available');
                box.style.pointerEvents = 'auto';
                box.style.cursor = 'pointer';
            } else {
                box.classList.add('locked');
            }
        } else {
            box.classList.add('locked');
        }
    });

    if (!canClaim && cooldownRemaining > 0) {
        updateDailyTaskCooldownTimer(cooldownRemaining);
    } else {
        dailyTaskCooldownMessageElement.textContent = '';
    }
}

function updateDailyTaskCooldownTimer(remainingTime) {
    if (remainingTime <= 0) {
        dailyTaskCooldownMessageElement.textContent = '';
        loadUserTasksState(); // Reload state to update UI
        return;
    }

    const hours = Math.floor(remainingTime / (1000 * 60 * 60));
    const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);

    dailyTaskCooldownMessageElement.textContent = `Next daily claim in: ${hours}h ${minutes}m ${seconds}s`;
    
    // Decrement remaining time and update
    setTimeout(() => updateDailyTaskCooldownTimer(remainingTime - 1000), 1000);
}

async function claimDailyReward(dayToClaim, boxElement) {
    try {
        const data = await fetchData(`${API_BASE_URL}/tasks/claim-daily-reward`, 'POST', { dayToClaim });
        
        console.log(data.message);
        alert(`${data.message} You earned ${data.rewardCoins} coins! New total: ${data.newTotalCoins}`);
        createParticles(boxElement); // Show particle animation
        
        // Update local state with new data from backend
        currentUserState.userTotalCoins = data.newTotalCoins;
        currentUserState.dailyClaimInfo.lastClaimedDay = data.dailyClaimState.lastClaimedDay;
        currentUserState.dailyClaimInfo.lastClaimTime = data.dailyClaimState.lastClaimTime;
        currentUserState.dailyClaimInfo.canClaim = false; // Set to false immediately after claiming
        currentUserState.dailyClaimInfo.cooldownRemaining = DAILY_CLAIM_COOLDOWN_MS; // Start cooldown

        updateDailyTaskBoxesUI(); // Refresh UI

    } catch (error) {
        console.error('Daily reward claim failed:', error);
        alert(error.message || 'Failed to claim daily reward.');
    }
}

// --- Quiz Logic ---
async function updateQuizUI() {
    if (!currentUserState || !currentUserState.quizInfo) return;

    const { canSubmit, cooldownRemaining, currentQuiz } = currentUserState.quizInfo;

    if (canSubmit && currentQuiz) {
        quizImage.src = currentQuiz.questionImageUrl;
        quizImage.alt = `Quiz Image ID: ${currentQuiz.id}`;
        currentQuiz = currentQuiz; // Store the current quiz info
        submitAnswerBtn.disabled = false;
        quizCooldownMessageElement.textContent = '';
        answerBoxes.forEach(box => box.value = ''); // Clear previous answers
        if (answerBoxes.length > 0) answerBoxes[0].focus();
    } else {
        quizImage.src = '/Clint/assest/images/Coin logo.jpg'; // Placeholder or empty
        quizImage.alt = 'Quiz currently unavailable';
        submitAnswerBtn.disabled = true;
        answerBoxes.forEach(box => box.value = '');
        if (cooldownRemaining > 0) {
            updateQuizCooldownTimer(cooldownRemaining);
        } else {
            quizCooldownMessageElement.textContent = 'No quiz available at the moment. Check back later.'; // Or if no active quiz
        }
    }
}

function updateQuizCooldownTimer(remainingTime) {
    if (remainingTime <= 0) {
        quizCooldownMessageElement.textContent = '';
        loadUserTasksState(); // Reload state to get new quiz
        return;
    }

    const hours = Math.floor(remainingTime / (1000 * 60 * 60));
    const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);

    quizCooldownMessageElement.textContent = `Next quiz submission in: ${hours}h ${minutes}m ${seconds}s`;
    
    // Decrement remaining time and update
    setTimeout(() => updateQuizCooldownTimer(remainingTime - 1000), 1000);
}

async function submitQuiz() {
    if (submitAnswerBtn.disabled) return;

    let userAnswer = '';
    let filledCount = 0;
    answerBoxes.forEach(box => {
        if (box.value.trim() !== '') {
            filledCount++;
            userAnswer += box.value.trim();
        } else {
            userAnswer += ' '; // Maintain length if not all boxes are filled but submitted
        }
    });

    if (filledCount < 2) { // Example validation, adjust as needed
        alert('Please fill in at least 2 boxes.');
        return;
    }

    if (!currentQuiz || !currentQuiz.id) {
        alert('No active quiz to submit. Please refresh the page.');
        return;
    }

    try {
        const data = await fetchData(`${API_BASE_URL}/tasks/submit-quiz`, 'POST', {
            quizId: currentQuiz.id,
            userAnswer: userAnswer.trim()
        });

        submissionMessage.textContent = data.message;
        submissionMessage.classList.add('show');
        
        // Update local state with new data from backend
        currentUserState.userTotalCoins = data.newTotalCoins;
        currentUserState.quizInfo.lastSubmissionTime = Date.now(); // Set to current time for cooldown
        currentUserState.quizInfo.canSubmit = false;
        currentUserState.quizInfo.cooldownRemaining = QUIZ_COOLDOWN_MS;
        currentUserState.quizInfo.currentQuiz = null; // Clear current quiz

        updateQuizUI(); // Refresh UI to show cooldown or next quiz

        setTimeout(() => {
            submissionMessage.classList.remove('show');
            answerBoxes.forEach(box => box.value = '');
        }, 3000);

    } catch (error) {
        console.error('Quiz submission failed:', error);
        alert(error.message || 'Failed to submit quiz.');
        submissionMessage.textContent = error.message || 'Submission failed!';
        submissionMessage.classList.add('show');
        setTimeout(() => submissionMessage.classList.remove('show'), 3000);
    }
}

// --- Social Tasks (Toant & Partner) Logic ---
async function loadSocialTasks(type) {
    try {
        const data = await fetchData(`${API_BASE_URL}/tasks/social-tasks?type=${type}`);
        if (type === 'Toant') {
            toantTasks = data.tasks;
        } else {
            partnerTasks = data.tasks;
        }
        updateSocialTasksUI();
    } catch (error) {
        console.error(`Failed to load ${type} social tasks:`, error);
        alert(`Failed to load ${type} tasks. Please try again later.`);
    }
}

function updateSocialTasksUI() {
    toantTasksContainer.innerHTML = ''; // Clear existing tasks
    partnerTasksContainer.innerHTML = ''; // Clear existing tasks

    const renderTasks = (tasks, container) => {
        if (!tasks || tasks.length === 0) {
            container.innerHTML = '<p class="no-tasks-message">No tasks available in this category.</p>';
            return;
        }
        tasks.forEach(task => {
            const taskItem = document.createElement('div');
            taskItem.classList.add('task-list-item');
            if (task.completed) {
                taskItem.classList.add('completed');
            }

            taskItem.innerHTML = `
                <div class="task-list-info">
                    <strong>${task.name}</strong>
                    <p>${task.description || ''}</p>
                    <span>Reward: ${task.rewardCoins} COINS</span>
                </div>
                <button class="start-button" data-task-id="${task._id}" data-task-link="${task.link}" ${task.completed ? 'disabled' : ''}>
                    ${task.completed ? 'Completed' : 'Start'}
                </button>
            `;
            container.appendChild(taskItem);
        });
    };

    renderTasks(toantTasks, toantTasksContainer);
    renderTasks(partnerTasks, partnerTasksContainer);
    attachSocialTaskListeners(); // Re-attach listeners after rendering
}

function attachSocialTaskListeners() {
    document.querySelectorAll('.task-list-item .start-button').forEach(button => {
        // Remove existing listeners to prevent duplicates
        button.removeEventListener('click', handleSocialTaskButtonClick);
        button.addEventListener('click', handleSocialTaskButtonClick);
    });
}

function handleSocialTaskButtonClick(event) {
    const button = event.target;
    const taskId = button.dataset.taskId;
    const taskLink = button.dataset.taskLink;

    if (button.textContent === 'Start') {
        window.open(taskLink, '_blank'); // Open link in new tab
        // Change button to "Claim" after opening link
        button.textContent = 'Claim';
        button.classList.add('claim-button');
        button.classList.remove('start-button');
        // Temporarily disable to prevent multiple claims before actual claim
        // This is a client-side guess, backend will confirm
        button.disabled = false; // Re-enable for claim
        button.setAttribute('data-action', 'claim');
    } else if (button.textContent === 'Claim' && button.dataset.action === 'claim') {
        completeSocialTask(taskId, button);
    }
}

async function completeSocialTask(taskId, buttonElement) {
    try {
        // Disable button immediately to prevent double click
        buttonElement.disabled = true; 
        buttonElement.textContent = 'Claiming...';

        const data = await fetchData(`${API_BASE_URL}/tasks/complete-social-task`, 'POST', { taskId });

        alert(data.message);
        // Update local state and UI
        currentUserState.userTotalCoins = data.newTotalCoins;
        // Mark task as completed in local array
        [toantTasks, partnerTasks].forEach(taskList => {
            const taskIndex = taskList.findIndex(task => task._id === taskId);
            if (taskIndex !== -1) {
                taskList[taskIndex].completed = true;
            }
        });
        
        buttonElement.textContent = 'Completed';
        buttonElement.classList.remove('claim-button');
        buttonElement.classList.add('completed'); // Add a class for styling
        buttonElement.disabled = true; // Permanently disable

        updateSocialTasksUI(); // Re-render to ensure completed state is reflected

    } catch (error) {
        console.error('Social task completion failed:', error);
        alert(error.message || 'Failed to complete task.');
        // Re-enable button if claim failed, and revert text
        buttonElement.disabled = false;
        buttonElement.textContent = 'Claim'; // Revert to claim
        buttonElement.setAttribute('data-action', 'claim');
    }
}


// Function to create and animate particles (for Daily tasks)
function createParticles(element) {
    const particleCount = 30;
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const container = document.createElement('div');
    container.classList.add('particle-container');
    document.body.appendChild(container);

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');

        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 50 + 30;
        const dx = Math.cos(angle) * distance;
        const dy = Math.sin(angle) * distance;

        particle.style.left = `${centerX}px`;
        particle.style.top = `${centerY}px`;

        particle.style.setProperty('--dx', `${dx}px`);
        particle.style.setProperty('--dy', `${dy}px`);

        container.appendChild(particle);

        particle.addEventListener('animationend', () => {
            particle.remove();
            if (container.children.length === 0 && container.parentElement) {
                container.parentElement.removeChild(container);
            }
        });
    }
}

// Function to handle button selection and display tasks
function selectButton(buttonType) {
    const buttons = document.querySelectorAll('.btn');
    const taskContainers = document.querySelectorAll('.task-content-section');

    buttons.forEach(button => {
        button.classList.remove('selected');
    });

    taskContainers.forEach(container => {
        container.style.display = 'none';
    });

    let selectedContainer = null;
    if (buttonType === 'daily') {
        document.getElementById('dailyBtn').classList.add('selected');
        selectedContainer = document.getElementById('dailyTasks');
        selectedContainer.style.display = 'flex';
        dailyTaskCooldownMessageElement.style.display = 'block'; // Show daily cooldown
        updateDailyTaskBoxesUI(); // Update UI when Daily section is shown
        updateQuizUI(); // Update quiz UI as well since it's in the daily section
    } else if (buttonType === 'toant') {
        document.getElementById('toantBtn').classList.add('selected');
        selectedContainer = document.getElementById('toantTasks');
        selectedContainer.style.display = 'flex';
        dailyTaskCooldownMessageElement.style.display = 'none'; // Hide daily cooldown
        quizCooldownMessageElement.textContent = ''; // Hide quiz cooldown
        loadSocialTasks('Toant');
    } else if (buttonType === 'partner') {
        document.getElementById('partnerBtn').classList.add('selected');
        selectedContainer = document.getElementById('partnerTasks');
        selectedContainer.style.display = 'flex';
        dailyTaskCooldownMessageElement.style.display = 'none'; // Hide daily cooldown
        quizCooldownMessageElement.textContent = ''; // Hide quiz cooldown
        loadSocialTasks('Partner');
    }
}


// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is authenticated (token exists)
    if (!getAuthToken()) {
        alert('You are not logged in. Redirecting to login page.');
        window.location.assign('login.html'); // Assuming login.html is your login page
        return;
    }

    // Load initial user state for tasks
    loadUserTasksState();

    // Add click listeners to daily task boxes for claiming and particles
    dailyTaskBoxes.forEach(box => {
        box.addEventListener('click', function() {
            const dayToClaim = parseInt(this.dataset.day, 10);
            const { dailyClaimInfo } = currentUserState;
            const expectedNextDay = dailyClaimInfo.lastClaimedDay ? (dailyClaimInfo.lastClaimedDay % 7) + 1 : 1;

            if (dayToClaim === expectedNextDay && dailyClaimInfo.canClaim) {
                claimDailyReward(dayToClaim, this);
            } else if (dayToClaim < expectedNextDay) {
                alert(`Day ${dayToClaim} has already been claimed.`);
            } else if (dayToClaim > expectedNextDay) {
                alert(`Please claim Day ${expectedNextDay} first.`);
            } else if (!dailyClaimInfo.canClaim) {
                alert(`Cooldown active. Please wait for the next daily claim.`);
            }
        });
    });

    // Quiz Section Input/Submit Logic
    answerBoxes.forEach((box, index) => {
        box.addEventListener('input', function(event) {
            let value = this.value;
            value = value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 1);
            this.value = value.toUpperCase();

            if (value && index < answerBoxes.length - 1) {
                answerBoxes[index + 1].focus();
            }
        });

        box.addEventListener('keydown', function(event) {
            if (event.key === 'Backspace' && this.value === '' && index > 0) {
                answerBoxes[index - 1].focus();
            }
        });
    });

    submitAnswerBtn.addEventListener('click', submitQuiz);

    // Initial button selection and display
    selectButton('daily');
});

// ---- back button to Dashboard ---- // 
function backBtn(event) {
    window.location.assign('dashboard.html'); // Ensure dashboard.html is the correct path
}