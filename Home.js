 // ---- Home Js code ---- //
// ---- Game variables ---- //

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const ballScoreElement = document.getElementById('ballScore');
const starScoreElement = document.getElementById('starScore');
const levelElement = document.getElementById('level');
const livesElement = document.getElementById('lives');
const finalBallScoreElement = document.getElementById('finalBallScore');
const finalStarScoreElement = document.getElementById('finalStarScore');
const levelBallScoreElement = document.getElementById('levelBallScore');
const levelStarScoreElement = document.getElementById('levelStarScore');
const livesLeftElement = document.getElementById('livesLeft');
const gameStartScreen = document.getElementById('gameStart');
const gameOverScreen = document.getElementById('gameOver');
const levelCompleteScreen = document.getElementById('levelComplete');
const pausedScreen = document.getElementById('pausedScreen');
const retryScreen = document.getElementById('retryScreen');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const nextLevelBtn = document.getElementById('nextLevelBtn');
const resumeBtn = document.getElementById('resumeBtn');
const retryBtn = document.getElementById('retryBtn');
const pauseBtn = document.getElementById('pauseBtn');
const soundBtn = document.getElementById('soundBtn');

// ---- Set canvas size ---- //
function resizeCanvas() {
    const containerWidth = document.querySelector('.game-container').clientWidth;
    canvas.width = containerWidth;
    canvas.height = 500;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// ---- Game state ---- //
let ballScore = 0;
let starScore = 0;
let level = 1;
let lives = 3;
let gameRunning = false;
let gamePaused = false;
let soundOn = true;
let leftPressed = false;
let rightPressed = false;
let animationId;
const baseBallSpeed = 4;
let currentSpeedMultiplier = 1.0;
let brokenBallsHistory = [];
let currentLevelOnGameOver = 1;
let lastStarScore = 0;
let speedIncreased = false;
let remainingBallsForNextChance = [];

// ---- Paddle properties ---- //
const paddleHeight = 10;
let paddleWidth = 120;
let paddleX = (canvas.width - paddleWidth) / 2;
const paddleOffsetFromBottom = 25;

// ---- Ball properties ---- //
const ballRadius = 6;
let balls = [{
    x: canvas.width / 2,
    y: canvas.height - 50,
    radius: ballRadius,
    dx: baseBallSpeed * currentSpeedMultiplier,
    dy: -baseBallSpeed * currentSpeedMultiplier,
    color: 'white',
    isMainBall: true
}];

// ---- Target balls ---- //
let targetBalls = [];
const targetBallRadius = 6;
let targetBallsCount = 0;
let targetBallsToHit = 0;
let initialTargetBallsCount = 0;

// ---- Unbreakable stones ---- //
let stones = [];
const stoneRadius = 6;
const stoneColors = [
    ['#8e44ad', '#9b59b6'],
    ['#3498db', '#2980b9'],
    ['#e74c3c', '#c0392b'],
    ['#2ecc71', '#27ae60'],
    ['#f39c12', '#d35400']
];

// ---- Star properties ---- //
let stars = [];
const starSize = 20;
const starSpeed = 2;
const starsPerLevel = 5;
let starsSpawnedThisLevel = 0;
const starSpawnInterval = 200;

// ---- 3x Ball Power-Up properties ---- //
let tripleBalls = [];
const tripleBallSize = 20;
const tripleBallSpeed = 2;
let tripleBallSpawnCount = 0;
const ballsToSpawnTriple = 5;
let ballsBrokenSinceLastPowerUp = 0;

// ---- Sound effects (Howler.js library required for these) ---- // 
// Make sure you have Howler.js loaded in your HTML, e.g.:
// <script src="https://cdnjs.cloudflare.com/ajax/libs/howler/2.2.3/howler.min.js"></script>

const sounds = {
    bounce: new Howl( { src: ['https://assets.codepen.io/21542/howler-paddle-hit.mp3'] }),
    hit: new Howl({ src: ['https://assets.codepen.io/21542/howler-brick-hit.mp3'] }),

wallHit: new Howl({ src: ['https://assets.codepen.io/21542/howler-wall-hit.mp3'] }),
    gameOver: new Howl({ src: ['https://assets.codepen.io/21542/howler-game-over.mp3'] }),
    levelComplete: new Howl({ src: ['https://assets.codepen.io/21542/howler-win.mp3'] }),
    lifeLost: new Howl({ src: ['https://assets.codepen.io/21542/howler-life-lost.mp3'] }),
    levelStart: new Howl({ src: ['https://assets.codepen.io/21542/howler-level-start.mp3'] }),
    starCollect: new Howl({ src: ['https://assets.codepen.io/21542/howler-extra-life.mp3'] }),
    powerUp: new Howl({ src: ['https://assets.codepen.io/21542/howler-power-up.mp3'] }),
    stoneHit: new Howl({ src: ['https://assets.codepen.io/21542/howler-stone-hit.mp3'] }),
    speedBoost: new Howl({ src: ['https://assets.codepen.io/21542/howler-speed-boost.mp3'] })
};

// ---- Play sound if enabled ---- // 
function playSound(sound) {
    if (soundOn && sound) {
        sound.play();
    }
}

// ---- Generate unique seed for each level ---- //
function generateLevelSeed(level) {
    return level * 12345 + 67890;
}

// ---- Simple pseudo-random number generator with seed ---- //
function seededRandom(seed) {
    let x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}

// ---- Get level design with robot patterns for high levels ---- // 
function getLevelDesign(level) {
    // ---- Cap level for difficulty calculations at 30 ---- //
    const adjustedLevel = Math.min(level, 30); // Corrected typo here
    
    // ---- Stone percentage based on level (15-25% up to level 30, then 20-30%) ---- //
    const stonePercentage = level <= 30 ? 
        0.15 + (adjustedLevel * 0.0033) : // 15-25% for levels 1-30
        0.20 + ((level - 30) * 0.0033);  // 20-30% for levels 31+
    
    // ---- Define base parameters ---- //
    const baseRows = 4 + Math.floor(adjustedLevel / 3);
    const baseCols = 8 + Math.floor(adjustedLevel / 2);
    
    // ---- Pattern selection - special robot patterns for levels 15-20+ ---- //
    let pattern;
    if (level >= 15 && level <= 20) {
        const robotPatterns = ["robot1", "robot2", "robot3", "robot4", "robot5", "robot6"];
        pattern = robotPatterns[(level - 15) % robotPatterns.length];
    } else if (level > 20) {
        const advancedPatterns = ["numbers", "letters", "symbols"];
        pattern = advancedPatterns[(level - 21) % advancedPatterns.length];
    } else {
        const basicPatterns = ["grid", "diamond", "circular", "checkerboard", "cross", "spiral"];
        pattern = basicPatterns[(level - 1) % basicPatterns.length];
    }
    
    return {
        rows: Math.min(baseRows, 12),
        cols: Math.min(baseCols, 20),
        stonePattern: [],
        minBalls: 10 + adjustedLevel * 2,
        pattern: pattern,
        paddleWidth: Math.max(60, 120 - adjustedLevel * 3),
        stonePercentage: Math.min(0.35, stonePercentage),
        ballColors: ['#FF5252', '#FF9800', '#FFEB3B', '#4CAF50', '#2196F3', '#9C27B0']
    };
}

// ---- Generate level pattern with robot shapes for high levels ---- //
function generateLevelPattern(level) {
    const design = getLevelDesign(level);
    const seed = generateLevelSeed(level);
    let ballPositions = [];
    
    const horizontalSpacing = (canvas.width - 40) / design.cols;
    const verticalSpacing = (canvas.height * 0.4) / design.rows;
    
    // ---- Generate positions based on pattern ---- //
    for (let row = 0; row < design.rows; row++) {
        for (let col = 0; col < design.cols; col++) {
            let x = 20 + col * horizontalSpacing + horizontalSpacing/2;
            let y = 50 + row * verticalSpacing;
            
            let includeBall = false;
            
            // ---- Handle different pattern types ---- //
            if (design.pattern.startsWith("robot")) {

// ---- Robot patterns for levels 15-20 ---- //
                includeBall = shouldIncludeInRobotPattern(design.pattern, row, col, design.rows, design.cols);
            } else if (design.pattern === "numbers" ||  design.pattern === "letters" || design.pattern === "symbols") {
                // ---- Number/letter patterns for levels 21+ ---- //
                includeBall = shouldIncludeInAdvancedPattern(design.pattern, row, col, design.rows, design.cols, level);
            } else {
                // ---- Basic patterns for levels 1-14 ---- //
                switch (design.pattern) {
                    case "diamond":
                        const centerCol = design.cols / 2;
                        const centerRow = design.rows / 2;
                        const distFromCenter = Math.abs(col - centerCol) + Math.abs(row - centerRow);
                        includeBall = distFromCenter <= Math.min(design.rows, design.cols) / 2 + 1;
                        break;
                        
                    case "circular":
                        const centerX = design.cols / 2;
                        const centerY = design.rows / 2;
                        const dist = Math.sqrt(Math.pow(col - centerX, 2) + Math.pow(row - centerY, 2));
                        includeBall = dist <= Math.min(design.rows, design.cols) / 2;
                        break;
                        
                    case "checkerboard":
                        includeBall = (row + col) % 2 === (level % 2);
                        break;
                        
                    case "cross":
                        const rowCenter = Math.floor(design.rows / 2);
                        const colCenter = Math.floor(design.cols / 2);
                        includeBall = (row === rowCenter || col === colCenter)  ||
                                     (Math.abs(row - rowCenter) === Math.abs(col - colCenter));
                        break;
                        
                    case "spiral":
                        const spiralCenterX = design.cols / 2;
                        const spiralCenterY = design.rows / 2;
                        const spiralDist = Math.sqrt(Math.pow(col - spiralCenterX, 2) + Math.pow(row - spiralCenterY, 2));
                        const spiralAngle = Math.atan2(row - spiralCenterY, col - spiralCenterX);
                        includeBall = Math.abs(spiralDist * 0.5 - spiralAngle * 2) % 3 < 1.5;
                        break;
                        
                    default: // ---- "grid" and others ---- //
                        includeBall = true;
                }
            }
            
            if (includeBall) {
                ballPositions.push({x, y});
            }
        }
    }
    
    return ballPositions;
}

// ---- Check if position should be included in robot pattern ---- //
function shouldIncludeInRobotPattern(pattern, row, col, totalRows, totalCols) {
    const centerCol = Math.floor(totalCols / 2);
    const centerRow = Math.floor(totalRows / 2);
    
    // ---- Different robot parts based on pattern type ---- //
    switch (pattern) {
        case "robot1": // ---- Basic robot shape ---- //
            // ---- Head (top center) ---- //
            if (row <= 2 && col >= centerCol - 2 && col <= centerCol + 2) return true;
            // ---- Body (middle) ---- //
            if (row > 2 && row <= totalRows - 3 && col >= centerCol - 3 && col <= centerCol + 3) return true;
            // ---- Legs (bottom) ---- //
            if (row > totalRows - 3 && 
                ((col >= centerCol - 2 && col <= centerCol - 1) || 
                 (col >= centerCol + 1 && col <= centerCol + 2))) return true;
            // ---- Arms ---- //
            if (row >= centerRow - 1 && row <= centerRow + 1 &&
(col === centerCol - 4 || col === centerCol + 4)) return true;
            return false;
            
        case "robot2": // ---- Robot with antenna ---- //
            // ---- Antenna ---- //
            if (row === 0 && col === centerCol) return true;
            // ---- Head ---- //
            if (row === 1 && col >= centerCol - 1 && col <= centerCol + 1) return true;
            // ---- Body ---- //
            if (row > 1 && row <= totalRows - 3 && col >= centerCol - 2 && col <= centerCol + 2) return true;
            // ---- Legs ---- //
            if (row > totalRows - 3 && col >= centerCol - 1 && col <= centerCol + 1) return true;
            // ---- Arms ---- //
            if (row === centerRow && (col === centerCol - 3 || col === centerCol + 3)) return true;
            return false;
            
        case "robot3": // ---- Wide robot ---- //
            // ---- Head ---- //
            if (row <= 1 && col >= centerCol - 3 && col <= centerCol + 3) return true;
            // ---- Body ----//
            if (row > 1 && row <= totalRows - 3 && col >= centerCol - 4 && col <= centerCol + 4) return true;
            // ---- Legs ---- //
            if (row > totalRows - 3 && 
                ((col >= centerCol - 3 && col <= centerCol - 1) || 
                 (col >= centerCol + 1 && col <= centerCol + 3))) return true;
            return false;
            
        case "robot4": // ---- Tall robot ---- //
            // ---- Head ---- //
            if (row <= 3 && col >= centerCol - 1 && col <= centerCol + 1) return true;
            // ---- Body ---- //
            if (row > 3 && row <= totalRows - 4 && col >= centerCol - 2 && col <= centerCol + 2) return true;
            // ---- Legs ---- //
            if (row > totalRows - 4 && col >= centerCol - 1 && col <= centerCol + 1) return true;
            // ---- Arms ---- //
            if (row >= centerRow - 1 && row <= centerRow + 1 && 
                (col === centerCol - 3 || col === centerCol + 3)) return true;
            return false;
            
        case "robot5": // ---- Robot with display ---- //
            // ---- Head with display ---- //
            if (row <= 2) {
                if (col === centerCol) return true;
                if (row === 2 && col >= centerCol - 2 && col <= centerCol + 2) return true;
            }
            // ---- Body ---- //
            if (row > 2 && row <= totalRows - 3 && col >= centerCol - 3 && col <= centerCol + 3) return true;
            // ---- Legs ---- //
            if (row > totalRows - 3 && 
                ((col >= centerCol - 2 && col <= centerCol - 1) || 
                 (col >= centerCol + 1 && col <= centerCol + 2))) return true;
            return false;
            
        case "robot6": // ---- Minimalist robot ---- //
            // ---- Head ---- //
            if (row === 0 && col === centerCol) return true;
            // ---- Body ---- //
            if (row >= 1 && row <= totalRows - 2 && col === centerCol) return true;
            // ---- Legs ---- //
            if (row === totalRows - 1 && 
                (col === centerCol - 1 || col === centerCol + 1)) return true;
            // ---- Arms ---- //
            if (row === centerRow && 
                (col === centerCol - 2 || col === centerCol + 2)) return true;
            return false;
            
        default:
            return false;
    }
}

// ---- Check if position should be included in advanced pattern (numbers/letters) ---- //
function shouldIncludeInAdvancedPattern(pattern, row, col, totalRows, totalCols, level) {
    const centerCol = Math.floor(totalCols / 2);
    const centerRow = Math.floor(totalRows / 2);
    
    if (pattern === "numbers") {
        // ---- Display level number ---- //
        const number = level % 10; // ---- Single digit ---- //

return isPositionInNumber(number, row, col, totalRows, totalCols);
    } 
    else if (pattern === "letters") {
        // ---- Display letters (A-F) ---- //
        const letter = String.fromCharCode(65 + (level % 6)); // ---- A-F ---- //
        return isPositionInLetter(letter, row, col, totalRows, totalCols);
    }
    else if (pattern === "symbols") {
        // ---- Display symbols ---- //
        const symbolIndex = level % 5;
        return isPositionInSymbol(symbolIndex, row, col, totalRows, totalCols);
    }
    return false;
}

// ---- Check if position is part of a digit (0-9) ---- //
function isPositionInNumber(digit, row, col, totalRows, totalCols) {
    // ---- Each digit is represented as a 3x5 grid ---- //
    const digitPatterns = {
        0: [
            [1, 1, 1],
            [1, 0, 1],
            [1, 0, 1],
            [1, 0, 1],
            [1, 1, 1]
        ],
        1: [
            [0, 1, 0],
            [1, 1, 0],
            [0, 1, 0],
            [0, 1, 0],
            [1, 1, 1]
        ],
        2: [
            [1, 1, 1],
            [0, 0, 1],
            [1, 1, 1],
            [1, 0, 0],
            [1, 1, 1]
        ],
        3: [
            [1, 1, 1],
            [0, 0, 1],
            [1, 1, 1],
            [0, 0, 1],
            [1, 1, 1]
        ],
        4: [
            [1, 0, 1],
            [1, 0, 1],
            [1, 1, 1],
            [0, 0, 1],
            [0, 0, 1]
        ],
        5: [
            [1, 1, 1],
            [1, 0, 0],
            [1, 1, 1],
            [0, 0, 1],
            [1, 1, 1]
        ],
        6: [
            [1, 1, 1],
            [1, 0, 0],
            [1, 1, 1],
            [1, 0, 1],
            [1, 1, 1]
        ],
        7: [
            [1, 1, 1],
            [0, 0, 1],
            [0, 0, 1],
            [0, 0, 1],
            [0, 0, 1]
        ],
        8: [
            [1, 1, 1],
            [1, 0, 1],
            [1, 1, 1],
            [1, 0, 1],
            [1, 1, 1]
        ],
        9: [
            [1, 1, 1],
            [1, 0, 1],
            [1, 1, 1],
            [0, 0, 1],
            [1, 1, 1]
        ]
    };
    
    // ---- Scale the digit to fit the available rows/cols ---- //
    const pattern = digitPatterns[digit];
    if (!pattern) return false;
    
    const patternRows = pattern.length;
    const patternCols = pattern[0].length;
    
    // ---- Calculate scaled position ---- //
    const scaledRow = Math.floor(row * patternRows / totalRows);
    const scaledCol = Math.floor(col * patternCols / totalCols);
    
    // ---- Check if position should be included ---- //
    return pattern[scaledRow] && pattern[scaledRow][scaledCol] === 1;
}

// ---- Check if position is part of a letter (A-F) ---- //
function isPositionInLetter(letter, row, col, totalRows, totalCols) {
    // ---- Each letter is represented as a 5x5 grid ---- //
    const letterPatterns = {
        'A': [
            [0, 1, 1, 1, 0],
            [1, 0, 0, 0, 1],
            [1, 1, 1, 1, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1]
        ],
        'B': [
            [1, 1, 1, 1, 0],
            [1, 0, 0, 0, 1],
            [1, 1, 1, 1, 0],
            [1, 0, 0, 0, 1],
            [1, 1, 1, 1, 0]
        ],
        'C': [
            [0, 1, 1, 1, 0],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 0],
            [1, 0, 0, 0, 1],
            [0, 1, 1, 1, 0]
        ],
        'D': [
            [1, 1, 1, 1, 0],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 1, 1, 1, 0]
        ],
        'E': [
            [1, 1, 1, 1, 1],
            [1, 0, 0, 0, 0],
            [1, 1, 1, 0, 0],
            [1, 0, 0, 0, 0],
            [1, 1, 1, 1, 1]
        ],
        'F': [
            [1, 1, 1, 1, 1],
            [1, 0, 0, 0, 0],
            [1, 1, 1, 0, 0],
            [1, 0, 0, 0, 0],
            [1, 0, 0, 0, 0]
        ]
    };
    
    const pattern = letterPatterns[letter];
    if (!pattern) return false;
    
    const patternRows = pattern.length;
    const patternCols = pattern[0].length;
    
    // ---- Calculate scaled position ---- //
    const scaledRow = Math.floor(row * patternRows / totalRows);
    const scaledCol = Math.floor(col * patternCols / totalCols);
    
    return pattern[scaledRow] && pattern[scaledRow][scaledCol] === 1;
}

