// --- GLOBAL STATE ---
let currentPage = 'page-demographics';
const participantData = {
    id: null,
    age: null,
    gender: null,
    handedness: null,
    startTime: null,
    endTime: null,
    log: [],
    exp1: {
        trials: [],
        finalCoins: 0
    },
    exp2: {
        ranking: [],
        dragEvents: []
    },
    mouseTrajectory: []
};
let mouseTrackerInterval;
let lastMousePosition = { x: 0, y: 0 };
let coins = 4;
let exp1TrialIndex = 0;
let generatedExp1Trials = [];


// --- EXPERIMENT 1 CONFIG ---
const exp1Stimuli = {
    'zaff1': { type: 'zaff', outcome: 1, images: ['./stimuli/exp1/hh1.png', './stimuli/exp1/hh2.png', './stimuli/exp1/hh3.png', './stimuli/exp1/hh4.png'] },
    'zaff2': { type: 'zaff', outcome: 1, images: ['./stimuli/exp1/sh1.png', './stimuli/exp1/sh2.png', './stimuli/exp1/sh3.png', './stimuli/exp1/sh4.png'] },
    'zaff3': { type: 'zaff', outcome: 1, images: ['./stimuli/exp1/hs1.png', './stimuli/exp1/hs2.png', './stimuli/exp1/hs3.png', './stimuli/exp1/hs4.png'] },
    'nonzaff4': { type: 'nonzaff', outcome: -2, images: ['./stimuli/exp1/ss1.png', './stimuli/exp1/ss2.png', './stimuli/exp1/ss3.png', './stimuli/exp1/ss4.png'] }
};

// A pre-generated trial order satisfying the Latin Square and no-repeat constraints.
const exp1TrialOrder = [
    'zaff1', 'nonzaff4', 'zaff2', 'zaff3',
    'nonzaff4', 'zaff1', 'zaff3', 'zaff2',
    'zaff2', 'zaff3', 'nonzaff4', 'zaff1',
    'zaff3', 'zaff2', 'zaff1', 'nonzaff4'
];

function generateTrialList() {
    // Create shuffled copies of image lists to not modify the original config
    const shuffledImages = {
        zaff1: [...exp1Stimuli.zaff1.images].sort(() => Math.random() - 0.5),
        zaff2: [...exp1Stimuli.zaff2.images].sort(() => Math.random() - 0.5),
        zaff3: [...exp1Stimuli.zaff3.images].sort(() => Math.random() - 0.5),
        nonzaff4: [...exp1Stimuli.nonzaff4.images].sort(() => Math.random() - 0.5)
    };

    generatedExp1Trials = exp1TrialOrder.map(stimulusId => {
        const imagePath = shuffledImages[stimulusId].pop();
        if (!imagePath) {
            console.error(`Ran out of images for stimulus type: ${stimulusId}`);
        }
        return {
            stimulusId: stimulusId,
            imagePath: imagePath
        };
    });
    logEvent('Exp1 Trial List Generated', { count: generatedExp1Trials.length });
}


// --- EXPERIMENT 2 CONFIG ---
const exp2Items = [
    { id: 'item-1', text: '让目标情绪产生的速度变慢，比如原本考试满分立刻感到狂喜，现在得知此消息后在十分钟内慢慢由微弱的开心到大笑再到狂喜（情境完全一样）' },
    { id: 'item-2', text: '在一个强烈的情境下，将个体应有的情绪转为相近而不同的其他情绪，例如由惊恐转为厌恶' },
    { id: 'item-3', text: '在目标正体验一种强烈情绪（如热恋）时，瞬间将其完全清除，使其内心归于绝对的平静。' },
    { id: 'item-4', text: '将目标已有的某种情绪，在性质不变的情况下，等比例增强其强度（例如，将微小的烦躁增强为愤怒）。' },
    { id: 'item-5', text: '在一个完全中性、无任何刺激的情境下，让目标体验到一种强烈的、无缘由的复杂情绪（如乡愁）。' },
    { id: 'item-6', text: '让目标针对同一件事，在同一瞬间体验到两种同样强烈或都较弱的同效价维度情绪（例如，对毕业既感到悲伤又感到愤怒）' },
    { id: 'item-7', text: '在1小时内定格对象的情绪，无论之后情境怎么变，对象的情绪都不会变' },
    { id: 'item-8', text: '在目标现有情绪的基调上，增添一抹细微的“色彩”（例如，在“开心”的情绪上，增添一丝“得意”的感觉）。' },
    { id: 'item-9', text: '强行将目标一种正在体验的情绪转入潜意识，使其意识层面感觉不到，但情绪本身仍对行为产生潜在影响。' },
    { id: 'item-10', text: '让目标的情绪产生的时间间断性延后，比如原本考试满分立刻感到狂喜，现在得知此消息后十分钟后才狂喜（情境完全一致）' }
];

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

    logEvent('Experiment Start');
    startMouseTracking();
    showPage('page-consent');
});

