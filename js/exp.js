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
        block1Coins: 0, // Store Block 1 score separately
        block2Coins: 0  // Store Block 2 score separately
    },
    exp2: {
        ratings: [], // Changed from ranking to ratings
    },
    mouseTrajectory: []
};
let mouseTrackerInterval;
let lastMousePosition = { x: 0, y: 0 };
let coins = 4; // Current block coin count
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
                `<p>以 <strong>"Big" (变大)</strong> 为基准，它的魔力消耗为 <strong>10分</strong>。</p>`,
                `<p>请你根据你的直觉，参照这个基准，对其他方式可能<strong>消耗心灵魔力的多少</strong>进行打分（0-100分）。</p>`
            ],
            check_q1: "1. 在这个任务中，你需要做什么？",
            check_q2: "2. 基准“Big”的分数是多少？",
            rating_instruction: "请以 <strong>Big (10分)</strong> 为基准，拖动滑块对其他项目消耗的魔力进行打分（0-100）。",
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
            instructions_block2: [ // Instructions for Block 2 (Updated: Unified rules)
                `<p>接下来你将看到一些神秘的方块，你需要选择<strong>接近</strong>或是<strong>远离</strong>它们。</p>`,
                `<p>在这个部分开始时，你的硬币数量重置为<strong>4枚</strong>。</p>`,
                `<p>如果你选择<strong>接近</strong>，你可能得到<strong>一枚</strong>硬币或失去<strong>两枚</strong>硬币。</p>`,
                `<p>如果你选择<strong>远离</strong>，你的硬币数量仍然没有任何变化。</p>`,
                `<p>你的目标是在结束时获得<strong>尽可能多</strong>的硬币。</p>`,
                `<p><strong>注意：</strong>两部分的图形有所变化，请重新探索规律。</p>`
            ],
            check_q1: "1. 在这个部分开始时，你有多少硬币？",
            check_q2: "2. 如果你选择“远离”，你的硬币会发生什么变化？",
            check_q3: "3. 你的目标是什么？",
            summary: "摘要：接近可能获得1或失去2硬币，远离无变化。目标：获得尽可能多的硬币",
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
                `<p>以 <strong>"Big" (变大)</strong> 为基准，它的魔力消耗为 <strong>10分</strong>。</p>`,
                `<p>请你根据你的直觉，参照这个基准，对其他方式可能<strong>消耗魔力的多少</strong>进行打分（0-100分）。</p>`
            ],
            check_q1: "1. 在这个任务中，你需要做什么？",
            check_q2: "2. 基准“Big”的分数是多少？",
            rating_instruction: "请以 <strong>Big (10分)</strong> 为基准，拖动滑块对其他项目消耗的魔力进行打分（0-100）。",
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
    // Revised Logic: Unified -2 / +1 rules for both blocks and conditions.
    
    const block1Types = ['hh', 'hs', 'sh', 'ss'];
    const block2Types = ['ff', 'fs', 'sf', 'ss_block2'];
    
    // Mappings for opposite types (still used for role assignment logic)
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

    // Unified outcomes: Non-zaff = -2, Zaff = +1
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

    // Unified logic: Always 4 coins, standard rules for both conditions/blocks initially
    if (condition === 'physical') {
        if (firstBlock === 'block2') {
            instructions = conditionConfig.physical.exp1.instructions_block2; 
            // Note: instructions_block2 logic adjusted in config to reflect 4 coins
        } else { 
            instructions = conditionConfig.physical.exp1.instructions;
        }
    } else { 
        instructions = conditionConfig.contextual.exp1.instructions;
    }
    
    // Unified text for summary
    document.getElementById('exp1-summary').textContent = conditionConfig[condition].exp1.summary;
    
    coins = 4; // Always start Block 1 with 4 coins
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

    // Correct answer for coins is always '4' now
    let correctCoinAnswer = '4'; 

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
        let feedbackText = ''; 

        if (choice === 'approach') {
            outcome = currentTrial.outcome;
            coins += outcome;
            if (outcome > 0) {
                 feedbackText = `你获得了 ${outcome} 个硬币`; 
            } else {
                 feedbackText = `你失去了 ${-outcome} 个硬币`; 
            }
        } else { // 'avoid'
            feedbackText = '你的硬币没有变化';
        }

        trialData.outcome = outcome;
        trialData.coins_after = coins;
        participantData.exp1.trials.push(trialData);
        logEvent('Decision Made', trialData);

        coinCountEl.textContent = coins;
        
        // === 播放声音和动画 ===
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
            
            // 检查是否在实验中途休息 (End of Block 1)
            if (exp1TrialIndex === TOTAL_TRIALS_PER_BLOCK - 1) {
                // Save Block 1 score
                participantData.exp1.block1Coins = coins;
                logEvent('Experiment 1 First Block Ended', { score: coins });
                
                // Show mid-break page with feedback
                document.getElementById('block1-score').textContent = coins;
                
                // Prepare for next block - Standardized transition
                const secondBlock = participantData.block_order[1];
                let instructions;
                if (participantData.condition === 'physical') {
                    if (secondBlock === 'block2') {
                         instructions = conditionConfig.physical.exp1.instructions_block2;
                    } else {
                         instructions = conditionConfig.physical.exp1.instructions;
                    }
                } else {
                    // For contextual, just reuse generic instructions or a simple prompt
                    // Contextual doesn't have explicit 'block2' instructions in original config, using generic logic
                    instructions = [`<p>接下来是第二部分，规则可能稍有变化。你的硬币将重置为4枚。</p>`];
                }
                
                // We populate the 'next block instruction' page, but show mid-break first
                document.getElementById('exp1-b2-instructions-content').innerHTML = instructions.join('');
                
                // Important: Don't reset coins here yet, do it when they click "Continue"
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
    logEvent('Experiment 1 Ended');
    participantData.exp1.block2Coins = coins; // Save Block 2 score
    document.getElementById('block2-score').textContent = coins;
    showPage('page-exp1-break');
}