// ---- Check if position is part of a symbol ---- //
function isPositionInSymbol(symbolIndex, row, col, totalRows, totalCols) {
    // ---- Simple symbols ---- //
    const symbolPatterns = [
        // ---- Heart ---- //
        [
            [0, 1, 0, 1, 0],
            [1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1],
            [0, 1, 1, 1, 0],
            [0, 0, 1, 0, 0]
        ],
        // ---- Star ---- //
        [
            [0, 0, 1, 0, 0],
            [0, 1, 1, 1, 0],
            [1, 1, 1, 1, 1],
            [0, 1, 1, 1, 0],
            [0, 0, 1, 0, 0]
        ],
        // ---- Diamond ---- //
        [
            [0, 0, 1, 0, 0],
            [0, 1, 1, 1, 0],
            [1, 1, 1, 1, 1],
            [0, 1, 1, 1, 0],
            [0, 0, 1, 0, 0]
        ],
        // ---- Smiley ---- //
        [
            [0, 1, 0, 1, 0],
            [0, 0, 0, 0, 0],
            [1, 0, 0, 0, 1],
            [0, 1, 1, 1, 0],
            [0, 0, 0, 0, 0]
        ],
        // ---- Arrow ---- //
        [
            [0, 0, 1, 0, 0],
            [0, 1, 1, 1, 0],
            [1, 1, 1, 1, 1],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0]
        ]
    ];
    
    const pattern = symbolPatterns[symbolIndex];
    if (!pattern) return false;
    
    const patternRows = pattern.length;
    const patternCols = pattern[0].length;
    
    // ---- Calculate scaled position ---- //
    const scaledRow = Math.floor(row * patternRows / totalRows);
    const scaledCol = Math.floor(col * patternCols / totalCols);
    
    return pattern[scaledRow] && pattern[scaledRow][scaledCol] === 1;
}

