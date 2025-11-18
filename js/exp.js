
// --- GLOBAL STATE ---
let currentPage = 'page-demographics';
const participantData = {
    id: null,
    age: null,
    gender: null,
    handedness: null,
    condition: null, // contextual vs physical
    block_order: null, // e.g., ['block1', 'block2']
    nonzaff_condition: null, // 1, 2, 3, or 4
    startTime: null,
    endTime: null,
    log: [],
    exp1: {
        trials: [],
        block1Coins: 0, // 单独记录 Block 1
        block2Coins: 0  // 单独记录 Block 2
    },
    exp2: {
        ratings: [], // 改为 ratings
        dragEvents: [] // 虽然不再拖拽，保留字段防止报错，或者用于其他交互记录
    },
    mouseTrajectory: []
};
let mouseTrackerInterval;
let lastMousePosition = { x: 0, y: 0 };
let coins = 4; // 初始硬币
let exp1TrialIndex = 0;
const TOTAL_TRIALS_PER_BLOCK = 16;
let generatedExp1Trials = [];


// --- CONDITION CONFIGURATION ---
const conditionConfig = {
    //情境条件
    contextual: {
        exp1: {
            instructions: [
                `<p>接下来你将看到处在不同场景下的一些人，你需要选择<strong>接近</strong>或是<strong>远离</strong>他们。</p>`,
                `<p>每一部分开始时，你初始都有<strong>4枚</strong>硬币。</p>`,
                `<p>特定条件组合下，如果你选择<strong>接近</strong>，你可能得到一枚硬币或失去两枚硬币（有一定规律）。</p>`,
                `<p>如果你选择<strong>远离</strong>，则你的硬币数量没有任何变化。</p>`,
                `<p>你的目标是获得<strong>尽可能多</strong>的硬币。</p>`
            ],
            check_q1: "1. 每部分开始时你有多少硬币？",
            check_q2: "2. 如果你选择“远离”，你的硬币会发生什么变化？",
            check_q3: "3. 你的目标是什么？",
            summary: "摘要：接近可能获得(+1)或失去(-2)硬币，远离无变化。目标：获得尽可能多的硬币",
            approach_btn_text: "接近",
            avoid_btn_text: "远离",
            stimuli: {
                block1: {
                    'hh': { images: ['./stimuli/exp1_emo/hh1.png', './stimuli/exp1_emo/hh2.png', './stimuli/exp1_emo/hh3.png', './stimuli/exp1_emo/hh4.png'] },
                    'sh': { images: ['./stimuli/exp1_emo/sh1.png', './stimuli/exp1_emo/sh2.png', './stimuli/exp1_emo/sh3.png', './stimuli/exp1_emo/sh4.png'] },
                    'hs': { images: ['./stimuli/exp1_emo/hs1.png', './stimuli/exp1_emo/hs2.png', './stimuli/exp1_emo/hs3.png', './stimuli/exp1_emo/hs4.png'] },
                    'ss': { images: ['./stimuli/exp1_emo/ss1.png', './stimuli/exp1_emo/ss2.png', './stimuli/exp1_emo/ss3.png', './stimuli/exp1_emo/ss4.png'] }
                },
                block2: { 
                    'ff': { images: ['./stimuli/exp1_emo/ff5.png', './stimuli/exp1_emo/ff6.png', './stimuli/exp1_emo/ff7.png', './stimuli/exp1_emo/ff8.png'] },
                    'fs': { images: ['./stimuli/exp1_emo/fs5.png', './stimuli/exp1_emo/fs6.png', './stimuli/exp1_emo/fs7.png', './stimuli/exp1_emo/fs8.png'] },
                    'sf': { images: ['./stimuli/exp1_emo/sf5.png', './stimuli/exp1_emo/sf6.png', './stimuli/exp1_emo/sf7.png', './stimuli/exp1_emo/sf8.png'] },
                    'ss_block2': { images: ['./stimuli/exp1_emo/ss5.png', './stimuli/exp1_emo/ss6.png', './stimuli/exp1_emo/ss7.png', './stimuli/exp1_emo/ss8.png'] }
                }
            }
        },
        exp2: {
            instructions: [
                `<p>假设在一个世界中，有个魔法师能用心灵魔力在一定程度上操纵他人的心灵，但不同的操纵方式消耗的心灵魔力不同。</p>`,
                `<p>我们以<strong>“Big (变大)”</strong>作为基准，它的魔力消耗定义为 <strong>10分</strong>。</p>`,
                `<p>接下来，请你以“Big”为参照，通过拖动滑块对其他六种方式消耗的魔力进行打分（0-100分）。</p>`
            ],
            check_q1: "1. 在这个任务中，你需要做什么？",
            check_q2: "2. 评分的基准“Big”是多少分？",
            rating_instruction: "请以 <strong>Big (10分)</strong> 为基准，滑动滑块判断其他项目的魔力消耗。",
            items: ['color', 'stone', 'big', 'transform', 'cease', 'conjure', 'split']
        }
    },
    //物理条件
    physical: {
        exp1: {
            instructions: [ 
                `<p>接下来你将看到一些神秘的方块，你需要选择<strong>接近</strong>或是<strong>远离</strong>它们。</p>`,
                `<p>每一部分开始时，你初始都有<strong>4枚</strong>硬币。</p>`,
                `<p>特定条件组合下，如果你选择<strong>接近</strong>，你可能得到一枚硬币或失去两枚硬币（有一定规律）。</p>`,
                `<p>如果你选择<strong>远离</strong>，则你的硬币数量没有任何变化。</p>`,
                `<p>你的目标是获得<strong>尽可能多</strong>的硬币。</p>`
            ],
            // 物理条件现在两个block规则一致，不再需要 separate instructions for block 2 regarding rules
            check_q1: "1. 每部分开始时你有多少硬币？",
            check_q2: "2. 如果你选择“远离”，你的硬币会发生什么变化？",
            check_q3: "3. 你的目标是什么？",
            summary: "摘要：接近可能获得(+1)或失去(-2)硬币，远离无变化。目标：获得尽可能多的硬币", 
            approach_btn_text: "接近",
            avoid_btn_text: "远离",
            stimuli: {
                 block1: {
                    'hh': { images: ['./stimuli/exp1_phy/hh1.png', './stimuli/exp1_phy/hh2.png', './stimuli/exp1_phy/hh3.png', './stimuli/exp1_phy/hh4.png'] },
                    'sh': { images: ['./stimuli/exp1_phy/sh1.png', './stimuli/exp1_phy/sh2.png', './stimuli/exp1_phy/sh3.png', './stimuli/exp1_phy/sh4.png'] },
                    'hs': { images: ['./stimuli/exp1_phy/hs1.png', './stimuli/exp1_phy/hs2.png', './stimuli/exp1_phy/hs3.png', './stimuli/exp1_phy/hs4.png'] },
                    'ss': { images: ['./stimuli/exp1_phy/ss1.png', './stimuli/exp1_phy/ss2.png', './stimuli/exp1_phy/ss3.png', './stimuli/exp1_phy/ss4.png'] }
                },
                block2: {
                    'ff': { images: ['./stimuli/exp1_phy/ff5.png', './stimuli/exp1_phy/ff6.png', './stimuli/exp1_phy/ff7.png', './stimuli/exp1_phy/ff8.png'] },
                    'fs': { images: ['./stimuli/exp1_phy/fs5.png', './stimuli/exp1_phy/fs6.png', './stimuli/exp1_phy/fs7.png', './stimuli/exp1_phy/fs8.png'] },
                    'sf': { images: ['./stimuli/exp1_phy/sf5.png', './stimuli/exp1_phy/sf6.png', './stimuli/exp1_phy/sf7.png', './stimuli/exp1_phy/sf8.png'] },
                    'ss_block2': { images: ['./stimuli/exp1_phy/ss5.png', './stimuli/exp1_phy/ss6.png', './stimuli/exp1_phy/ss7.png', './stimuli/exp1_phy/ss8.png'] }
                }
            }
        },
        exp2: {
            instructions: [
                `<p>假设在一个世界中，有个魔法师能用魔法在一定程度上操纵物质，但不同的操纵方式消耗的魔法不同。</p>`,
                `<p>我们以<strong>“Big (变大)”</strong>作为基准，它的魔力消耗定义为 <strong>10分</strong>。</p>`,
                `<p>接下来，请你以“Big”为参照，通过拖动滑块对其他六种方式消耗的魔力进行打分（0-100分）。</p>`
            ],
            check_q1: "1. 在这个任务中，你需要做什么？",
            check_q2: "2. 评分的基准“Big”是多少分？",
            rating_instruction: "请以 <strong>Big (10分)</strong> 为基准，滑动滑块判断其他项目的魔力消耗。",
            items: ['color', 'stone', 'big', 'transform', 'cease', 'conjure', 'split']
        }
    }
};

