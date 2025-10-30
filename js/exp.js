// --- GLOBAL STATE ---
let currentPage = 'page-demographics';
const participantData = {
    id: null,
    age: null,
    gender: null,
    handedness: null,
    condition: null, // contextual vs physical
    block_order: null, // e.g., ['block1', 'block2'] or ['block2', 'block1']
    nonzaff_condition: null, // 1, 2, 3, or 4
    startTime: null,
    endTime: null,
    log: [],
    exp1: {
        trials: [],
        finalCoins: 0 // Note: For the 'physical' condition, this only reflects the final coin count of the last block.
    },
    exp2: {
        ranking: [],
        dragEvents: []
    },
    mouseTrajectory: []
};
let mouseTrackerInterval;
let lastMousePosition = { x: 0, y: 0 };
let coins = 4; // This is a default value; it will be explicitly set before each block begins.
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
                `<p>你初始有<strong>4枚</strong>硬币。</p>`,
                `<p>特定条件组合下，如果你选择<strong>接近</strong>，你可能得到一枚硬币或失去两枚硬币（有一定规律而非随机）。</p>`,
                `<p>如果你选择<strong>远离</strong>，则你的硬币数量没有任何变化。</p>`,
                `<p>你的目标是在结束时获得<strong>尽可能多</strong>的硬币。</p>`
            ],
            check_q1: "1. 你初始有多少硬币？",
            check_q2: "2. 如果你选择“远离”，你的硬币会发生什么变化？",
            check_q3: "3. 你的目标是什么？",
            summary: "摘要：接近可能获得或失去硬币，远离无变化。目标：获得尽可能多的硬币",
            approach_btn_text: "接近",
            avoid_btn_text: "远离",
            stimuli: {
                block1: {
                    'hh': { images: ['./stimuli/exp1_emo/hh1.png', './stimuli/exp1_emo/hh2.png', './stimuli/exp1_emo/hh3.png', './stimuli/exp1_emo/hh4.png'] },
                    'sh': { images: ['./stimuli/exp1_emo/sh1.png', './stimuli/exp1_emo/sh2.png', './stimuli/exp1_emo/sh3.png', './stimuli/exp1_emo/sh4.png'] },
                    'hs': { images: ['./stimuli/exp1_emo/hs1.png', './stimuli/exp1_emo/hs2.png', './stimuli/exp1_emo/hs3.png', './stimuli/exp1_emo/hs4.png'] },
                    'ss': { images: ['./stimuli/exp1_emo/ss1.png', './stimuli/exp1_emo/ss2.png', './stimuli/exp1_emo/ss3.png', './stimuli/exp1_emo/ss4.png'] }
                },
                block2: { // Note: using 'ff', 'fs', 'sf', 'ss' as identifiers for block2 stimuli
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
                `<p>接下来，你将看到七种操纵心灵的方式。</p>`,
                `<p>请你根据你的直觉判断，对它们可能<strong>消耗心灵魔力的多少</strong>进行<strong>由低到高</strong>的排序。</p>`
            ],
            check_q1: "1. 在这个任务中，你需要做什么？",
            check_q2: "2. 排序的顺序是什么？",
            ranking_instruction: "请将下列项目拖拽到下方排序栏中，进行<strong>由低到高</strong>排序（左侧消耗最低，右侧消耗最高）。",
            items: ['color', 'stone', 'big', 'transform', 'cease', 'conjure', 'split']
        }
    },
    //物理条件
    physical: {
        exp1: {
            instructions: [ // Instructions for Block 1
                `<p>接下来你将看到一些神秘的方块，你需要选择<strong>接近</strong>或是<strong>远离</strong>它们。</p>`,
                `<p>在这个部分开始时，你的硬币数量为<strong>4枚</strong>。</p>`,
                `<p>在特定条件下，如果你选择<strong>接近</strong>，你可能得到一枚硬币或失去两枚硬币（有一定规律而非随机）。</p>`,
                `<p>如果你选择<strong>远离</strong>，则你的硬币数量没有任何变化。</p>`,
                `<p>你的目标是在结束时获得<strong>尽可能多</strong>的硬币。</p>`
            ],
            instructions_block2: [ // Instructions for Block 2
                `<p>在这个部分开始时，你的硬币数量为<strong>8枚</strong>。</p>`,
                `<p>如果你选择<strong>接近</strong>，你可能得到<strong>两枚</strong>硬币或失去<strong>一枚</strong>硬币。</p>`,
                `<p>如果你选择<strong>远离</strong>，你的硬币数量仍然没有任何变化。</p>`,
                `<p>你的目标仍然是在结束时获得<strong>尽可能多</strong>的硬币。</p>`,
                `<p></strong>注意：</strong>两部分获得或失去的规则可能稍有变化</p>`
            ],
            check_q1: "1. 在这个部分开始时，你有多少硬币？",
            check_q2: "2. 如果你选择“远离”，你的硬币会发生什么变化？",
            check_q3: "3. 你的目标是什么？",
            summary: "摘要：接近可能获得或失去硬币，远离无变化。目标：获得尽可能多的硬币", // This will be dynamically updated
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
                `<p>接下来，你将看到七种操纵物质的方式。</p>`,
                `<p>请你根据你的直觉判断，对它们可能<strong>消耗精神力量的多少</strong>进行<strong>由低到高</strong>的排序。</p>`
            ],
            check_q1: "1. 在这个任务中，你需要做什么？",
            check_q2: "2. 排序的顺序是什么？",
            ranking_instruction: "请将下列项目拖拽到下方排序栏中，进行<strong>由低到高</strong>排序（左侧消耗最低，右侧消耗最高）。",
            items: ['color', 'stone', 'big', 'transform', 'cease', 'conjure', 'split']
        }
    }
};