// ---- Check if position is valid for stone (not too close to other stones) ---- //
function isValidStonePosition(x, y, stones) {
    const minDistance = stoneRadius * 4;
    
    for (const stone of stones) {
        const dx = x - stone.x;
        const dy = y - stone.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < minDistance) {
            return false;
        }
    }
    return true;
}

// ---- Generate stones with proper spacing ---- //
function generateStones(percentage, ballPositions, level) {
    const stones = [];
    const numStones = Math.floor(ballPositions.length * percentage);
    const seed = generateLevelSeed(level);
    
    // ---- Randomly select ball positions to replace with stones using seeded random ---- //
    const shuffledBalls = [...ballPositions].sort(() => 0.5 - seededRandom(seed));
    
    let stonesAdded = 0;
    let attempts = 0;
    const maxAttempts = ballPositions.length * 2;
    
    while (stonesAdded < numStones && attempts < maxAttempts) {
        attempts++;
        const ballPos = shuffledBalls[stonesAdded % shuffledBalls.length];
        
        if (isValidStonePosition(ballPos.x, ballPos.y, stones)) {
            const colorIndex = stonesAdded % stoneColors.length;
            stones.push({
                x: ballPos.x,
                y: ballPos.y,
                radius: stoneRadius,
                colorIndex: colorIndex,
                unbreakable: true
            });
            stonesAdded++;
        }
    }
    
    return stones;
}