// Latin Square / Fixed order
const exp1TrialOrder = [
    'zaff1', 'nonzaff4', 'zaff2', 'zaff3',
    'nonzaff4', 'zaff1', 'zaff3', 'zaff2',
    'zaff2', 'zaff3', 'nonzaff4', 'zaff1',
    'zaff3', 'zaff2', 'zaff1', 'nonzaff4'
];

function getStimulusRoleMapping(blockName, nonzaffCondition) {
    // 统一规则：Physical 和 Contextual 现在完全一致
    // 不再对 Physical 的 Block2 做特殊处理
    
    const block1Types = ['hh', 'hs', 'sh', 'ss'];
    const block2Types = ['ff', 'fs', 'sf', 'ss_block2'];
    const oppositeMap = {
        'hh': 'ss', 'ss': 'hh', 'hs': 'sh', 'sh': 'hs',
        'ff': 'ss_block2', 'ss_block2': 'ff', 'fs': 'sf', 'sf': 'fs'
    };

    const types = blockName === 'block1' ? block1Types : block2Types;
    
    let nonzaffType;
    if (nonzaffCondition === 1) nonzaffType = types[3];
    else if (nonzaffCondition === 2) nonzaffType = types[0];
    else if (nonzaffCondition === 3) nonzaffType = types[1];
    else if (nonzaffCondition === 4) nonzaffType = types[2];

    const zaffTypes = types.filter(t => t !== nonzaffType);
    const zaff1Type = oppositeMap[nonzaffType];
    const remainingZaffTypes = zaffTypes.filter(t => t !== zaff1Type);

    // 统一 outcome: nonzaff4 = -2, zaff = +1
    return {
        'nonzaff4': { type: nonzaffType, outcome: -2 }, 
        'zaff1':    { type: zaff1Type, outcome: 1 },    
        'zaff2':    { type: remainingZaffTypes[0], outcome: 1 },
        'zaff3':    { type: remainingZaffTypes[1], outcome: 1 } 
    };
}