// A pre-generated trial order (for roles) satisfying Latin Square and no-repeat constraints.
// This order will be used for EACH block.
const exp1TrialOrder = [
    'zaff1', 'nonzaff4', 'zaff2', 'zaff3',
    'nonzaff4', 'zaff1', 'zaff3', 'zaff2',
    'zaff2', 'zaff3', 'nonzaff4', 'zaff1',
    'zaff3', 'zaff2', 'zaff1', 'nonzaff4'
];

function getStimulusRoleMapping(blockName, nonzaffCondition) {
    // Special outcome rules for physical condition's block2
    if (participantData.condition === 'physical' && blockName === 'block2') {
        const block2Types = ['ff', 'fs', 'sf', 'ss_block2'];
        const oppositeMap = { 'ff': 'ss_block2', 'ss_block2': 'ff', 'fs': 'sf', 'sf': 'fs' };
        
        let nonzaffType;
        if (nonzaffCondition === 1) nonzaffType = block2Types[3];      // ss_block2
        else if (nonzaffCondition === 2) nonzaffType = block2Types[0]; // ff
        else if (nonzaffCondition === 3) nonzaffType = block2Types[1]; // fs
        else if (nonzaffCondition === 4) nonzaffType = block2Types[2]; // sf

        const zaffTypes = block2Types.filter(t => t !== nonzaffType);
        const zaff1Type = oppositeMap[nonzaffType];
        const remainingZaffTypes = zaffTypes.filter(t => t !== zaff1Type);

        return {
            'nonzaff4': { type: nonzaffType, outcome: 2 },  // Gain 2
            'zaff1':    { type: zaff1Type, outcome: -1 }, // Lose 1
            'zaff2':    { type: remainingZaffTypes[0], outcome: -1 }, // Lose 1
            'zaff3':    { type: remainingZaffTypes[1], outcome: -1 }  // Lose 1
        };
    }
    
    // Original logic for all other cases (contextual condition, and physical's block1)
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

    return {
        'nonzaff4': { type: nonzaffType, outcome: -2 }, // Original outcome
        'zaff1':    { type: zaff1Type, outcome: 1 },     // Original outcome
        'zaff2':    { type: remainingZaffTypes[0], outcome: 1 }, // Original outcome
        'zaff3':    { type: remainingZaffTypes[1], outcome: 1 }  // Original outcome
    };
}