// ---- Ensure minimum balls are present in level with proper spacing ---- //

function ensureMinimumBalls(level) {
    const activeBalls = targetBalls.filter(ball => ball.active).length;
    const levelDesign = getLevelDesign(level);
    
    if (activeBalls < levelDesign.minBalls) {
        const horizontalSpacing = (canvas.width - 40) / levelDesign.cols;
        const verticalSpacing = (canvas.height * 0.4) / levelDesign.rows;
        const seed = generateLevelSeed(level);
        
        let addedBalls = 0;
        let attempts = 0;
        const maxAttempts = levelDesign.rows * levelDesign.cols * 2;
        
        while (addedBalls < (levelDesign.minBalls - activeBalls) && attempts < maxAttempts) {
            attempts++;
            
            const row = Math.floor(seededRandom(seed + attempts) * levelDesign.rows);
            const col = Math.floor(seededRandom(seed + attempts + 100) * levelDesign.cols);
            
            let x = 20 + col * horizontalSpacing + horizontalSpacing/2;
            let y = 50 + row * verticalSpacing;
            
            // ---- Check if position is valid ---- //
            let isValidPosition = true;
            
            // ---- Check stones ---- //
            for (const stone of stones) {
                const dx = x - stone.x;
                const dy = y - stone.y;
                const distance = Math.sqrt(dx*dx + dy*dy);
                
                if (distance < (targetBallRadius + stone.radius + 10)) {
                    isValidPosition = false;
                    break;
                }
            }
            
            //---- Check existing balls ---- //
            if (isValidPosition) {
                for (const ball of targetBalls) {
                    const dx = x - ball.x;
                    const dy = y - ball.y;
                    const distance = Math.sqrt(dx*dx + dy*dy);
                    
                    if (distance < (targetBallRadius * 3)) {
                        isValidPosition = false;
                        break;
                    }
                }
            }
            
            if (isValidPosition) {
                const colorIndex = Math.floor(seededRandom(seed + row + col) * levelDesign.ballColors.length);

targetBalls.push({
                    x: x,
                    y: y,
                    radius: targetBallRadius,
                    color: levelDesign.ballColors[colorIndex],
                    active: true
                });
                addedBalls++;
                targetBallsCount++;
                targetBallsToHit++;
            }
        }
    }
}