function generateTrialList() {
    const mainCondition = participantData.condition;
    const blockOrder = participantData.block_order;
    const nonzaffCondition = participantData.nonzaff_condition;
    
    generatedExp1Trials = []; 

    blockOrder.forEach(blockName => {
        const roleMapping = getStimulusRoleMapping(blockName, nonzaffCondition);
        const stimuliForBlock = conditionConfig[mainCondition].exp1.stimuli[blockName];

        const sequentialImages = {};
        for (const key in stimuliForBlock) {
            sequentialImages[key] = [...stimuliForBlock[key].images];
        }

        const blockTrials = exp1TrialOrder.map(role => {
            const mapping = roleMapping[role];
            const stimulusType = mapping.type;
            const outcome = mapping.outcome;
            const imagePath = sequentialImages[stimulusType].shift();

            return {
                block: blockName,
                stimulus_role: role, 
                stimulus_type: stimulusType, 
                imagePath: imagePath,
                outcome: outcome
            };
        });
        generatedExp1Trials.push(...blockTrials);
    });
}


// --- DOM ELEMENTS ---
const pages = document.querySelectorAll('.page');
const coinCountEl = document.getElementById('coin-count');
const stimulusContainer = document.getElementById('stimulus-container');
const choiceButtons = document.getElementById('choice-buttons');
const nextTrialContainer = document.getElementById('next-trial-container');
const nextTrialBtn = document.getElementById('next-trial-btn');
let dataDownloaded = false;

// Audio
const gainSound = document.getElementById('gain-sound');
const loseSound = document.getElementById('lose-sound');
const neutralSound = document.getElementById('neutral-sound');


// --- UTILITY FUNCTIONS ---
function logEvent(eventName, details = {}) {
    const logEntry = {
        event: eventName,
        timestamp: performance.now(),
        page: currentPage,
        details: details
    };
    participantData.log.push(logEntry);
}

function showPage(pageId) {
    pages.forEach(page => page.classList.add('hidden'));
    document.getElementById(pageId).classList.remove('hidden');
    currentPage = pageId;
    logEvent('Page shown', { pageId });
}

// --- MOUSE TRACKING ---
function startMouseTracking() {
    document.addEventListener('mousemove', (e) => {
        lastMousePosition = { x: e.clientX, y: e.clientY };
    });
    mouseTrackerInterval = setInterval(() => {
        participantData.mouseTrajectory.push({
            x: lastMousePosition.x,
            y: lastMousePosition.y,
            timestamp: performance.now()
        });
    }, 1000 / 120); 
}

function stopMouseTracking() {
    clearInterval(mouseTrackerInterval);
    document.removeEventListener('mousemove', (e) => {
        lastMousePosition = { x: e.clientX, y: e.clientY };
    });
}

