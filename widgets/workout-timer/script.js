(function() {
    // ========== PRESET LIBRARY ==========
    const presets = [
        // category: hiit
        { name: 'AMRAP', desc: '20 min', category: 'hiit', work: 20*60, rest: 0, rounds: 1, sets: 1, setBreak: 0, type: 'countdown' },
        { name: 'EMOM', desc: '4 groups · 40/20', category: 'hiit', work: 40, rest: 20, rounds: 8, sets: 4, setBreak: 30, type: 'interval' },
        { name: 'Tabata-style HIIT', desc: '4 groups · 20/10', category: 'hiit', work: 20, rest: 10, rounds: 16, sets: 4, setBreak: 30, type: 'interval' },
        { name: 'HIIT Intervals', desc: '2 sets · 55/15', category: 'hiit', work: 55, rest: 15, rounds: 10, sets: 2, setBreak: 60, type: 'interval' },
        { name: 'Circuit', desc: '3 sets · 40/20', category: 'strength', work: 40, rest: 20, rounds: 8, sets: 3, setBreak: 60, type: 'interval' },
        { name: 'Pyramid Ladder', desc: '4 ex · 9 rnds, 20→50→20', category: 'strength', work: 'pyramid', rest: 10, rounds: 9, sets: 1, setBreak: 0, type: 'pyramid' },
        { name: '3:1 Ratio', desc: '3 sets · 60/20, 90s break', category: 'hiit', work: 60, rest: 20, rounds: 6, sets: 3, setBreak: 90, type: 'interval' },
        { name: 'Density Block', desc: '2 blocks x 10min', category: 'cardio', work: 10*60, rest: 0, rounds: 1, sets: 2, setBreak: 120, type: 'block' },
        { name: 'Warmup Stretch', desc: '45 sec holds', category: 'flex', work: 45, rest: 5, rounds: 8, sets: 1, setBreak: 0, type: 'interval' },
        { name: 'EMOM lite', desc: '16 min · 30/30', category: 'cardio', work: 30, rest: 30, rounds: 8, sets: 2, setBreak: 30, type: 'interval' },
        { name: 'Quick Tabata', desc: '8 rounds · 20/10', category: 'hiit', work: 20, rest: 10, rounds: 8, sets: 1, setBreak: 0, type: 'interval' },
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
