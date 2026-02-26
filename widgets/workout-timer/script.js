(function() {
// ========== PRESET LIBRARY ==========
const presets = [
    // category: hiit
    { 
        name: 'AMRAP', 
        desc: '20 mins.', 
        category: 'hiit', 
        type: 'amrap',
        duration: 20 * 60, // 20 minutes total
        rest: 0
    },
    { 
        name: 'EMOM', 
        desc: '4 rounds · 3 sets x 2 exercises · 40s/20s · 30s rnd break', 
        category: 'hiit',
        type: 'structured',
        rounds: 4,                    // 4 rounds
        exercisesPerRound: 2,          // 2 exercises each round
        setsPerExercise: 3,            // 3 sets per exercise
        work: 40,                      // 40 sec work
        rest: 20,                      // 20 sec rest between exercises
        roundBreak: 30,                 // 30 sec break between rounds
        exercises: ['ex1', 'ex2']      // placeholder for exercise names
    },
    { 
        name: 'Tabata-style HIIT', 
        desc: '4 rounds · 2 sets x 4 exercises · 20s/10s · 30s rnd break', 
        category: 'hiit',
        type: 'structured',
        rounds: 4,                    // 4 rounds
        exercisesPerRound: 4,          // 4 exercises each round
        setsPerExercise: 2,            // 2 sets per exercise
        work: 20,                      // 20 sec work
        rest: 10,                      // 10 sec rest between exercises/sets
        roundBreak: 30                  // 30 sec break between rounds
    },
    { 
        name: 'HIIT Intervals', 
        desc: '2 sets x 10 exercises · 55s/15s · 60s set break', 
        category: 'hiit',
        type: 'structured',
        sets: 2,                       // 2 sets
        exercisesPerSet: 10,            // 10 exercises per set
        work: 55,                       // 55 sec work
        rest: 15,                       // 15 sec rest between exercises
        setBreak: 60                     // 60 sec break between sets
    },
    { 
        name: 'Circuit', 
        desc: '3 sets x 8 exercises · 40s/20s · 60s set break', 
        category: 'strength',
        type: 'structured',
        sets: 3,                       // 3 sets
        exercisesPerSet: 8,             // 8 exercises per set
        work: 40,                       // 40 sec work
        rest: 20,                       // 20 sec rest between exercises
        setBreak: 60                     // 60 sec break between sets
    },
    { 
        name: 'Pyramid Ladder', 
        desc: '9 rounds · 4 exercises · work 20s→50s→20s · 10s rest', 
        category: 'strength',
        type: 'pyramid',
        rounds: 9,                      // 9 rounds
        exercisesPerRound: 4,            // 4 exercises each round
        rest: 10,                        // 10 sec rest between exercises
        pyramidBase: 20,                 // starting work: 20 sec
        pyramidPeak: 50,                 // peak work: 50 sec
        pyramidPeakRound: 5               // peak at round 5
    },
    { 
        name: '3:1 Ratio', 
        desc: '3 rounds · 6 exercises · 60s/20s · 1 min. 30s round break', 
        category: 'hiit',
        type: 'structured',
        rounds: 3,                       // 3 rounds
        exercisesPerRound: 6,             // 6 exercises each round
        work: 60,                         // 60 sec work
        rest: 20,                         // 20 sec rest between exercises
        roundBreak: 90                     // 90 sec break between rounds
    },
    { 
        name: 'Density Time Block', 
        desc: '2 rounds · 4 exercises · 10 mins. block · 2 mins. rest', 
        category: 'cardio',
        type: 'density',
        rounds: 2,                        // 2 rounds
        exercisesPerRound: 4,              // 4 exercises each round
        blockDuration: 10 * 60,            // 10 minutes per block
        roundBreak: 120                     // 2 min rest between rounds
    },
    { 
        name: 'Warmup/Cooldown', 
        desc: '45 sec', 
        category: 'flex',
        type: 'simple',
        work: 45,                          // 45 sec work
        rest: 5,                            // 5 sec transition
        rounds: 8,                          // 8 stretches
        sets: 1
    }
];

    // ========== STATE ==========
    let currentMode = 'presets';
    let activePreset = null;
    let timerInterval = null;
    let isRunning = false;

    // timer variables
    let timeLeft = 1200;
    let currentRound = 0, totalRounds = 1, currentSet = 0, totalSets = 1;
    let phase = 'work';
    let workDuration = 20*60, restDuration = 0, setBreakDuration = 0;

    // DOM elements
    const timerDisplay = document.getElementById('timerDisplay');
    const roundDisplay = document.getElementById('roundDisplay');
    const statusMsg = document.getElementById('statusMessage');
    const presetsGrid = document.getElementById('presetsGrid');
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const resetBtn = document.getElementById('resetBtn');

    // tabs
    const tabBtns = document.querySelectorAll('.tab-btn');
    const presetsTab = document.getElementById('presetsTab');
    const customTab = document.getElementById('customTab');
    const stopwatchTab = document.getElementById('stopwatchTab');

    // category pills
    const categoryPills = document.querySelectorAll('.category-pill');
    let activeCategory = 'all';

    // custom inputs
    const workMin = document.getElementById('workMin');
    const workSec = document.getElementById('workSec');
    const restSec = document.getElementById('restSec');
    const roundsTotal = document.getElementById('roundsTotal');
    const setsTotal = document.getElementById('setsTotal');
    const setBreakSec = document.getElementById('setBreakSec');

    // ========== HELPER FUNCTIONS ==========
    function formatTime(seconds) {
        if (seconds < 0) seconds = 0;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    function updateDisplay() {
        timerDisplay.innerText = formatTime(timeLeft);
    }

    function updateRoundInfo() {
        if (currentMode === 'stopwatch') {
            roundDisplay.innerText = 'stopwatch';
            return;
        }
        let text = `round ${currentRound}/${totalRounds} · set ${currentSet}/${totalSets}`;
        if (phase) text += ` · ${phase}`;
        roundDisplay.innerText = text;
    }

    function stopTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        isRunning = false;
    }

    // ========== PRESET FUNCTIONS ==========
    function renderPresets(category = 'all') {
        const filtered = category === 'all' ? presets : presets.filter(p => p.category === category);
        presetsGrid.innerHTML = filtered.map(p => `
            <div class="preset-card" data-preset='${JSON.stringify(p).replace(/'/g, "&apos;")}'>
                <div class="preset-name">${p.name}</div>
                <div class="preset-desc">${p.desc}</div>
            </div>
        `).join('');
    }

    function loadPreset(preset) {
        activePreset = preset;
        statusMsg.innerText = `📌 loaded: ${preset.name}`;

        if (preset.type === 'pyramid') {
            workDuration = 20;
            restDuration = preset.rest;
            totalRounds = preset.rounds;
            totalSets = preset.sets;
            setBreakDuration = preset.setBreak;
        } else if (preset.type === 'block') {
            workDuration = preset.work;
            restDuration = 0;
            totalRounds = preset.rounds;
            totalSets = preset.sets;
            setBreakDuration = preset.setBreak;
        } else {
            workDuration = preset.work;
            restDuration = preset.rest;
            totalRounds = preset.rounds;
            totalSets = preset.sets;
            setBreakDuration = preset.setBreak;
        }

        timeLeft = workDuration;
        currentRound = 1;
        currentSet = 1;
        phase = 'work';
        updateDisplay();
        updateRoundInfo();
    }

    // ========== TIMER LOGIC ==========
    function nextPhase() {
        if (activePreset && activePreset.type === 'pyramid') {
            if (currentRound < totalRounds) {
                currentRound++;
                if (currentRound <= 5) workDuration = 20 + (currentRound-1)*10;
                else workDuration = 50 - (currentRound-5)*10;
                if (workDuration < 20) workDuration = 20;
                timeLeft = workDuration;
                phase = 'work';
            } else {
                stopTimer();
                statusMsg.innerText = '✅ pyramid complete';
                return;
            }
            updateRoundInfo();
            updateDisplay();
            return;
        }

        if (phase === 'work') {
            if (restDuration > 0) {
                phase = 'rest';
                timeLeft = restDuration;
            } else {
                if (currentRound < totalRounds) {
                    currentRound++;
                    timeLeft = workDuration;
                } else {
                    if (currentSet < totalSets) {
                        currentSet++;
                        currentRound = 1;
                        if (setBreakDuration > 0) {
                            phase = 'setBreak';
                            timeLeft = setBreakDuration;
                        } else {
                            phase = 'work';
                            timeLeft = workDuration;
                        }
                    } else {
                        stopTimer();
                        statusMsg.innerText = '🎉 workout complete!';
                        return;
                    }
                }
            }
        } else if (phase === 'rest') {
            if (currentRound < totalRounds) {
                currentRound++;
                phase = 'work';
                timeLeft = workDuration;
            } else {
                if (currentSet < totalSets) {
                    currentSet++;
                    currentRound = 1;
                    if (setBreakDuration > 0) {
                        phase = 'setBreak';
                        timeLeft = setBreakDuration;
                    } else {
                        phase = 'work';
                        timeLeft = workDuration;
                    }
                } else {
                    stopTimer();
                    statusMsg.innerText = '🎉 workout complete!';
                    return;
                }
            }
        } else if (phase === 'setBreak') {
            phase = 'work';
            currentRound = 1;
            timeLeft = workDuration;
        }

        updateRoundInfo();
        updateDisplay();
    }

    function startTimer() {
        if (isRunning) return;
        if (timerInterval) clearInterval(timerInterval);
        isRunning = true;
        statusMsg.innerText = '▶ running';

        timerInterval = setInterval(() => {
            if (timeLeft <= 0) {
                nextPhase();
            } else {
                timeLeft--;
                updateDisplay();
            }
        }, 1000);
    }

    function pauseTimer() {
        if (!isRunning) return;
        clearInterval(timerInterval);
        timerInterval = null;
        isRunning = false;
        statusMsg.innerText = '⏸ paused';
    }

    function resetTimer() {
        stopTimer();
        if (currentMode === 'presets' && activePreset) {
            loadPreset(activePreset);
        } else if (currentMode === 'custom') {
            const workM = parseInt(workMin.value) || 0;
            const workS = parseInt(workSec.value) || 0;
            workDuration = workM*60 + workS;
            restDuration = parseInt(restSec.value) || 0;
            totalRounds = parseInt(roundsTotal.value) || 1;
            totalSets = parseInt(setsTotal.value) || 1;
            setBreakDuration = parseInt(setBreakSec.value) || 0;
            timeLeft = workDuration;
            currentRound = 1;
            currentSet = 1;
            phase = 'work';
        } else if (currentMode === 'stopwatch') {
            timeLeft = 0;
            roundDisplay.innerText = 'stopwatch';
        }
        updateDisplay();
        updateRoundInfo();
        statusMsg.innerText = 'reset · ready';
    }

    // ========== EVENT LISTENERS ==========
    
    // Preset click
    presetsGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.preset-card');
        if (!card) return;
        const presetData = card.dataset.preset;
        if (!presetData) return;
        try {
            const preset = JSON.parse(presetData.replace(/&apos;/g, "'"));
            loadPreset(preset);
        } catch (err) { 
            console.warn(err); 
        }
    });

    // Category filter
    categoryPills.forEach(pill => {
        pill.addEventListener('click', () => {
            categoryPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            activeCategory = pill.dataset.category;
            renderPresets(activeCategory);
        });
    });

    // Tab switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const tab = btn.dataset.tab;
            currentMode = tab;
            
            presetsTab.style.display = tab === 'presets' ? 'block' : 'none';
            customTab.style.display = tab === 'custom' ? 'block' : 'none';
            stopwatchTab.style.display = tab === 'stopwatch' ? 'block' : 'none';

            if (tab === 'stopwatch') {
                timeLeft = 0;
                roundDisplay.innerText = 'stopwatch';
                statusMsg.innerText = '⏱️ stopwatch mode';
            } else if (tab === 'custom') {
                statusMsg.innerText = '✨ set your custom timer';
            } else {
                if (activePreset) loadPreset(activePreset);
                else statusMsg.innerText = 'ready · select a preset';
            }
            updateDisplay();
        });
    });

    // Control buttons
    startBtn.addEventListener('click', startTimer);
    pauseBtn.addEventListener('click', pauseTimer);
    resetBtn.addEventListener('click', resetTimer);

    // Input validation for minutes/seconds
    [workMin, workSec].forEach(input => {
        input.addEventListener('input', function() {
            let val = this.value.replace(/[^0-9]/g, '');
            if (val.length > 2) val = val.slice(0, 2);
            if (parseInt(val) > 59) val = '59';
            this.value = val;
        });
    });

    // ========== INITIALIZATION ==========
    renderPresets('all');
    loadPreset(presets[0]); // Load AMRAP by default

    // Set custom input defaults
    workMin.value = '00';
    workSec.value = '30';
    restSec.value = '15';
    roundsTotal.value = '8';
    setsTotal.value = '3';
    setBreakSec.value = '60';
})();