// --- PAGE 1: DEMOGRAPHICS ---
document.getElementById('start-btn').addEventListener('click', () => {
    const id = document.getElementById('participant-id').value;
    const age = document.getElementById('age').value;
    const gender = document.getElementById('gender').value;
    const handedness = document.getElementById('handedness').value;

    if (!id || !age || !gender || !handedness) {
        alert('请填写所有信息。');
        return;
    }
    participantData.id = id;
    participantData.age = age;
    participantData.gender = gender;
    participantData.handedness = handedness;
    participantData.startTime = performance.now();

    // Conditions
    const conditions = ['physical', 'contextual'];
    participantData.condition = conditions[Math.floor(Math.random() * conditions.length)];
    
    const blockOrders = [['block1', 'block2'], ['block2', 'block1']];
    participantData.block_order = blockOrders[Math.floor(Math.random() * blockOrders.length)];
    
    participantData.nonzaff_condition = Math.floor(Math.random() * 4) + 1; 

    logEvent('Conditions Assigned', { 
        main: participantData.condition, 
        block: participantData.block_order,
        nonzaff: participantData.nonzaff_condition
    });

    generateTrialList();
    startMouseTracking();
    showPage('page-consent');
});

// --- PAGE 2: CONSENT ---
const consentCheckbox = document.getElementById('consent-checkbox');
const consentBtn = document.getElementById('consent-btn');
consentCheckbox.addEventListener('change', () => {
    consentBtn.disabled = !consentCheckbox.checked;
});

function showFirstBlockInstructions() {
    const condition = participantData.condition;
    // 不管什么条件，第一部分都用 exp1.instructions，初始硬币均为 4
    coins = 4; 
    const instructions = conditionConfig[condition].exp1.instructions;
    document.getElementById('exp1-summary').textContent = conditionConfig[condition].exp1.summary;
    
    coinCountEl.textContent = coins; 
    document.getElementById('exp1-instructions-content').innerHTML = instructions.join('');
    showPage('page-exp1-instructions');
}

consentBtn.addEventListener('click', () => {
    if (consentCheckbox.checked) {
        showFirstBlockInstructions();
    }
});


// --- PAGE 3: EXP 1 INSTRUCTIONS ---
document.getElementById('exp1-instr-btn').addEventListener('click', () => {
    const condition = participantData.condition;
    document.getElementById('exp1-q1-text').textContent = conditionConfig[condition].exp1.check_q1;
    document.getElementById('exp1-q2-text').textContent = conditionConfig[condition].exp1.check_q2;
    document.getElementById('exp1-q3-text').textContent = conditionConfig[condition].exp1.check_q3;
    showPage('page-exp1-check');
});

// --- PAGE 4: EXP 1 CHECK ---
document.getElementById('exp1-check-btn').addEventListener('click', () => {
    const q1 = document.querySelector('input[name="q1"]:checked')?.value;
    const q2 = document.querySelector('input[name="q2"]:checked')?.value;
    const q3 = document.querySelector('input[name="q3"]:checked')?.value;
    const errorEl = document.getElementById('exp1-check-error');

    // 统一答案：初始4硬币
    const correctCoinAnswer = '4';

    if (q1 === correctCoinAnswer && q2 === 'no_change' && q3 === 'max_coins') {
        errorEl.classList.add('hidden');
        logEvent('Exp1 Comprehension Check Passed');
        
        const condition = participantData.condition;
        document.getElementById('approach-btn').textContent = conditionConfig[condition].exp1.approach_btn_text;
        document.getElementById('avoid-btn').textContent = conditionConfig[condition].exp1.avoid_btn_text;

        showPage('page-exp1-formal');
        runExp1Trial();
    } else {
        errorEl.classList.remove('hidden');
        setTimeout(() => {
            errorEl.classList.add('hidden');
            showFirstBlockInstructions(); 
        }, 2000);
    }
});

