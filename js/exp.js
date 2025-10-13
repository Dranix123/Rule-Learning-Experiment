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
                `<p>接下来，你将看到十种操纵心灵的方式。</p>`,
                `<p>请你根据你的直觉判断，对它们可能<strong>消耗心灵魔力的多少</strong>进行<strong>由多到少</strong>的排序。</p>`
            ],
            check_q1: "1. 在这个任务中，你需要做什么？",
            check_q2: "2. 排序的顺序是什么？",
            ranking_instruction: "请将下列项目拖拽到右侧方框中，进行<strong>由多到少</strong>排序（1为消耗最多）。",
            items: [
                { id: 'item-Levitate', text: '悬浮：使情绪的攀升过程变缓慢，如狂喜感在数分钟内才达到顶峰。' },
                { id: 'item-Transform', text: '转化：将目标的一种情绪，转化为另一种性质相近的情绪，例如将“惊恐”转为“厌恶”。' },
                { id: 'item-Cease', text: '终止：瞬间中止并清除目标的强烈情绪，使其内心归于虚无。' },
                { id: 'item-Big', text: '放大：将目标的现有情绪放大，例如将“微恼”放大为“暴怒”。' },
                { id: 'item-Conjure', text: '召唤：中性情境下，为目标凭空召唤出强烈而复杂的情绪，如乡愁。' },
                { id: 'item-Split', text: '分裂：使目标对同一事物瞬间产生两种旗鼓相当的情绪，例如对毕业同时感到“悲伤”与“恐惧”。' },
                { id: 'item-Stone', text: '石化：将目标当前情绪固化，使其在一段时间内完全不随外界变化。' },
                { id: 'item-Color', text: '渲染：为目标当前的主要情绪，渲染上一抹细微的额外色彩，如在“开心”中染上“得意”。' },
                { id: 'item-Invisible', text: '隐形：将目标的情绪压入潜意识，使其无法察觉，仍暗中影响行为。' },
                { id: 'item-Teleport', text: '传送：将情绪的触发时刻延后，仿佛将其传送到了未来，例如，十分钟后才感受到本应立即产生的狂喜。' }
            ]
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
                `<p><strong>--- 规则变化 ---</strong></p>`,
                `<p>接下来你将看到一些新的神秘方块。</p>`,
                `<p>在这个部分开始时，你的硬币数量为<strong>8枚</strong>。</p>`,
                `<p>规则有所改变：如果你选择<strong>接近</strong>，你可能得到<strong>两枚</strong>硬币或失去<strong>一枚</strong>硬币。</p>`,
                `<p>如果你选择<strong>远离</strong>，你的硬币数量仍然没有任何变化。</p>`,
                `<p>你的目标仍然是在结束时获得<strong>尽可能多</strong>的硬币。</p>`
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
                `<p>接下来，你将看到十种操纵物质的方式。</p>`,
                `<p>请你根据你的直觉判断，对它们可能<strong>消耗精神力量的多少</strong>进行<strong>由多到少</strong>的排序。</p>`
            ],
            check_q1: "1. 在这个任务中，你需要做什么？",
            check_q2: "2. 排序的顺序是什么？",
            ranking_instruction: "请将下列项目拖拽到右侧方框中，进行<strong>由多到少</strong>排序（1为消耗最多）。",
            items: [
                { id: 'item-Levitate', text: '悬浮' },
                { id: 'item-Transform', text: '转化' },
                { id: 'item-Cease', text: '消失' },
                { id: 'item-Big', text: '放大' },
                { id: 'item-Conjure', text: '召唤' },
                { id: 'item-Split', text: '分裂' },
                { id: 'item-Stone', text: '石化' },
                { id: 'item-Color', text: '渲染' },
                { id: 'item-Invisible', text: '隐形' },
                { id: 'item-Teleport', text: '传送' }
            ]
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
let currentlyDragged = null;
let dataDownloaded = false;


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
    }, 1000 / 100); // ~10Hz
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
        stimulusContainer.innerHTML = `<div class="p-4 text-2xl font-bold">${feedbackText}</div>`;

        setTimeout(() => {
            stimulusContainer.innerHTML = ''; // Clear feedback
            // Check for mid-experiment break
            if (exp1TrialIndex === TOTAL_TRIALS_PER_BLOCK - 1) {
                logEvent('Experiment 1 First Block Ended');
                if (participantData.condition === 'contextual') {
                    showPage('page-exp1-mid-break'); // Original break page for contextual
                } else {
                    // For physical condition, show the instructions for the next block
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
        }, 1000);
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
// This button is for the contextual condition's simple break
document.getElementById('to-next-block-btn').addEventListener('click', () => {
    showPage('page-exp1-formal');
    nextTrialContainer.classList.add('hidden');
    exp1TrialIndex++;
    runExp1Trial();
});

// This button is for the physical condition's break, which also RESETS COINS for the next block
document.getElementById('to-next-block-btn-b2').addEventListener('click', () => {
    const secondBlock = participantData.block_order[1];
    
    // Reset coins and update summary text based on which block is coming next
    if (secondBlock === 'block2') {
        coins = 8;
        document.getElementById('exp1-summary').textContent = "摘要：接近可能获得2或失去1硬币，远离无变化。目标：获得尽可能多的硬币";
    } else { // second block is block1
        coins = 4;
        document.getElementById('exp1-summary').textContent = "摘要：接近可能获得1或失去2硬币，远离无变化。目标：获得尽可能多的硬币";
    }
    coinCountEl.textContent = coins; // Update UI with reset coin value

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
document.getElementById('exp2-check-btn').addEventListener('click', () => {
    const q1 = document.querySelector('input[name="q2-1"]:checked')?.value;
    const q2 = document.querySelector('input[name="q2-2"]:checked')?.value;
    const errorEl = document.getElementById('exp2-check-error');

    if (q1 === 'b' && q2 === 'c') {
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

// --- PAGE 9: EXP 2 FORMAL ---
function setupExp2() {
    const condition = participantData.condition;
    const exp2Items = conditionConfig[condition].exp2.items;
    const draggableContainer = document.getElementById('draggable-container');
    const dropZoneContainer = document.getElementById('drop-zone-container');

    draggableContainer.innerHTML = '';
    dropZoneContainer.innerHTML = '';
    document.getElementById('exp2-ranking-instruction').innerHTML = conditionConfig[condition].exp2.ranking_instruction;

    const shuffledItems = [...exp2Items].sort(() => Math.random() - 0.5);

    shuffledItems.forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.id = item.id;
        itemEl.textContent = item.text;
        itemEl.className = 'draggable-item';
        itemEl.draggable = true;
        draggableContainer.appendChild(itemEl);
    });

    for (let i = 1; i <= 10; i++) {
        const zone = document.createElement('div');
        zone.className = 'drop-zone';
        zone.dataset.rank = i;
        zone.innerHTML = `<span class="font-bold text-base mr-4 text-gray-500 w-8">${i}.</span>`;
        dropZoneContainer.appendChild(zone);
    }

    addDragAndDropListeners();
}

function addDragAndDropListeners() {
    const draggables = document.querySelectorAll('.draggable-item');
    const dropZones = document.querySelectorAll('.drop-zone');

    draggables.forEach(draggable => {
        draggable.addEventListener('dragstart', (e) => {
            draggable.classList.add('dragging');
            currentlyDragged = draggable;
            logEvent('Exp2 Drag Start', { itemId: draggable.id });
        });
        draggable.addEventListener('dragend', () => {
            draggable.classList.remove('dragging');
            logEvent('Exp2 Drag End', { itemId: currentlyDragged.id });
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
            zone.classList.remove('over');

            const existingItem = zone.querySelector('.draggable-item');
            if (existingItem) {
                document.getElementById('draggable-container').appendChild(existingItem);
            }

            if (currentlyDragged) {
                zone.appendChild(currentlyDragged);
            }
        });
    });

    const draggableContainer = document.getElementById('draggable-container');
    draggableContainer.addEventListener('dragover', e => e.preventDefault());
    draggableContainer.addEventListener('drop', e => {
        e.preventDefault();
        if (currentlyDragged) {
            draggableContainer.appendChild(currentlyDragged);
        }
    });
}

document.getElementById('confirm-ranking-btn').addEventListener('click', () => {
    const rankedItems = [];
    const dropZones = document.querySelectorAll('.drop-zone');
    let allRanked = true;

    dropZones.forEach(zone => {
        const item = zone.querySelector('.draggable-item');
        if (item) {
            rankedItems.push({
                rank: parseInt(zone.dataset.rank),
                itemId: item.id,
                text: item.textContent
            });
        } else {
            allRanked = false;
        }
    });

    if (!allRanked) {
        alert('请将所有项目都排序。');
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

    pages.forEach(page => {
        const pageId = page.id;
        const button = document.createElement('button');
        button.textContent = pageId;
        button.className = 'bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-1 px-3 border border-gray-400 rounded shadow w-full text-left';

        button.addEventListener('click', () => {
            if (!participantData.startTime) {
                participantData.id = 'debug_user';
                participantData.age = 99;
                participantData.gender = 'other';
                participantData.startTime = performance.now();
                
                const conditions = ['physical', 'contextual'];
                participantData.condition = conditions[Math.floor(Math.random() * conditions.length)];
                
                const blockOrders = [['block1', 'block2'], ['block2', 'block1']];
                participantData.block_order = blockOrders[Math.floor(Math.random() * blockOrders.length)];
                participantData.nonzaff_condition = Math.floor(Math.random() * 4) + 1;
                logEvent('Conditions Assigned (Debug)', { 
                    condition: participantData.condition,
                    block_order: participantData.block_order,
                    nonzaff_condition: participantData.nonzaff_condition
                });

                generateTrialList();
                logEvent('Experiment Start (Debug)');
                startMouseTracking();
            }
            
            // Trigger the same content-loading logic as the real flow
            if (page.id === 'page-exp1-instructions') {
                showFirstBlockInstructions(); // This will correctly set coins and show instructions
            }
            if (page.id === 'page-exp1-check') {
                const condition = participantData.condition;
                document.getElementById('exp1-q1-text').textContent = conditionConfig[condition].exp1.check_q1;
                document.getElementById('exp1-q2-text').textContent = conditionConfig[condition].exp1.check_q2;
                document.getElementById('exp1-q3-text').textContent = conditionConfig[condition].exp1.check_q3;
            }
            if (pageId === 'page-exp1-formal') {
                 const condition = participantData.condition;
                document.getElementById('approach-btn').textContent = conditionConfig[condition].exp1.approach_btn_text;
                document.getElementById('avoid-btn').textContent = conditionConfig[condition].exp1.avoid_btn_text;
                 // Set initial coins if jumping directly here
                if(exp1TrialIndex === 0) {
                     showFirstBlockInstructions();
                }
                runExp1Trial();
            }
             if (page.id === 'page-exp2-instructions') {
                const condition = participantData.condition;
                const instructions = conditionConfig[condition].exp2.instructions;
                document.getElementById('exp2-instructions-content').innerHTML = instructions.join('');
            }
             if (page.id === 'page-exp2-check') {
                const condition = participantData.condition;
                document.getElementById('exp2-q1-text').textContent = conditionConfig[condition].exp2.check_q1;
                document.getElementById('exp2-q2-text').textContent = conditionConfig[condition].exp2.check_q2;
            }
            if (pageId === 'page-exp2-formal') {
                if (document.getElementById('draggable-container').children.length === 0) {
                    setupExp2();
                }
            }
            showPage(pageId);
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
    participantData.log.push({ event: 'Script Loaded', timestamp: performance.now(), page: 'N/A' });
    showPage('page-demographics');
    setupDebugMode();
};