// --- PAGE 2: CONSENT ---
const consentCheckbox = document.getElementById('consent-checkbox');
const consentBtn = document.getElementById('consent-btn');
consentCheckbox.addEventListener('change', () => {
    consentBtn.disabled = !consentCheckbox.checked;
});
consentBtn.addEventListener('click', () => {
    if (consentCheckbox.checked) {
        showPage('page-exp1-instructions');
    }
});

// --- PAGE 3: EXP 1 INSTRUCTIONS ---
document.getElementById('exp1-instr-btn').addEventListener('click', () => {
    showPage('page-exp1-check');
});

// --- PAGE 4: EXP 1 CHECK ---
document.getElementById('exp1-check-btn').addEventListener('click', () => {
    const q1 = document.querySelector('input[name="q1"]:checked')?.value;
    const q2 = document.querySelector('input[name="q2"]:checked')?.value;
    const q3 = document.querySelector('input[name="q3"]:checked')?.value;
    const errorEl = document.getElementById('exp1-check-error');

    if (q1 === '4' && q2 === 'no_change' && q3 === 'max_coins') {
        errorEl.classList.add('hidden');
        logEvent('Exp1 Comprehension Check Passed');
        showPage('page-exp1-formal');
        runExp1Trial();
    } else {
        errorEl.classList.remove('hidden');
        logEvent('Exp1 Comprehension Check Failed');
        setTimeout(() => {
            errorEl.classList.add('hidden');
            showPage('page-exp1-instructions');
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
    const stimulusId = currentTrial.stimulusId;
    const imagePath = currentTrial.imagePath;
    const stimulus = exp1Stimuli[stimulusId];

    stimulusContainer.innerHTML = `<img src="${imagePath}" class="w-full h-full object-contain" alt="stimulus image">`;
    choiceButtons.classList.remove('hidden');

    const trialData = {
        trial_index: exp1TrialIndex + 1,
        stimulus: stimulusId,
        imagePath: imagePath,
        start_time: performance.now(),
        choice: null,
        rt: null,
        outcome: null,
        coins_before: coins,
        coins_after: null
    };

    logEvent('Stimulus Presented', { trial: trialData.trial_index, stimulus: stimulusId, image: imagePath });

    const handleChoice = (choice) => {
        // Remove listeners to prevent multiple clicks
        document.getElementById('approach-btn').removeEventListener('click', approachHandler);
        document.getElementById('avoid-btn').removeEventListener('click', avoidHandler);

        trialData.choice = choice;
        trialData.rt = performance.now() - trialData.start_time;
        choiceButtons.classList.add('hidden');
        let outcome = 0;
        let feedbackText = '';

        if (choice === 'approach') {
            outcome = stimulus.outcome;
            coins += outcome;
            feedbackText = outcome > 0 ? `对方给了你 ${outcome} 个硬币` : `对方拿走了你 ${-outcome} 个硬币`;
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
            nextTrialContainer.classList.remove('hidden'); // Show the "Next Trial" button
        }, 1000); // 1-second feedback duration
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

// --- PAGE 6: EXP 1 BREAK ---
document.getElementById('to-exp2-btn').addEventListener('click', () => {
    showPage('page-exp2-instructions');
});

// --- PAGE 7: EXP 2 INSTRUCTIONS ---
document.getElementById('exp2-instr-btn').addEventListener('click', () => {
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
            showPage('page-exp2-instructions');
        }, 2000);
    }
});

// --- PAGE 9: EXP 2 FORMAL ---
function setupExp2() {
    const draggableContainer = document.getElementById('draggable-container');
    const dropZoneContainer = document.getElementById('drop-zone-container');

    // Shuffle items before displaying
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
        zone.innerHTML = `<span class="font-bold text-lg mr-4 text-gray-500 w-8">${i}.</span>`;
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

            // If zone already has an item, move it back to the list
            const existingItem = zone.querySelector('.draggable-item');
            if (existingItem) {
                document.getElementById('draggable-container').appendChild(existingItem);
            }

            if (currentlyDragged) {
                zone.appendChild(currentlyDragged);
            }
        });
    });

    // Allow dropping back into the original container
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
        const str = String(cell);
        // If the string contains a comma, a double quote, or a newline, enclose it in double quotes.
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            // Escape existing double quotes by doubling them
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    let csvContent = "";

    // Section 1: Participant Info
    csvContent += "# PARTICIPANT INFO\r\n";
    const infoHeaders = ['id', 'age', 'gender', "handedness", 'startTime', 'endTime', 'finalCoins_exp1'];
    const infoValues = [data.id, data.age, data.gender, data.handedness, data.startTime, data.endTime, data.exp1.finalCoins];
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
    if (dataDownloaded) return; // Prevent multiple downloads
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

    // For the experimenter to get the data
    console.log("--- 最终被试数据 ---");
    console.log(JSON.stringify(participantData, null, 2));
    document.getElementById('final-data-display').textContent = JSON.stringify(participantData, null, 2);
    document.getElementById('final-data-display').parentElement.classList.remove('hidden');

    // Add listeners for download
    document.getElementById('download-data-btn').addEventListener('click', downloadData);
    const downloadKeyListener = (e) => {
        // Prevent download if debug menu is triggered or if typing in an input.
        if (e.key !== 'm' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'SELECT') {
            downloadData();
            window.removeEventListener('keydown', downloadKeyListener); // Remove after use
        }
    };
    window.addEventListener('keydown', downloadKeyListener);
}