// --- PAGE 5: EXP 1 FORMAL ---
function runExp1Trial() {
    if (exp1TrialIndex >= generatedExp1Trials.length) {
        endExp1();
        return;
    }

    const currentTrial = generatedExp1Trials[exp1TrialIndex];
    
    stimulusContainer.innerHTML = `<img src="${currentTrial.imagePath}" class="w-full h-full object-contain" alt="stimulus image">`;
    choiceButtons.classList.remove('hidden');

    const trialData = {
        trial_index: exp1TrialIndex + 1,
        block: currentTrial.block,
        stimulus_role: currentTrial.stimulus_role,
        stimulus_type: currentTrial.stimulus_type,
        imagePath: currentTrial.imagePath,
        start_time: performance.now(),
        choice: null,
        rt: null,
        outcome: null,
        coins_before: coins,
        coins_after: null
    };

    const handleChoice = (choice) => {
        document.getElementById('approach-btn').removeEventListener('click', approachHandler);
        document.getElementById('avoid-btn').removeEventListener('click', avoidHandler);

        trialData.choice = choice;
        trialData.rt = performance.now() - trialData.start_time;
        choiceButtons.classList.add('hidden');
        
        let outcome = 0;
        let feedbackText = ''; 

        if (choice === 'approach') {
            outcome = currentTrial.outcome;
            coins += outcome;
            if (outcome > 0) feedbackText = `+${outcome} 🪙`;
            else feedbackText = `-${-outcome} 🪙`;
        } else { 
            feedbackText = '无变化';
        }

        trialData.outcome = outcome;
        trialData.coins_after = coins;
        participantData.exp1.trials.push(trialData);
        
        coinCountEl.textContent = coins;
        
        if (gainSound) gainSound.load();
        if (loseSound) loseSound.load();
        if (neutralSound) neutralSound.load();

        if (choice === 'avoid') {
            stimulusContainer.innerHTML = `<div class="feedback-animation neutral">无变化</div>`;
            if (neutralSound) neutralSound.play().catch(e => {});
        } else if (outcome > 0) {
            stimulusContainer.innerHTML = `<div class="feedback-animation gain">+${outcome} 🪙</div>`;
            if (gainSound) gainSound.play().catch(e => {});
        } else { 
            stimulusContainer.innerHTML = `<div class="feedback-animation lose">-${-outcome} 🪙</div>`;
            if (loseSound) loseSound.play().catch(e => {});
        }

        setTimeout(() => {
            stimulusContainer.innerHTML = ''; 
            // Check Block End
            if (exp1TrialIndex === TOTAL_TRIALS_PER_BLOCK - 1) {
                // End of First Block
                logEvent('Exp1 Block 1 Ended');
                participantData.exp1.block1Coins = coins; // Save Block 1 Score
                
                const breakText = document.getElementById('break-text');
                breakText.innerHTML = `你在第一部分获得了 <span class="text-2xl font-bold text-indigo-600">${coins}</span> 枚硬币🪙。<br>休息一下，准备进入第二部分。`;
                
                showPage('page-exp1-mid-break');
            } else {
                 nextTrialContainer.classList.remove('hidden');
            }
        }, 1000); 
    };

    const approachHandler = () => handleChoice('approach');
    const avoidHandler = () => handleChoice('avoid');

    document.getElementById('approach-btn').addEventListener('click', approachHandler);
    document.getElementById('avoid-btn').addEventListener('click', avoidHandler);
}

function endExp1() {
    logEvent('Experiment 1 Fully Ended');
    participantData.exp1.block2Coins = coins; // Save Block 2 Score (End of Exp1)
    
    document.getElementById('final-block-score').textContent = coins;
    
    showPage('page-exp1-break');
}

// --- MID-BLOCK BREAK ---
document.getElementById('to-next-block-btn').addEventListener('click', () => {
    // Reset for Block 2
    coins = 4; 
    coinCountEl.textContent = coins;
    
    // 统一的摘要文本 (Contextual 和 Physical 现在一致)
    const condition = participantData.condition;
    document.getElementById('exp1-summary').textContent = conditionConfig[condition].exp1.summary;

    showPage('page-exp1-formal');
    nextTrialContainer.classList.add('hidden');
    exp1TrialIndex++;
    runExp1Trial();
});


// --- PAGE 6: EXP 1 BREAK (Before Exp 2) ---
document.getElementById('to-exp2-btn').addEventListener('click', () => {
    const condition = participantData.condition;
    const instructions = conditionConfig[condition].exp2.instructions;
    document.getElementById('exp2-instructions-content').innerHTML = instructions.join('');
    showPage('page-exp2-instructions');
});

// --- PAGE 7: EXP 2 INSTRUCTIONS ---
document.getElementById('exp2-instr-btn').addEventListener('click', () => {
    const condition = participantData.condition;
    document.getElementById('exp2-q1-text').textContent = conditionConfig[condition].exp2.check_q1;
    document.getElementById('exp2-q2-text').textContent = conditionConfig[condition].exp2.check_q2;
    showPage('page-exp2-check');
});