// ---- Initialize target balls with patterns ----//
function initTargetBalls() {
    targetBalls = [];
    stones = [];
    speedIncreased = false;
    currentSpeedMultiplier = 1.0;
    
    const levelDesign = getLevelDesign(level);
    
    // ---- Set paddle width for this level ---- //
    paddleWidth = levelDesign.paddleWidth;
    
    lastStarScore = ballScore;
    starsSpawnedThisLevel = 0;
    
    // ---- Generate ball positions based on pattern ---- //
    const ballPositions = generateLevelPattern(level);
    
    // ---- Generate stones by replacing some ball positions ---- //
    stones = generateStones(levelDesign.stonePercentage, ballPositions, level);
    
    // ---- Create target balls at remaining positions ---- //
    ballPositions.forEach(pos => {
        const isStone = stones.some(stone => 
            Math.abs(stone.x - pos.x) < (stoneRadius + targetBallRadius + 5) && 
            Math.abs(stone.y - pos.y) < (stoneRadius + targetBallRadius + 5)
        );
        
        if (!isStone) {
            const wasBroken = brokenBallsHistory.some(b => 
                Math.abs(b.x - pos.x) < 5 && Math.abs(b.y - pos.y) < 5
            );
            
            if (!wasBroken) {
                const colorIndex = Math.floor(seededRandom(level + pos.x + pos.y) * levelDesign.ballColors.length);

targetBalls.push({
                    x: pos.x,
                    y: pos.y,
                    radius: targetBallRadius,
                    color: levelDesign.ballColors[colorIndex],
                    active: true
                });
            }
        }
    });
    
    targetBallsCount = targetBalls.filter(ball => ball.active).length;
    initialTargetBallsCount = targetBallsCount;
    targetBallsToHit = targetBallsCount;
    ballsBrokenSinceLastPowerUp = 0;
    
    ensureMinimumBalls(level);
    
    stars = [];
    tripleBalls = [];
    tripleBallSpawnCount = 0;
    
    // ---- Reset balls with base speed ---- //
    balls = [{
        x: canvas.width / 2,
        y: canvas.height - 50,
        radius: ballRadius,
        dx: baseBallSpeed * currentSpeedMultiplier,
        dy: -baseBallSpeed * currentSpeedMultiplier,
        color: 'white',
        isMainBall: true
    }];
}

// ---- Improved stone collision detection ---- //
function checkStoneCollisions(ball) {
    for (const stone of stones) {
        const dx = ball.x - stone.x;
        const dy = ball.y - stone.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < ball.radius + stone.radius) {
            // ---- Calculate collision normal ---- //
            const nx = dx / distance;
            const ny = dy / distance;
            
            // ---- Calculate relative velocity ---- //
            const vx = ball.dx;
            const vy = ball.dy;
            
            // ---- Calculate relative velocity in terms of the normal direction ---- //
            const velocityAlongNormal = vx * nx + vy * ny;
            
            // ---- Do not resolve if velocities are separating ---- //
            if (velocityAlongNormal > 0) return false;
            
            // ---- Calculate restitution (bounciness) ---- //
            const restitution = 1.0;
            
            // ---- Calculate impulse scalar ---- //
            const j = -(1 + restitution) * velocityAlongNormal;
            
            // ---- Apply impulse ---- //
            const impulseX = j * nx;
            const impulseY = j * ny;
            
            // ---- Update ball velocity ---- //
            ball.dx += impulseX;
            ball.dy += impulseY;
            
            // ---- Move ball out of collision ---- //
            const overlap = (ball.radius + stone.radius - distance) * 1.1;
            ball.x += overlap * nx;
            ball.y += overlap * ny;
            
            playSound(sounds.stoneHit);
            return true;
        }
    }
    return false;
}

// ---- Increase ball speed by 0.5x when 50% balls are broken (only for main balls) ---- //
function increaseBallSpeed() {
    if (speedIncreased) return;
    
    const speedMultiplier = 0.5;
    
    balls.forEach(ball => {
        if (ball.isMainBall) {
            ball.dx *= (1 + speedMultiplier);
            ball.dy *= (1 + speedMultiplier);
        }
    });
    
    currentSpeedMultiplier *= (1 + speedMultiplier);
    playSound(sounds.speedBoost);
    speedIncreased = true;
    
    // ---- Show speed boost effect ---- //
    ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setTimeout(() => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }, 200);
}