function generateTrialList() {
    const mainCondition = participantData.condition;
    const blockOrder = participantData.block_order;
    const nonzaffCondition = participantData.nonzaff_condition;
    
    generatedExp1Trials = []; // Clear previous trials

    // Iterate through the determined block order
    blockOrder.forEach(blockName => {
        const roleMapping = getStimulusRoleMapping(blockName, nonzaffCondition);
        const stimuliForBlock = conditionConfig[mainCondition].exp1.stimuli[blockName];

        // Create a copy of image paths for this block to consume
        const sequentialImages = {};
        for (const key in stimuliForBlock) {
            sequentialImages[key] = [...stimuliForBlock[key].images];
        }

        const blockTrials = exp1TrialOrder.map(role => {
            const mapping = roleMapping[role];
            const stimulusType = mapping.type;
            const outcome = mapping.outcome;
            const imagePath = sequentialImages[stimulusType].shift();

            if (!imagePath) {
                console.error(`Ran out of images for stimulus type: ${stimulusType} in block: ${blockName}`);
            }

            return {
                block: blockName,
                stimulus_role: role, // e.g., zaff1, nonzaff4
                stimulus_type: stimulusType, // e.g., hh, ss
                imagePath: imagePath,
                outcome: outcome
            };
        });
        generatedExp1Trials.push(...blockTrials);
    });

    logEvent('Exp1 Trial List Generated', { 
        count: generatedExp1Trials.length, 
        condition: mainCondition,
        block_order: blockOrder,
        nonzaff_condition: nonzaffCondition
    });
}


// --- DOM ELEMENTS ---
const pages = document.querySelectorAll('.page');
const coinCountEl = document.getElementById('coin-count');
const stimulusContainer = document.getElementById('stimulus-container');
const choiceButtons = document.getElementById('choice-buttons');
const nextTrialContainer = document.getElementById('next-trial-container');
const nextTrialBtn = document.getElementById('next-trial-btn');
let currentlyDragged = null; // 用于跟踪当前拖拽的元素
let dataDownloaded = false;

// === 获取 Audio 元素 ===
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
    // console.log(`LOG: ${eventName}`, logEntry); // For debugging
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
    }, 1000 / 120); // ~120Hz
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

    // --- CONDITION ASSIGNMENT ---
    const conditions = ['physical', 'contextual'];
    participantData.condition = conditions[Math.floor(Math.random() * conditions.length)];
    logEvent('Main Condition Assigned', { condition: participantData.condition });

    const blockOrders = [['block1', 'block2'], ['block2', 'block1']];
    participantData.block_order = blockOrders[Math.floor(Math.random() * blockOrders.length)];
    logEvent('Block Order Assigned', { order: participantData.block_order });
    
    participantData.nonzaff_condition = Math.floor(Math.random() * 4) + 1; // Random integer from 1 to 4
    logEvent('Nonzaff Condition Assigned', { nonzaff: participantData.nonzaff_condition });
    // --- END CONDITION ASSIGNMENT ---

    logEvent('Experiment Start');
    generateTrialList(); // Generate trials after all conditions are set
    startMouseTracking();
    showPage('page-consent');
});

// --- PAGE 2: CONSENT ---
const consentCheckbox = document.getElementById('consent-checkbox');
const consentBtn = document.getElementById('consent-btn');
consentCheckbox.addEventListener('change', () => {
    consentBtn.disabled = !consentCheckbox.checked;
});