// --- PAGE 8: EXP 2 CHECK ---
document.getElementById('exp2-check-btn').addEventListener('click', () => {
    const q1 = document.querySelector('input[name="q2-1"]:checked')?.value;
    const q2 = document.querySelector('input[name="q2-2"]:checked')?.value;
    const errorEl = document.getElementById('exp2-check-error');

    // 答案：a (打分), b (10分)
    if (q1 === 'a' && q2 === 'b') {
        errorEl.classList.add('hidden');
        logEvent('Exp2 Comprehension Check Passed');
        setupExp2(); // Setup Sliders
        showPage('page-exp2-formal');
    } else {
        errorEl.classList.remove('hidden');
        setTimeout(() => {
            errorEl.classList.add('hidden');
            const condition = participantData.condition;
            const instructions = conditionConfig[condition].exp2.instructions;
            document.getElementById('exp2-instructions-content').innerHTML = instructions.join('');
            showPage('page-exp2-instructions');
        }, 2000);
    }
});


// --- PAGE 9: EXP 2 FORMAL (RATINGS) ---
function setupExp2() {
    const condition = participantData.condition;
    const exp2ItemIds = conditionConfig[condition].exp2.items; 
    const ratingContainer = document.getElementById('exp2-rating-container');
    
    const imgPath = condition === 'physical' ? './stimuli/exp2_phy/' : './stimuli/exp2_emo/';

    ratingContainer.innerHTML = '';
    document.getElementById('exp2-rating-instruction').innerHTML = conditionConfig[condition].exp2.rating_instruction;

    // 分离 'big' 和其他项目
    const bigItem = 'big';
    const otherItems = exp2ItemIds.filter(i => i !== 'big').sort(() => Math.random() - 0.5);
    
    // 合并列表，Big 在第一个
    const displayOrder = [bigItem, ...otherItems];

    displayOrder.forEach(itemId => {
        const row = document.createElement('div');
        row.className = 'flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border mb-3';
        
        // 左侧：图片/标签
        const imgWrapper = document.createElement('div');
        imgWrapper.className = 'w-24 h-24 flex-shrink-0 mr-6 flex flex-col items-center justify-center';
        
        const imgEl = document.createElement('img');
        imgEl.src = `${imgPath}${itemId}.png`;
        imgEl.className = 'w-full h-full object-contain rounded-md';
        imgEl.alt = itemId;
        imgWrapper.appendChild(imgEl);
        
        // 右侧：滑块
        const sliderWrapper = document.createElement('div');
        sliderWrapper.className = 'flex-grow flex flex-col';

        const topLabel = document.createElement('div');
        topLabel.className = 'flex justify-between text-sm text-gray-500 mb-1';
        topLabel.innerHTML = `<span>0</span><span>100</span>`;

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = '0';
        slider.max = '100';
        slider.className = 'w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer';
        slider.dataset.itemId = itemId; // 绑定ID

        // 显示数值
        const valueDisplay = document.createElement('span');
        valueDisplay.className = 'text-center font-bold text-indigo-600 mt-2';

        if (itemId === 'big') {
            slider.value = 10;
            slider.disabled = true;
            slider.classList.add('opacity-50', 'cursor-not-allowed');
            valueDisplay.textContent = '10 (基准)';
            row.classList.add('bg-blue-50', 'border-blue-200'); // 高亮基准行
        } else {
            slider.value = 50; // 默认中间值
            valueDisplay.textContent = '50';
            
            slider.addEventListener('input', (e) => {
                valueDisplay.textContent = e.target.value;
            });
        }

        sliderWrapper.appendChild(topLabel);
        sliderWrapper.appendChild(slider);
        sliderWrapper.appendChild(valueDisplay);

        row.appendChild(imgWrapper);
        row.appendChild(sliderWrapper);
        ratingContainer.appendChild(row);
    });
}

document.getElementById('confirm-rating-btn').addEventListener('click', () => {
    const sliders = document.querySelectorAll('input[type="range"]');
    const ratings = [];

    sliders.forEach(slider => {
        ratings.push({
            itemId: slider.dataset.itemId,
            rating: parseInt(slider.value, 10)
        });
    });

    // 保存实验二数据
    participantData.exp2.ratings = ratings;
    logEvent('Exp2 Ratings Confirmed', { ratings: ratings });

    stopMouseTracking();
    participantData.endTime = performance.now();
    logEvent('Experiment End');

    downloadData();

    showPage('page-end');
    const downloadBtn = document.getElementById('download-data-btn');
    if (downloadBtn) downloadBtn.classList.add('hidden');
    
    console.log("--- Final Data ---", participantData);
});