// --- DEBUG MODE ---
function setupDebugMode() {
    const debugMenu = document.getElementById('debug-menu');
    const debugPageList = document.getElementById('debug-page-list');
    if (!debugMenu || !debugPageList) return;

    // Populate the menu with buttons for each page
    pages.forEach(page => {
        const pageId = page.id;
        const button = document.createElement('button');
        button.textContent = pageId;
        button.className = 'bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-1 px-3 border border-gray-400 rounded shadow w-full text-left';

        button.addEventListener('click', () => {
            // If experiment hasn't started, fill in dummy data
            if (!participantData.startTime) {
                participantData.id = 'debug_user';
                participantData.age = 99;
                participantData.gender = 'other';
                participantData.startTime = performance.now();
                logEvent('Experiment Start (Debug)');
                startMouseTracking();
            }

            // Handle pages that require specific setup functions
            if (pageId === 'page-exp1-formal') {
                showPage(pageId);
                runExp1Trial();
            } else if (pageId === 'page-exp2-formal') {
                // Only setup if it hasn't been done yet
                if (document.getElementById('draggable-container').children.length === 0) {
                    setupExp2();
                }
                showPage(pageId);
            } else {
                showPage(pageId);
            }

            // Hide menu after selection
            debugMenu.classList.add('hidden');
        });
        debugPageList.appendChild(button);
    });

    // Add key listener to toggle the debug menu visibility
    window.addEventListener('keydown', (e) => {
        // Do not trigger if the user is typing in an input field
        if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'SELECT') {
            return;
        }

        if (e.key === 'm') {
            e.preventDefault(); // Prevent typing 'm' character
            debugMenu.classList.toggle('hidden');
        }
    });
}

// --- INITIALIZATION ---
window.onload = () => {
    // Set performance.now() as the relative zero point.
    participantData.log.push({ event: 'Script Loaded', timestamp: performance.now(), page: 'N/A' });
    generateTrialList(); // Generate the randomized trial list with images
    showPage('page-demographics');
    setupDebugMode(); // Initialize debug mode
};