// Logic to show correct instructions AND set initial coins for the FIRST block
function showFirstBlockInstructions() {
    const condition = participantData.condition;
    const firstBlock = participantData.block_order[0];
    let instructions;

    if (condition === 'physical') {
        if (firstBlock === 'block2') {
            coins = 8; // Set initial coins for block2
            instructions = conditionConfig.physical.exp1.instructions_block2;
            document.getElementById('exp1-summary').textContent = "摘要：接近可能获得2或失去1硬币，远离无变化。目标：获得尽可能多的硬币";
        } else { // firstBlock is 'block1'
            coins = 4; // Set initial coins for block1
            instructions = conditionConfig.physical.exp1.instructions;
            document.getElementById('exp1-summary').textContent = "摘要：接近可能获得1或失去2硬币，远离无变化。目标：获得尽可能多的硬币";
        }
    } else { // contextual condition
        coins = 4; // Set initial coins for the whole experiment
        instructions = conditionConfig.contextual.exp1.instructions;
        document.getElementById('exp1-summary').textContent = conditionConfig.contextual.exp1.summary;
    }
    
    coinCountEl.textContent = coins; // Update UI with the correct starting coins
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
    // Load conditional content for Exp1 Check
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

    // Correct answer for coins depends on which block is FIRST
    let correctCoinAnswer = '4'; // Default for contextual and physical block1
    if (participantData.condition === 'physical' && participantData.block_order[0] === 'block2') {
        correctCoinAnswer = '8';
    }

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
        logEvent('Exp1 Comprehension Check Failed');
        setTimeout(() => {
            errorEl.classList.add('hidden');
            showFirstBlockInstructions(); // Go back to the correct first block instructions
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

    logEvent('Stimulus Presented', { trial: trialData.trial_index, stimulus_type: currentTrial.stimulus_type, image: currentTrial.imagePath });

    const handleChoice = (choice) => {
        document.getElementById('approach-btn').removeEventListener('click', approachHandler);
        document.getElementById('avoid-btn').removeEventListener('click', avoidHandler);

        trialData.choice = choice;
        trialData.rt = performance.now() - trialData.start_time;
        choiceButtons.classList.add('hidden');
        let outcome = 0;
        let feedbackText = ''; // 纯文本反馈（用于“中立”情况）

        if (choice === 'approach') {
            outcome = currentTrial.outcome;
            coins += outcome;
            if (outcome > 0) {
                 feedbackText = `你获得了 ${outcome} 个硬币`; // 备用
            } else {
                 feedbackText = `你失去了 ${-outcome} 个硬币`; // 备用
            }
        } else { // 'avoid'
            feedbackText = '你的硬币没有变化';
        }

        trialData.outcome = outcome;
        trialData.coins_after = coins;
        participantData.exp1.trials.push(trialData);
        logEvent('Decision Made', trialData);

        coinCountEl.textContent = coins;
        
        // === 播放声音和动画 (使用 .load() 修复) ===
        if (gainSound) gainSound.load();
        if (loseSound) loseSound.load();
        if (neutralSound) neutralSound.load();

        if (choice === 'avoid') {
            stimulusContainer.innerHTML = `<div class="feedback-animation neutral">${feedbackText}</div>`;
            if (neutralSound) neutralSound.play().catch(e => console.warn("中立音频播放失败", e));
        } else if (outcome > 0) {
            stimulusContainer.innerHTML = `<div class="feedback-animation gain">+${outcome} 🪙</div>`;
            if (gainSound) gainSound.play().catch(e => console.warn("增益音频播放失败", e));
        } else { // outcome <= 0
            stimulusContainer.innerHTML = `<div class="feedback-animation lose">-${-outcome} 🪙</div>`;
            if (loseSound) loseSound.play().catch(e => console.warn("损失音频播放失败", e));
        }
        // === 结束修改 ===

        setTimeout(() => {
            stimulusContainer.innerHTML = ''; // 清除反馈
            // 检查是否在实验中途休息
            if (exp1TrialIndex === TOTAL_TRIALS_PER_BLOCK - 1) {
                logEvent('Experiment 1 First Block Ended');
                if (participantData.condition === 'contextual') {
                    showPage('page-exp1-mid-break'); // contextual 的原始休息页面
                } else {
                    // 对于 physical 条件，显示下一个 block 的指导语
                    const secondBlock = participantData.block_order[1];
                    let instructions;
                    if (secondBlock === 'block2') {
                        instructions = conditionConfig.physical.exp1.instructions_block2;
                    } else { // second block is block1
                        instructions = conditionConfig.physical.exp1.instructions;
                    }
                    document.getElementById('exp1-b2-instructions-content').innerHTML = instructions.join('');
                    showPage('page-exp1-b2-instructions');
                }
            } else {
                 nextTrialContainer.classList.remove('hidden');
            }
        }, 1000); // 动画和声音的持续时间（1秒）
    };

    const approachHandler = () => handleChoice('approach');
    const avoidHandler = () => handleChoice('avoid');

    document.getElementById('approach-btn').addEventListener('click', approachHandler);
    document.getElementById('avoid-btn').addEventListener('click', avoidHandler);
}

function endExp1() {
    logEvent('Experiment 1 Ended');
    participantData.exp1.finalCoins = coins;
    document.getElementById('final-coin-count').textContent = coins;
    showPage('page-exp1-break');
}

// --- PAGE: EXP 1 MID-BLOCK BREAKS ---
// 这个按钮用于 contextual 条件的简单休息
document.getElementById('to-next-block-btn').addEventListener('click', () => {
    showPage('page-exp1-formal');
    nextTrialContainer.classList.add('hidden');
    exp1TrialIndex++;
    runExp1Trial();
});

// 这个按钮用于 physical 条件的休息，并为下一个 block 重置硬币
document.getElementById('to-next-block-btn-b2').addEventListener('click', () => {
    const secondBlock = participantData.block_order[1];
    
    // 根据下一个 block 重置硬币和更新摘要文本
    if (secondBlock === 'block2') {
        coins = 8;
        document.getElementById('exp1-summary').textContent = "摘要：接近可能获得2或失去1硬币，远离无变化。目标：获得尽可能多的硬币";
    } else { // second block is block1
        coins = 4;
        document.getElementById('exp1-summary').textContent = "摘要：接近可能获得1或失去2硬币，远离无变化。目标：获得尽可能多的硬币";
    }
    coinCountEl.textContent = coins; // 更新 UI 上的硬币数量

    showPage('page-exp1-formal');
    nextTrialContainer.classList.add('hidden');
    exp1TrialIndex++;
    runExp1Trial();
});


// --- PAGE 6: EXP 1 BREAK ---
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
// === 修改：更新了实验二的正确答案 ===
document.getElementById('exp2-check-btn').addEventListener('click', () => {
    const q1 = document.querySelector('input[name="q2-1"]:checked')?.value;
    const q2 = document.querySelector('input[name="q2-2"]:checked')?.value;
    const errorEl = document.getElementById('exp2-check-error');

    // 正确答案: q1='b' (排序), q2='a' (从少到多)
    if (q1 === 'b' && q2 === 'a') {
        errorEl.classList.add('hidden');
        logEvent('Exp2 Comprehension Check Passed');
        showPage('page-exp2-formal');
        setupExp2();
    } else {
        errorEl.classList.remove('hidden');
        logEvent('Exp2 Comprehension Check Failed');
        setTimeout(() => {
            errorEl.classList.add('hidden');
            const condition = participantData.condition;
            const instructions = conditionConfig[condition].exp2.instructions;
            document.getElementById('exp2-instructions-content').innerHTML = instructions.join('');
            showPage('page-exp2-instructions');
        }, 2000);
    }
});
// === 结束修改 ===


// --- PAGE 9: EXP 2 FORMAL ---
function setupExp2() {
    const condition = participantData.condition;
    const exp2ItemIds = conditionConfig[condition].exp2.items; 
    const sourceContainer = document.getElementById('exp2-source-container');
    const rankingBar = document.getElementById('exp2-ranking-bar');
    
    const imgPath = condition === 'physical' ? './stimuli/exp2_phy/' : './stimuli/exp2_emo/';

    sourceContainer.innerHTML = '';
    rankingBar.innerHTML = '';
    document.getElementById('exp2-ranking-instruction').innerHTML = conditionConfig[condition].exp2.ranking_instruction;

    const shuffledItems = [...exp2ItemIds].sort(() => Math.random() - 0.5);

    // 1. 填充源容器 (顶部)
    shuffledItems.forEach(itemId => {
        const slotEl = document.createElement('div');
        slotEl.className = 'exp2-item-slot drop-zone'; // 也是一个 drop-zone，用于放回
        
        const imgEl = document.createElement('img');
        imgEl.id = `item-${itemId}`; // 保持 ID 格式
        imgEl.src = `${imgPath}${itemId}.png`;
        imgEl.className = 'exp2-draggable-img';
        imgEl.draggable = true;
        imgEl.dataset.itemId = itemId; // 存储原始 ID 用于保存数据

        slotEl.appendChild(imgEl);
        sourceContainer.appendChild(slotEl);
    });

    // 2. 填充排序栏 (底部)
    for (let i = 1; i <= 7; i++) {
        const zone = document.createElement('div');
        zone.className = 'exp2-item-slot drop-zone'; // 这是一个 drop-zone
        zone.dataset.rank = i;
        rankingBar.appendChild(zone);
    }

    addDragAndDropListeners();
}

function addDragAndDropListeners() {
    const draggables = document.querySelectorAll('.exp2-draggable-img');
    const dropZones = document.querySelectorAll('.drop-zone'); // 获取所有 14 个格子
    currentlyDragged = null;

    draggables.forEach(draggable => {
        draggable.addEventListener('dragstart', (e) => {
            draggable.classList.add('dragging');
            currentlyDragged = draggable;
            logEvent('Exp2 Drag Start', { itemId: draggable.dataset.itemId });
        });
        
        draggable.addEventListener('dragend', () => {
            draggable.classList.remove('dragging');
            logEvent('Exp2 Drag End', { itemId: currentlyDragged.dataset.itemId });
            currentlyDragged = null;
        });
    });

    dropZones.forEach(zone => {
        zone.addEventListener('dragover', e => {
            e.preventDefault();
            zone.classList.add('over');
        });

        zone.addEventListener('dragleave', () => {
            zone.classList.remove('over');
        });

        zone.addEventListener('drop', e => {
            e.preventDefault();
            e.stopPropagation(); // 阻止事件冒泡到父元素
            zone.classList.remove('over');

            if (!currentlyDragged) return;

            const existingItem = zone.querySelector('.exp2-draggable-img');
            const sourceOfDrag = currentlyDragged.parentElement; // 拖拽源的格子

            if (existingItem && existingItem !== currentlyDragged) {
                // --- 交换 (Swap) 逻辑 ---
                // 1. 将目标格 (zone) 里的现有图片 (existingItem) 移动到拖拽源的格子 (sourceOfDrag)
                sourceOfDrag.appendChild(existingItem);
                // 2. 将正在拖拽的图片 (currentlyDragged) 放入目标格 (zone)
                zone.appendChild(currentlyDragged);
            } else if (!existingItem) {
                // --- 简单放置 (Drop) 逻辑 ---
                // 目标格是空的，直接放入
                zone.appendChild(currentlyDragged);
            }
            // else: 拖拽到自己原来的格子上，什么也不做
        });
    });
}


document.getElementById('confirm-ranking-btn').addEventListener('click', () => {
    const rankedItems = [];
    // 只选择底部的排序栏
    const dropZones = document.querySelectorAll('#exp2-ranking-bar .drop-zone');
    let allRanked = true;

    dropZones.forEach(zone => {
        const item = zone.querySelector('.exp2-draggable-img');
        if (item) {
            rankedItems.push({
                rank: parseInt(zone.dataset.rank),
                itemId: item.dataset.itemId, // 从 data-item-id 获取
            });
        } else {
            allRanked = false;
        }
    });

    if (!allRanked) {
        alert('请将所有项目都排序到下方的排序栏中。');
        return;
    }

    participantData.exp2.ranking = rankedItems;
    logEvent('Exp2 Ranking Confirmed', { ranking: rankedItems });
    endExperiment();
});

nextTrialBtn.addEventListener('click', () => {
    nextTrialContainer.classList.add('hidden');
    exp1TrialIndex++;
    runExp1Trial();
});


// --- PAGE 10: END ---
function convertJsonToCsv(data) {
    const escapeCsvCell = (cell) => {
        if (cell === null || cell === undefined) {
            return '';
        }
        if (Array.isArray(cell)) {
            return `"${cell.join('-')}"`;
        }
        const str = String(cell);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    let csvContent = "";

    // Section 1: Participant Info
    csvContent += "# PARTICIPANT INFO\r\n";
    const infoHeaders = ['id', 'age', 'gender', "handedness", 'condition', 'block_order', 'nonzaff_condition', 'startTime', 'endTime', 'finalCoins_exp1'];
    const infoValues = [data.id, data.age, data.gender, data.handedness, data.condition, data.block_order, data.nonzaff_condition, data.startTime, data.endTime, data.exp1.finalCoins];
    csvContent += infoHeaders.join(',') + "\r\n";
    csvContent += infoValues.map(escapeCsvCell).join(',') + "\r\n";

    // Section 2: Experiment 1 Trials
    if (data.exp1 && data.exp1.trials.length > 0) {
        csvContent += "\r\n# EXPERIMENT 1 TRIALS\r\n";
        const exp1Headers = Object.keys(data.exp1.trials[0]);
        csvContent += exp1Headers.join(',') + "\r\n";
        data.exp1.trials.forEach(row => {
            const rowValues = exp1Headers.map(header => row[header]);
            csvContent += rowValues.map(escapeCsvCell).join(',') + "\r\n";
        });
    }

    // Section 3: Experiment 2 Ranking
    if (data.exp2 && data.exp2.ranking.length > 0) {
        csvContent += "\r\n# EXPERIMENT 2 RANKING\r\n";
        const exp2Headers = Object.keys(data.exp2.ranking[0]);
        csvContent += exp2Headers.join(',') + "\r\n";
        data.exp2.ranking.forEach(row => {
            const rowValues = exp2Headers.map(header => row[header]);
            csvContent += rowValues.map(escapeCsvCell).join(',') + "\r\n";
        });
    }

    // Section 4: Event Log
    if (data.log && data.log.length > 0) {
        csvContent += "\r\n# EVENT LOG\r\n";
        const logHeaders = ['event', 'timestamp', 'page', 'details'];
        csvContent += logHeaders.join(',') + "\r\n";
        data.log.forEach(row => {
            const detailsStr = JSON.stringify(row.details);
            const rowValues = [row.event, row.timestamp, row.page, detailsStr];
            csvContent += rowValues.map(escapeCsvCell).join(',') + "\r\n";
        });
    }

    // Section 5: Mouse Trajectory
    if (data.mouseTrajectory && data.mouseTrajectory.length > 0) {
        csvContent += "\r\n# MOUSE TRAJECTORY\r\n";
        const mouseHeaders = Object.keys(data.mouseTrajectory[0]);
        csvContent += mouseHeaders.join(',') + "\r\n";
        data.mouseTrajectory.forEach(row => {
            const rowValues = mouseHeaders.map(header => row[header]);
            csvContent += rowValues.map(escapeCsvCell).join(',') + "\r\n";
        });
    }

    return csvContent;
}

function downloadData() {
    if (dataDownloaded) return; 
    dataDownloaded = true;

    const participantId = participantData.id || 'unknown_id';
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
    URL.revokeObjectURL(downloadLink.href);

    logEvent('Data Downloaded');

    const downloadBtn = document.getElementById('download-data-btn');
    if (downloadBtn) {
        downloadBtn.textContent = '数据已下载';
        downloadBtn.disabled = true;
    }
}

function endExperiment() {
    stopMouseTracking();
    participantData.endTime = performance.now();
    logEvent('Experiment End');
    showPage('page-end');

    console.log("--- 最终被试数据 ---");
    console.log(JSON.stringify(participantData, null, 2));
    document.getElementById('final-data-display').textContent = JSON.stringify(participantData, null, 2);
    document.getElementById('final-data-display').parentElement.classList.remove('hidden');

    document.getElementById('download-data-btn').addEventListener('click', downloadData);
    const downloadKeyListener = (e) => {
        if (e.key !== 'm' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'SELECT') {
            downloadData();
            window.removeEventListener('keydown', downloadKeyListener);
        }
    };
    window.addEventListener('keydown', downloadKeyListener);
}

// --- DEBUG MODE ---
function setupDebugMode() {
    const debugMenu = document.getElementById('debug-menu');
    const debugPageList = document.getElementById('debug-page-list');
    if (!debugMenu || !debugPageList) return;

    // Clear existing content and add condition selectors
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
            // Set conditions from debug menu before jumping
            const selectedCondition = document.getElementById('debug-condition-select').value;
            const selectedBlockOrderStr = document.getElementById('debug-block-order-select').value;
            const selectedNonzaff = parseInt(document.getElementById('debug-nonzaff-select').value, 10);
            
            if (!participantData.startTime) {
                participantData.id = 'debug_user';
                participantData.age = 99;
                participantData.gender = 'other';
                participantData.startTime = performance.now();
                startMouseTracking();
                logEvent('Experiment Start (Debug)');
            }

            participantData.condition = selectedCondition;
            participantData.block_order = selectedBlockOrderStr.split(',');
            participantData.nonzaff_condition = selectedNonzaff;
            
            logEvent('Conditions Set (Debug)', { 
                condition: participantData.condition,
                block_order: participantData.block_order,
                nonzaff_condition: participantData.nonzaff_condition
            });
            
            generateTrialList();

            // Trigger the same content-loading logic as the real flow
            if (page.id === 'page-exp1-instructions') {
                showFirstBlockInstructions(); // This will correctly set coins and show instructions based on debug settings
            } else if (page.id === 'page-exp1-check') {
                // We need to set the coin value correctly for the check page
                if (participantData.condition === 'physical' && participantData.block_order[0] === 'block2') {
                    coins = 8;
                } else {
                    coins = 4;
                }
                coinCountEl.textContent = coins;
                document.getElementById('exp1-q1-text').textContent = conditionConfig[selectedCondition].exp1.check_q1;
                document.getElementById('exp1-q2-text').textContent = conditionConfig[selectedCondition].exp1.check_q2;
                document.getElementById('exp1-q3-text').textContent = conditionConfig[selectedCondition].exp1.check_q3;
                 showPage(pageId);
            } else if (pageId === 'page-exp1-formal') {
                 // Set initial coins and summary before starting the trial run
                if(exp1TrialIndex === 0) {
                    const firstBlock = participantData.block_order[0];
                     if (participantData.condition === 'physical') {
                        if (firstBlock === 'block2') {
                            coins = 8;
                            document.getElementById('exp1-summary').textContent = "摘要：接近可能获得2或失去1硬币，远离无变化。目标：获得尽可能多的硬币";
                        } else {
                            coins = 4;
                            document.getElementById('exp1-summary').textContent = "摘要：接近可能获得1或失去2硬币，远离无变化。目标：获得尽可能多的硬币";
                        }
                    } else {
                        coins = 4;
                        document.getElementById('exp1-summary').textContent = conditionConfig.contextual.exp1.summary;
                    }
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
                // 强制重新设置实验二
                setupExp2();
                showPage(pageId);
            } else {
                 showPage(pageId);
            }
            
            debugMenu.classList.add('hidden');
        });
        debugPageList.appendChild(button);
    });

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
    participantData.log.push({ event: 'Script Loaded', timestamp: performance.now(), page: 'N-A' });
    showPage('page-demographics');
    setupDebugMode();
};