// --- PAGE: EXP 1 MID-BLOCK BREAKS ---
// 从“第一部分已完成”页面 -> “第二部分指导语”页面 (或直接开始)
document.getElementById('to-next-block-btn').addEventListener('click', () => {
    // 如果是 Physical 条件，展示具体的 Block 2 指导语页面
    if (participantData.condition === 'physical') {
        showPage('page-exp1-b2-instructions');
    } else {
        // Contextual 条件直接重置并开始（模拟点击了B2的开始按钮）
        startBlock2();
    }
});

// 从“第二部分指导语”页面 -> 正式开始
document.getElementById('to-next-block-btn-b2').addEventListener('click', () => {
    startBlock2();
});

function startBlock2() {
    // Reset coins for Block 2
    coins = 4;
    coinCountEl.textContent = coins;
    document.getElementById('exp1-summary').textContent = "摘要：接近可能获得1或失去2硬币，远离无变化。";

    showPage('page-exp1-formal');
    nextTrialContainer.classList.add('hidden');
    exp1TrialIndex++;
    runExp1Trial();
}


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
// === 修改：更新了实验二的正确答案 (Rating Task) ===
document.getElementById('exp2-check-btn').addEventListener('click', () => {
    const q1 = document.querySelector('input[name="q2-1"]:checked')?.value;
    const q2 = document.querySelector('input[name="q2-2"]:checked')?.value;
    const errorEl = document.getElementById('exp2-check-error');

    // 正确答案: q1='a' (big为基准打分), q2='c' (10分)
    if (q1 === 'a' && q2 === 'c') {
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
// === 修改：实验二逻辑改为 Rating (打分) ===
function setupExp2() {
    const condition = participantData.condition;
    const exp2ItemIds = conditionConfig[condition].exp2.items; 
    const ratingContainer = document.getElementById('exp2-rating-container');
    
    const imgPath = condition === 'physical' ? './stimuli/exp2_phy/' : './stimuli/exp2_emo/';

    ratingContainer.innerHTML = '';
    document.getElementById('exp2-rating-instruction').innerHTML = conditionConfig[condition].exp2.rating_instruction;

    // 先将 'big' 移到列表最前面，以便作为直观的基准
    const items = [...exp2ItemIds];
    const bigIndex = items.indexOf('big');
    if (bigIndex > -1) {
        items.splice(bigIndex, 1);
        items.unshift('big');
    }

    items.forEach(itemId => {
        const isBenchmark = itemId === 'big';
        
        const row = document.createElement('div');
        row.className = 'rating-row';
        
        // 左侧：刺激呈现 (图片或文字，这里假设仍是图片，如需纯文字可修改)
        const colStimulus = document.createElement('div');
        colStimulus.className = 'stimulus-col';
        const img = document.createElement('img');
        img.src = `${imgPath}${itemId}.png`;
        img.className = 'stimulus-img';
        colStimulus.appendChild(img);
        
        // 右侧：滑块
        const colSlider = document.createElement('div');
        colSlider.className = 'slider-col';
        
        const sliderWrapper = document.createElement('div');
        sliderWrapper.className = 'w-full flex items-center gap-4';

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = 0;
        slider.max = 100;
        slider.className = 'w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer';
        slider.dataset.itemId = itemId;

        const valDisplay = document.createElement('span');
        valDisplay.className = 'slider-val';
        
        if (isBenchmark) {
            slider.value = 10;
            slider.disabled = true;
            valDisplay.textContent = "10";
            
            const label = document.createElement('span');
            label.className = 'text-xs font-bold text-red-500 uppercase mb-1';
            label.textContent = "基准 (Benchmark)";
            colSlider.appendChild(label);
        } else {
            slider.value = 0; // Default start
            valDisplay.textContent = "0";
            
            slider.addEventListener('input', (e) => {
                valDisplay.textContent = e.target.value;
            });
        }

        sliderWrapper.appendChild(slider);
        sliderWrapper.appendChild(valDisplay);
        colSlider.appendChild(sliderWrapper);
        
        row.appendChild(colStimulus);
        row.appendChild(colSlider);
        ratingContainer.appendChild(row);
    });
}

// 确认打分按钮逻辑
document.getElementById('confirm-rating-btn').addEventListener('click', () => {
    const ratings = [];
    const sliders = document.querySelectorAll('input[type=range]');
    
    // 简单验证：虽然默认是0，但为了防止被试完全没动（除非真的认为是0），通常可以加个检查。
    // 鉴于题目是0-100，0也是有效分，这里不做强制移动检查，直接收集数据。

    sliders.forEach(slider => {
        ratings.push({
            itemId: slider.dataset.itemId,
            rating: parseInt(slider.value, 10)
        });
    });

    // 1. 保存实验二数据
    participantData.exp2.ratings = ratings;
    logEvent('Exp2 Ratings Confirmed', { ratings: ratings });

    // 2. 停止追踪并记录结束时间
    stopMouseTracking();
    participantData.endTime = performance.now();
    logEvent('Experiment End');

    // 3. 自动下载数据
    downloadData();

    // 4. 显示结束页面
    showPage('page-end');

    // 5. 隐藏结束页面上的下载相关元素
    const downloadBtn = document.getElementById('download-data-btn');
    if (downloadBtn) {
        downloadBtn.classList.add('hidden');
    }
    const endPage = document.getElementById('page-end');
    const paragraphs = endPage.querySelectorAll('.content-card p');
    paragraphs.forEach(p => {
        if (p.textContent.includes('下载')) { 
            p.classList.add('hidden');
        }
    });

    // 6. 隐藏原始数据显示
    const finalDataDisplay = document.getElementById('final-data-display');
    if (finalDataDisplay && finalDataDisplay.parentElement) {
        finalDataDisplay.parentElement.classList.add('hidden');
    }
    
    console.log("--- 最终被试数据 ---");
    console.log(JSON.stringify(participantData, null, 2));
});
// === 结束修改 ===


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
    // Added block1Coins and block2Coins
    const infoHeaders = ['id', 'age', 'gender', "handedness", 'condition', 'block_order', 'nonzaff_condition', 'startTime', 'endTime', 'exp1_block1_coins', 'exp1_block2_coins'];
    const infoValues = [data.id, data.age, data.gender, data.handedness, data.condition, data.block_order, data.nonzaff_condition, data.startTime, data.endTime, data.exp1.block1Coins, data.exp1.block2Coins];
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

    // Section 3: Experiment 2 Ratings (Changed from Ranking)
    if (data.exp2 && data.exp2.ratings.length > 0) {
        csvContent += "\r\n# EXPERIMENT 2 RATINGS\r\n";
        const exp2Headers = Object.keys(data.exp2.ratings[0]);
        csvContent += exp2Headers.join(',') + "\r\n";
        data.exp2.ratings.forEach(row => {
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
                showFirstBlockInstructions(); 
            } else if (page.id === 'page-exp1-check') {
                // Standard 4 coins for check
                coins = 4;
                coinCountEl.textContent = coins;
                document.getElementById('exp1-q1-text').textContent = conditionConfig[selectedCondition].exp1.check_q1;
                document.getElementById('exp1-q2-text').textContent = conditionConfig[selectedCondition].exp1.check_q2;
                document.getElementById('exp1-q3-text').textContent = conditionConfig[selectedCondition].exp1.check_q3;
                 showPage(pageId);
            } else if (pageId === 'page-exp1-formal') {
                 // Set initial coins and summary before starting the trial run
                if(exp1TrialIndex === 0 || coins === 0) {
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