// ---- Draw stones ---- //
function drawStones() {
    for (const stone of stones) {
        ctx.save();
        
        const gradient = ctx.createRadialGradient(
            stone.x - stone.radius/3, stone.y - stone.radius/3, stone.radius/4,
            stone.x, stone.y, stone.radius
        );
        gradient.addColorStop(0, stoneColors[stone.colorIndex][0]);
        gradient.addColorStop(1, stoneColors[stone.colorIndex][1]);

ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 3;
        
        ctx.beginPath();
        ctx.arc(stone.x, stone.y, stone.radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(stone.x, stone.y, stone.radius * 0.7, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(
            stone.x - stone.radius/3, 
            stone.y - stone.radius/3, 
            stone.radius/4, 
            0, 
            Math.PI * 2
        );
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(stone.x - stone.radius/2, stone.y - stone.radius/4);
        ctx.lineTo(stone.x + stone.radius/3, stone.y + stone.radius/3);
        ctx.moveTo(stone.x + stone.radius/4, stone.y - stone.radius/3);
        ctx.lineTo(stone.x - stone.radius/5, stone.y + stone.radius/2);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.restore();
    }
}

// ---- Spawn a new star ---- //
function spawnStar() {
    if (starsSpawnedThisLevel >= starsPerLevel) return;
    
    const star = {
        x: Math.random() * (canvas.width - starSize),
        y: -starSize,
        width: starSize,
        height: starSize,
        active: true
    };
    stars.push(star);
    starsSpawnedThisLevel++;
}

// ---- Check if we should spawn a new star ---- //
function checkStarSpawn() {
    if (starsSpawnedThisLevel >= starsPerLevel) return;
    
    if (ballScore - lastStarScore >= starSpawnInterval) {
        spawnStar();
        lastStarScore = ballScore;
    }
}

// ---- Spawn a 3x ball power-up ---- //
function spawnTripleBall(x, y) {
    const tripleBall = {
        x: x,
        y: y,
        width: tripleBallSize,
        height: tripleBallSize,
        active: true,
        color: 'white'
    };
    tripleBalls.push(tripleBall);
}

// ---- Update stars ---- //
function updateStars() {
    checkStarSpawn();
    
    for (let i = stars.length - 1; i >= 0; i--) {
        stars[i].y += starSpeed * currentSpeedMultiplier;
        
        if (stars[i].y + starSize >= canvas.height - paddleOffsetFromBottom && 
            stars[i].y <= canvas.height - paddleOffsetFromBottom + paddleHeight &&
            stars[i].x + starSize >= paddleX && 
            stars[i].x <= paddleX + paddleWidth) {
            
            starScore += 10;
            starScoreElement.textContent = starScore;
            stars.splice(i, 1);
            playSound(sounds.starCollect);
            continue;
        }
        
        if (stars[i].y > canvas.height) {
            if (starScore > 0) {
                starScore = Math.max(0, starScore - 2);
                starScoreElement.textContent = starScore;
            }
            stars.splice(i, 1);
        }
    }
}

// ---- Update 3x balls ---- //
function updateTripleBalls() {
    for (let i = tripleBalls.length - 1; i >= 0; i--) {
        tripleBalls[i].y += tripleBallSpeed * currentSpeedMultiplier;
        
        if (tripleBalls[i].y + tripleBallSize >= canvas.height - paddleOffsetFromBottom && 
            tripleBalls[i].y <= canvas.height - paddleOffsetFromBottom + paddleHeight &&
            tripleBalls[i].x + tripleBallSize >= paddleX && 
            tripleBalls[i].x <= paddleX + paddleWidth) {
            
            splitBallIntoThree();
            tripleBalls.splice(i, 1);
            playSound(sounds.powerUp);
            continue;
        }
        
        if (tripleBalls[i].y > canvas.height) {
            tripleBalls.splice(i, 1);
        }
    }
}

// ---- Split into 3 additional balls ---- //

function splitBallIntoThree() {
    for (let i = 0; i < 3; i++) {
        const angle = (i * (Math.PI * 2 / 3)) + (Math.random() * 0.5 - 0.25);
        balls.push({
            x: paddleX + paddleWidth/2,
            y: canvas.height - paddleOffsetFromBottom - 10,
            radius: ballRadius,
            dx: Math.cos(angle) * baseBallSpeed * currentSpeedMultiplier,
            dy: Math.sin(angle) * -baseBallSpeed * currentSpeedMultiplier,
            color: 'white',
            isMainBall: true
        });
    }
}

// ---- Draw stars ---- // 
function drawStars() {
    for (const star of stars) {
        ctx.save();
        ctx.fillStyle = 'gold';
        ctx.shadowColor = 'yellow';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(star.x + 10, star.y);
        ctx.lineTo(star.x + 13, star.y + 7);
        ctx.lineTo(star.x + 20, star.y + 7);
        ctx.lineTo(star.x + 15, star.y + 12);
        ctx.lineTo(star.x + 17, star.y + 20);
        ctx.lineTo(star.x + 10, star.y + 15);
        ctx.lineTo(star.x + 3, star.y + 20);
        ctx.lineTo(star.x + 5, star.y + 12);
        ctx.lineTo(star.x + 0, star.y + 7);
        ctx.lineTo(star.x + 7, star.y + 7);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}

//---- Draw 3x balls ---- //
function drawTripleBalls() {
    for (const ball of tripleBalls) {
        ctx.save();
        ctx.fillStyle = ball.color;
        ctx.shadowColor = 'white';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(ball.x + tripleBallSize/2, ball.y + tripleBallSize/2, tripleBallSize/2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('3x', ball.x + tripleBallSize/2, ball.y + tripleBallSize/2);
        ctx.restore();
    }
}

// ---- Update lives display ---- //
function updateLivesDisplay() {
    livesElement.innerHTML = '';
    for (let i = 0; i < lives; i++) {
        const heart = document.createElement('i');
        heart.className = 'fas fa-heart heart';
        livesElement.appendChild(heart);
    }
    livesLeftElement.textContent = lives;
}

// ---- Draw paddle ---- //
function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddleX, canvas.height - paddleOffsetFromBottom, paddleWidth, paddleHeight);
    const gradient = ctx.createLinearGradient(paddleX, 0, paddleX + paddleWidth, 0);
    gradient.addColorStop(0, '#FFE3BE');
    gradient.addColorStop(0.5, '#C42391');
    gradient.addColorStop(1, '#3A0C0C');
    ctx.fillStyle = gradient;
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#4cc9f0';
    ctx.fill();
    ctx.closePath();
    ctx.shadowBlur = 0;
}

// ---- Draw all active balls ---- //
function drawBalls() {
    for (const ball of balls) {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = ball.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'white';
        ctx.fill();
    }
}

// ---- Draw target balls ---- //
function drawTargetBalls() {
    for (let i = 0; i < targetBalls.length; i++) {
        const ball = targetBalls[i];
        if (ball.active) {
            ctx.beginPath();
            ctx.fillStyle = ball.color;
            ctx.shadowColor = ball.color;
            ctx.shadowBlur = 5;
            ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.closePath();
            ctx.shadowBlur = 0;
        }
    }
}

// ---- Check ball collisions ---- //
function checkBallCollisions() {
    for (let i = 0; i < targetBalls.length; i++) {
        const targetBall = targetBalls[i];
        if (targetBall.active) {
            for (let j = 0; j < balls.length; j++) {

const ball = balls[j];
                const dx = ball.x - targetBall.x;
                const dy = ball.y - targetBall.y;
                const distanceSquared = dx * dx + dy * dy;
                const minDistance = ball.radius + targetBall.radius;
                
                if (distanceSquared < minDistance * minDistance) {
                    targetBall.active = false;
                    targetBallsToHit--;
                    ballScore += 10;
                    ballScoreElement.textContent = ballScore;
                    playSound(sounds.hit);
                    
                    brokenBallsHistory.push({
                        x: targetBall.x,
                        y: targetBall.y
                    });
                    
                    ballsBrokenSinceLastPowerUp++;
                    if (ballsBrokenSinceLastPowerUp >= ballsToSpawnTriple) {
                        spawnTripleBall(targetBall.x, targetBall.y);
                        ballsBrokenSinceLastPowerUp = 0;
                    }
                    
                    // ---- Increase speed by 0.5x when 50% balls are broken ---- //
                    const brokenBalls = initialTargetBallsCount - targetBallsToHit;
                    if (!speedIncreased && brokenBalls >= initialTargetBallsCount * 0.5) {
                        increaseBallSpeed();
                    }
                    
                    // ---- Normal bounce physics ---- //
                    const angle = Math.atan2(dy, dx);
                    const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy) * 1.02;
                    ball.dx = Math.sin(angle) * speed;
                    ball.dy = -Math.cos(angle) * speed;
                    
                    if (checkLevelComplete()) {
                        levelComplete();
                        return true;
                    }
                }
            }
        }
    }
    return false;
}

// ---- Check if all target balls are hit ---- //
function checkLevelComplete() {
    return !targetBalls.some(ball => ball.active);
}

// ---- Level complete ---- //
async function levelComplete() {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    playSound(sounds.levelComplete);
    levelBallScoreElement.textContent = ballScore;
    levelStarScoreElement.textContent = starScore;
    levelCompleteScreen.classList.add('active');
    startBtn.classList.remove('hidden');
    
    // ---- Save score ---- //
    // Changed: Call the new saveGameDataToBackend function
    await saveGameDataToBackend(ballScore, starScore, level);
    
    // ---- Reset lives for next level ---- //
    lives = 3;
    updateLivesDisplay();
}

// ---- Game over ---- //
async function gameOver() {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    playSound(sounds.gameOver);
    finalBallScoreElement.textContent = ballScore;
    finalStarScoreElement.textContent = starScore;
    currentLevelOnGameOver = level;
    gameOverScreen.classList.add('active');
    startBtn.classList.remove('hidden');
    
    // ---- Save score ---- //
    // Changed: Call the new saveGameDataToBackend function
    await saveGameDataToBackend(ballScore, starScore, level);
}

// ---- Show retry screen ---- //
function showRetryScreen() {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    
    // ---- Store remaining balls for next chance ---- //
    remainingBallsForNextChance = targetBalls.filter(ball => ball.active);
    
    lives--;
    updateLivesDisplay();
    
    if (lives <= 0) {
        gameOver();
    } else {
        playSound(sounds.lifeLost);
        retryScreen.classList.add('active');
    }
}

// ---- Reset ball position ---- //
function resetBall() {
    balls = [{
        x: canvas.width / 2,
        y: canvas.height - 50,
        radius: ballRadius,
        dx: baseBallSpeed * currentSpeedMultiplier,
        dy: -baseBallSpeed * currentSpeedMultiplier,
        color: 'white',
        isMainBall: true
    }];
    paddleX = (canvas.width - paddleWidth) / 2;
}

// ---- Reset current level for next chance ---- //
function resetCurrentLevelForNextChance() {
    targetBalls.forEach(ball => {
        ball.active = false;
    });
    
    remainingBallsForNextChance.forEach(ball => {
        const targetBall = targetBalls.find(b => b.x === ball.x && b.y === ball.y);
        if (targetBall) {
            targetBall.active = true;
        }
    });
    
    targetBallsToHit = targetBalls.filter(ball => ball.active).length;
    initialTargetBallsCount = targetBallsToHit;
    ballsBrokenSinceLastPowerUp = 0;
    
    // ---- Reset speed ---- //
    currentSpeedMultiplier = 1.0;
    speedIncreased = false;
    
    resetBall();
}

// ---- Retry current level with remaining balls ---- //
function retryCurrentLevel() {
    resetCurrentLevelForNextChance();
    retryScreen.classList.remove('active');
    gameRunning = true;
    startBtn.classList.add('hidden');
    draw();
}

// ---- Reset game ---- //
function resetGame() {
    cancelAnimationFrame(animationId);
    ballScore = 0;
    starScore = 0;
    level = 1;
    lives = 3;
    gameRunning = false;
    gamePaused = false;
    stars = [];
    tripleBalls = [];
    brokenBallsHistory = [];
    lastStarScore = 0;
    starsSpawnedThisLevel = 0;
    currentSpeedMultiplier = 1.0;
    speedIncreased = false;
    remainingBallsForNextChance = [];
    ballScoreElement.textContent = ballScore;
    starScoreElement.textContent = starScore;
    levelElement.textContent = level;
    updateLivesDisplay();
    resetBall();
    initTargetBalls();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// ---- Start next level ---- //
function nextLevel() {
    brokenBallsHistory = [];
    remainingBallsForNextChance = [];
    
    level++;
    levelElement.textContent = level;
    
    resetBall();
    initTargetBalls();
    playSound(sounds.levelStart);
    levelCompleteScreen.classList.remove('active');
    gameRunning = true;
    startBtn.classList.add('hidden');
    draw();
}

// ---- Start from current level ---- //
function startFromCurrentLevel() {
    cancelAnimationFrame(animationId);
    ballScore = 0;
    starScore = 0;
    level = currentLevelOnGameOver;
    lives = 3;
    gameRunning = false;
    gamePaused = false;
    stars = [];
    tripleBalls = [];
    brokenBallsHistory = [];
    lastStarScore = 0;
    starsSpawnedThisLevel = 0;
    currentSpeedMultiplier = 1.0;
    speedIncreased = false;
    remainingBallsForNextChance = [];
    ballScoreElement.textContent = ballScore;
    starScoreElement.textContent = starScore;
    levelElement.textContent = level;
    updateLivesDisplay();
    initTargetBalls();
    
    gameOverScreen.classList.remove('active');
    gameStartScreen.classList.remove('active');
    levelCompleteScreen.classList.remove('active');
    pausedScreen.classList.remove('active');
    retryScreen.classList.remove('active');
    
    gameRunning = true;
    gamePaused = false;
    startBtn.classList.add('hidden');
    playSound(sounds.levelStart);
    draw();
}

// ---- Toggle pause state ---- //
function togglePauseState() {
    if (!gameRunning) return;
    
    gamePaused = !gamePaused;
    
    if (gamePaused) {
        pausedScreen.classList.add('active');
        cancelAnimationFrame(animationId);
    } else {
        pausedScreen.classList.remove('active');
        draw();
    }
    
    pauseBtn.innerHTML = gamePaused ? 
        '<i class="fas fa-play"></i> Resume' : 
        '<i class="fas fa-pause"></i> Pause';
}

// ---- Toggle sound ---- //
function toggleSound() {
    soundOn = !soundOn;
    soundBtn.innerHTML = soundOn ? 
        '<i class="fas fa-volume-up"></i> Sound' : 
        '<i class="fas fa-volume-mute"></i> Sound';
    
    if (soundOn) {
        sounds.bounce.play();
    }
}

// ---- Update all active balls with improved physics ---- //
function updateBalls() {
    for (let i = balls.length - 1; i >= 0; i--) {
        const ball = balls[i];
        
        if (checkStoneCollisions(ball)) {
            continue;
        }
        
        ball.x += ball.dx;
        ball.y += ball.dy;
        
        // ---- Wall collision (left/right) ---- // 
        if (ball.x + ball.dx > canvas.width - ball.radius || 
            ball.x + ball.dx < ball.radius) {
            ball.dx = -ball.dx * 0.98;
            playSound(sounds.wallHit);
        }
        
        // ---- Wall collision (top) ----//
        if (ball.y + ball.dy < ball.radius) {
            ball.dy = -ball.dy * 0.98;
            playSound(sounds.wallHit);
        } 
        // ---- Paddle or bottom collision ---- //
        else if (ball.y + ball.dy > canvas.height - ball.radius) {
            if (ball.x > paddleX && ball.x < paddleX + paddleWidth) {
                const hitPosition = (ball.x - (paddleX + paddleWidth / 2)) / (paddleWidth / 2);
                const bounceAngle = hitPosition * Math.PI / 3;
                
                const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy) * 1.02;
                ball.dx = Math.sin(bounceAngle) * speed;
                ball.dy = -Math.cos(bounceAngle) * speed;
                
                playSound(sounds.bounce);
            } else {
                if (ball.isMainBall) {
                    balls.splice(i, 1);
                    
                    if (balls.length === 0) {
                        showRetryScreen();
                        return;
                    }
                } else {
                    balls.splice(i, 1);
                }
            }
        }
    }
}

// ---- Main game loop ---- //
function draw() {
    if (!gameRunning || gamePaused) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    updateBalls();
    updateStars();
    updateTripleBalls();
    
    if (checkBallCollisions()) {
        return;
    }
    
    drawStones();
    drawTargetBalls();
    drawStars();
    drawTripleBalls();
    drawPaddle();
    drawBalls();
    
    animationId = requestAnimationFrame(draw);
}

// ---- Keyboard controls ---- //
document.addEventListener('keydown', (e) => {
    if (e.key === 'Right' || e.key === 'ArrowRight') {
        rightPressed = true;
    } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
        leftPressed = true;
    } else if (e.key === ' ') {
        if (!gameRunning) {
            startGame();
        } else {
            togglePauseState();
        }
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'Right' || e.key === 'ArrowRight') {
        rightPressed = false;
    } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
        leftPressed = false;
    }
});