nextTrialBtn.addEventListener('click', () => {
    nextTrialContainer.classList.add('hidden');
    exp1TrialIndex++;
    runExp1Trial();
});


// --- PAGE 10: END (CSV Export) ---
function convertJsonToCsv(data) {
    const escapeCsvCell = (cell) => {
        if (cell === null || cell === undefined) return '';
        if (Array.isArray(cell)) return `"${cell.join('-')}"`;
        return String(cell).replace(/"/g, '""');
    };

    let csvContent = "";

    // 1. Participant Info
    csvContent += "# PARTICIPANT INFO\r\n";
    const infoHeaders = ['id', 'age', 'gender', "handedness", 'condition', 'block_order', 'nonzaff_condition', 'block1_score', 'block2_score', 'startTime', 'endTime'];
    const infoValues = [data.id, data.age, data.gender, data.handedness, data.condition, data.block_order, data.nonzaff_condition, data.exp1.block1Coins, data.exp1.block2Coins, data.startTime, data.endTime];
    csvContent += infoHeaders.join(',') + "\r\n";
    csvContent += infoValues.map(escapeCsvCell).join(',') + "\r\n";

    // 2. Exp 1 Trials
    if (data.exp1 && data.exp1.trials.length > 0) {
        csvContent += "\r\n# EXPERIMENT 1 TRIALS\r\n";
        const exp1Headers = Object.keys(data.exp1.trials[0]);
        csvContent += exp1Headers.join(',') + "\r\n";
        data.exp1.trials.forEach(row => {
            csvContent += exp1Headers.map(h => escapeCsvCell(row[h])).join(',') + "\r\n";
        });
    }

    // 3. Exp 2 Ratings
    if (data.exp2 && data.exp2.ratings.length > 0) {
        csvContent += "\r\n# EXPERIMENT 2 RATINGS\r\n";
        const exp2Headers = ['itemId', 'rating'];
        csvContent += exp2Headers.join(',') + "\r\n";
        data.exp2.ratings.forEach(row => {
            csvContent += `${row.itemId},${row.rating}\r\n`;
        });
    }

    // 4. Event Log (建议保留，用于排查问题)
    if (data.log && data.log.length > 0) {
        csvContent += "\r\n# EVENT LOG\r\n";
        const logHeaders = ['event', 'timestamp', 'page', 'details'];
        csvContent += logHeaders.join(',') + "\r\n";
        data.log.forEach(row => {
            const detailsStr = JSON.stringify(row.details).replace(/"/g, '""'); // Escape JSON quotes for CSV
            const rowValues = [row.event, row.timestamp, row.page, `"${detailsStr}"`];
            csvContent += rowValues.join(',') + "\r\n";
        });
    }

    // 5. Mouse Trajectory (补回的部分)
    if (data.mouseTrajectory && data.mouseTrajectory.length > 0) {
        csvContent += "\r\n# MOUSE TRAJECTORY\r\n";
        // 采样数据量可能很大，直接取第一个点的 keys 作为表头
        const mouseHeaders = Object.keys(data.mouseTrajectory[0]);
        csvContent += mouseHeaders.join(',') + "\r\n";
        data.mouseTrajectory.forEach(row => {
            csvContent += mouseHeaders.map(h => row[h]).join(',') + "\r\n";
        });
    }

    return csvContent;
}

function downloadData() {
    if (dataDownloaded) return; 
    dataDownloaded = true;

    const participantId = participantData.id || 'unknown';
    const timestamp = new Date().getTime();
    const filename = `data_${participantId}_${timestamp}.csv`;

    const dataStr = convertJsonToCsv(participantData);
    const dataBlob = new Blob([dataStr], { type: 'text/csv;charset=utf-8,' });

    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(dataBlob);
    downloadLink.download = filename;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}

// --- DEBUG MODE ---
// --- DEBUG MODE ---
function setupDebugMode() {
    const debugMenu = document.getElementById('debug-menu');
    const debugPageList = document.getElementById('debug-page-list');
    if (!debugMenu || !debugPageList) return;

    // Clear existing content
    debugPageList.innerHTML = '';

    const createSelector = (id, label, options) => {
        const container = document.createElement('div');
        container.className = 'flex items-center gap-2 w-full';
        const labelEl = document.createElement('label');
        labelEl.textContent = label;
        labelEl.className = 'text-sm font-medium text-gray-700';
        const selectEl = document.createElement('select');
        selectEl.id = id;
        selectEl.className = 'mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md';
        options.forEach(opt => {
            const optionEl = document.createElement('option');
            optionEl.value = opt.value;
            optionEl.textContent = opt.text;
            selectEl.appendChild(optionEl);
        });
        container.appendChild(labelEl);
        container.appendChild(selectEl);
        return container;
    };

    const conditionSelector = createSelector('debug-condition-select', 'Condition:', [
        { value: 'contextual', text: 'Contextual' },
        { value: 'physical', text: 'Physical' }
    ]);
    const blockOrderSelector = createSelector('debug-block-order-select', 'Block Order:', [
        { value: 'block1,block2', text: 'Block 1 -> 2' },
        { value: 'block2,block1', text: 'Block 2 -> 1' }
    ]);
    const nonzaffSelector = createSelector('debug-nonzaff-select', 'Non-zaff:', [
        { value: '1', text: '1' },
        { value: '2', text: '2' },
        { value: '3', text: '3' },
        { value: '4', text: '4' }
    ]);
    
    debugPageList.appendChild(conditionSelector);
    debugPageList.appendChild(blockOrderSelector);
    debugPageList.appendChild(nonzaffSelector);

    const separator = document.createElement('hr');
    separator.className = 'my-2';
    debugPageList.appendChild(separator);

    pages.forEach(page => {
        const pageId = page.id;
        const button = document.createElement('button');
        button.textContent = `Go to: ${pageId}`;
        button.className = 'bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-1 px-3 border border-gray-400 rounded shadow w-full text-left';

        button.addEventListener('click', () => {
            const selectedCondition = document.getElementById('debug-condition-select').value;
            const selectedBlockOrderStr = document.getElementById('debug-block-order-select').value;
            const selectedNonzaff = parseInt(document.getElementById('debug-nonzaff-select').value, 10);
            
            if (!participantData.startTime) {
                participantData.id = 'debug_user';
                participantData.age = 99;
                participantData.gender = 'other';
                participantData.startTime = performance.now();
                startMouseTracking();
            }

            participantData.condition = selectedCondition;
            participantData.block_order = selectedBlockOrderStr.split(',');
            participantData.nonzaff_condition = selectedNonzaff;
            
            generateTrialList();

            // Handle specific page init logic
            if (page.id === 'page-exp1-instructions') {
                showFirstBlockInstructions(); 
            } else if (page.id === 'page-exp1-check') {
                coins = 4; // Reset for check
                coinCountEl.textContent = coins;
                document.getElementById('exp1-q1-text').textContent = conditionConfig[selectedCondition].exp1.check_q1;
                document.getElementById('exp1-q2-text').textContent = conditionConfig[selectedCondition].exp1.check_q2;
                document.getElementById('exp1-q3-text').textContent = conditionConfig[selectedCondition].exp1.check_q3;
                showPage(pageId);
            } else if (pageId === 'page-exp1-formal') {
                if(exp1TrialIndex === 0) {
                   coins = 4;
                   document.getElementById('exp1-summary').textContent = conditionConfig[selectedCondition].exp1.summary;
                   coinCountEl.textContent = coins;
                }
                document.getElementById('approach-btn').textContent = conditionConfig[selectedCondition].exp1.approach_btn_text;
                document.getElementById('avoid-btn').textContent = conditionConfig[selectedCondition].exp1.avoid_btn_text;
                showPage(pageId);
                runExp1Trial();
            } else if (page.id === 'page-exp2-instructions') {
                const instructions = conditionConfig[selectedCondition].exp2.instructions;
                document.getElementById('exp2-instructions-content').innerHTML = instructions.join('');
                showPage(pageId);
            } else if (page.id === 'page-exp2-check') {
                document.getElementById('exp2-q1-text').textContent = conditionConfig[selectedCondition].exp2.check_q1;
                document.getElementById('exp2-q2-text').textContent = conditionConfig[selectedCondition].exp2.check_q2;
                showPage(pageId);
            } else if (pageId === 'page-exp2-formal') {
                setupExp2();
                showPage(pageId);
            } else {
                showPage(pageId);
            }
            
            debugMenu.classList.add('hidden');
        });
        debugPageList.appendChild(button);
    });

    // 重新添加按键监听
    window.addEventListener('keydown', (e) => {
        if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'SELECT') {
            return;
        }

        if (e.key === 'm') {
            e.preventDefault(); 
            debugMenu.classList.toggle('hidden');
        }
    });
}


// --- INITIALIZATION ---
window.onload = () => {
    participantData.log.push({ event: 'Script Loaded', timestamp: performance.now() });
    showPage('page-demographics');
    setupDebugMode();
};