// ---- Mouse/touch controls ---- //
canvas.addEventListener('mousemove', (e) => {
    if (!gameRunning || gamePaused) return;
    
    const relativeX = e.clientX - canvas.offsetLeft;
    if (relativeX > paddleWidth/2 && relativeX < canvas.width - paddleWidth/2) {
        paddleX = relativeX - paddleWidth/2;
    }
});

canvas.addEventListener('touchmove', (e) => {
    if (!gameRunning || gamePaused) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const relativeX = touch.clientX - canvas.offsetLeft;
    if (relativeX > paddleWidth/2 && relativeX < canvas.width - paddleWidth/2) {
        paddleX = relativeX - paddleWidth/2;
    }
});

// ---- Button event listeners ---- //
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startFromCurrentLevel);
nextLevelBtn.addEventListener('click', nextLevel);
resumeBtn.addEventListener('click', togglePauseState);
retryBtn.addEventListener('click', retryCurrentLevel);
pauseBtn.addEventListener('click', togglePauseState);
soundBtn.addEventListener('click', toggleSound);

// ---- Start game function ---- //
function startGame() {
    resetGame();
    gameStartScreen.classList.remove('active');
    gameRunning = true;
    startBtn.classList.add('hidden');
    playSound(sounds.levelStart);
    draw();
}

// ---- Initialize game ---- //
initTargetBalls();
updateLivesDisplay();

 const backToMain = document.getElementById('backToMain');

if (backToMain) {
    backToMain.addEventListener('click', () => {
        window.location.href = '/Clint/dashboard.html';
    });
}

// --- NEW: Function to get JWT token from localStorage --- //
function getAuthToken() {
    return localStorage.getItem('token');
}

// --- NEW: Function to get logged-in user's username from localStorage --- //
function getLoggedInUsername() {
    const userDataString = localStorage.getItem('userData');
    if (userDataString) {
        try {
            const userData = JSON.parse(userDataString);
            return userData.username;
        } catch (e) {
            console.error("Error parsing user data from localStorage:", e);
            return null;
        }
    }
    return null;
}

// Clint/assest/js/Home.js
// ---- NEW: Function to save game data to the backend ---- //
async function saveGameDataToBackend(ballScore, starScore, level) { 
    const playerName = getLoggedInUsername();
    if (!playerName) {
        alert('You must be logged in to save your score. Please log in first.');
        console.error('No logged-in username found. User not logged in or user data missing.');
        return null;
    }

    const token = localStorage.getItem('token');

    if (!token) {
        alert('You must be logged in to save your score. Please log in first.');
        console.error('No authentication token found. User not logged in or token missing.');
        return null;
    }

    try {
        const API_BASE_URL_SAVE_DATA = 'http://toant.store/api/game/save-data'; 
        const response = await fetch(API_BASE_URL_SAVE_DATA, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                playerName: playerName,
                level: parseFloat(level),
                points: parseFloat(ballScore),
                stars: parseFloat(starScore),
                playedAt: new Date()
            })
        });

        if (response.ok) {
            const result = await response.json();
            console.log('Game data saved successfully:', result);
            alert('Game data saved successfully!');
            return result; 
        } else {
            console.error('Failed to save game data. Server responded with status:', response.status, response.statusText);
            let errorMessage = 'An unknown error occurred.';
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || JSON.stringify(errorData);
            } catch (jsonError) {
                errorMessage = await response.text();
            }
            console.error('Server error details:', errorMessage);
            alert(`Failed to save game data: ${errorMessage}. Please try again.`);

            if (response.status === 401 || response.status === 403) {
                alert('Session expired or unauthorized. Please log in again.');
            }
            return null;
        }
    } catch (error) {
        console.error('Error saving game data (network or fetch issue):', error);
        alert('An error occurred while saving game data. Please check your network connection and server status.');
        return null;
    }
}