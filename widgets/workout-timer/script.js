(function() {
    // ========== PRESET LIBRARY ==========
    const presets = [
        { 
            name: 'AMRAP', 
            desc: '20 mins.', 
            category: 'hiit', 
            type: 'amrap',
            duration: 20 * 60 // 20 minutes total
        },
        { 
            name: 'EMOM', 
            desc: '4 rounds · 3 sets x 2 exercises · 40s/20s · 30s rnd break', 
            category: 'hiit',
            type: 'roundsBased',
            rounds: 4,
            exercisesPerRound: 2,
            setsPerExercise: 3,
            work: 40,
            rest: 20,
            roundBreak: 30
        },
        { 
            name: 'Tabata-style HIIT', 
            desc: '4 rounds · 2 sets x 4 exercises · 20s/10s · 30s rnd break', 
            category: 'hiit',
            type: 'roundsBased',
            rounds: 4,
            exercisesPerRound: 4,
            setsPerExercise: 2,
            work: 20,
            rest: 10,
            roundBreak: 30
        },
        { 
            name: 'HIIT Intervals', 
            desc: '2 sets x 10 exercises · 55s/15s · 60s rnd break', 
            category: 'hiit',
            type: 'setsBased',
            sets: 2,
            exercisesPerSet: 10,
            work: 55,
            rest: 15,
            setBreak: 60
        },
        { 
            name: 'Circuit', 
            desc: '3 sets x 8 exercises · 40s/20s · 60s rnd break', 
            category: 'strength',
            type: 'setsBased',
            sets: 3,
            exercisesPerSet: 8,
            work: 40,
            rest: 20,
            setBreak: 60
        },
        { 
            name: 'Pyramid Ladder', 
            desc: '9 rounds · 4 exercises · 20s→50s→20s work · 10s rest', 
            category: 'strength',
            type: 'pyramid',
            rounds: 9,
            exercisesPerRound: 4,
            rest: 10,
            pyramidBase: 20,
            pyramidPeak: 50,
            pyramidPeakRound: 5
        },
        { 
            name: '3:1 Ratio', 
            desc: '3 rounds · 6 exercises · 60s/20s · 1 min 30s rnd break', 
            category: 'hiit',
            type: 'roundsBased',
            rounds: 3,
            exercisesPerRound: 6,
            work: 60,
            rest: 20,
            roundBreak: 90
        },
        { 
            name: 'Density Time Block', 
            desc: '2 rounds · 4 exercises · 10 mins. round · 2 mins. rest', 
            category: 'cardio',
            type: 'density',
            rounds: 2,
            exercisesPerRound: 4,
            blockDuration: 10 * 60,
            roundBreak: 120
        },
        { 
            name: 'Warmup/Cooldown', 
            desc: '45s work · 5s rest', 
            category: 'flex',
            type: 'simple',
            work: 45,
            rest: 5,
            rounds: 8
        }
    ];

    // ========== STATE ==========
    let currentMode = 'presets';
    let activePreset = null;
    let timerInterval = null;
    let isRunning = false;
    
    // Timer state
    let timerValue = 0;
    let timerRunning = false;
    let pausedTime = null;
    
    // Workout state
    let workout = {
        type: 'simple',
        phase: 'work',
        currentRound: 1,
        totalRounds: 1,
        currentSet: 1,
        totalSets: 1,
        currentExercise: 1,
        totalExercises: 1,
        // For setsBased
        currentSetGroup: 1,
        totalSetGroups: 1,
        // Timing
        timeLeft: 0,
        workDuration: 0,
        restDuration: 0,
        breakDuration: 0,
        // For pyramid
        pyramidCurrentWork: 20
    };

    // Stopwatch variables
    let stopwatchTime = 0;
    let stopwatchRunning = false;
    let stopwatchInterval = null;
    let stopwatchMonthCounter = 0;
    const MONTH_THRESHOLD = 744 * 60 * 60;

    // DOM elements
    const timerDisplay = document.getElementById('timerDisplay');
    const statusBadge = document.getElementById('statusBadge');
    const structureInfo = document.getElementById('structureInfo');
    const presetsGrid = document.getElementById('presetsGrid');
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const resetBtn = document.getElementById('resetBtn');

    // Tabs
    const tabBtns = document.querySelectorAll('.tab-btn');
    const presetsTab = document.getElementById('presetsTab');
    const customTab = document.getElementById('customTab');
    const stopwatchTab = document.getElementById('stopwatchTab');

    // Custom tabs
    const customTabBtns = document.querySelectorAll('.custom-tab-btn');
    const customRoundsPanel = document.getElementById('customRoundsPanel');
    const customSetsPanel = document.getElementById('customSetsPanel');
    const customSimplePanel = document.getElementById('customSimplePanel');

    // Category pills
    const categoryPills = document.querySelectorAll('.category-pill');
    let activeCategory = 'all';

    // Custom inputs
    const customRounds = document.getElementById('customRounds');
    const customExPerRound = document.getElementById('customExPerRound');
    const customSetsPerEx = document.getElementById('customSetsPerEx');
    const customWorkRounds = document.getElementById('customWorkRounds');
    const customRestRounds = document.getElementById('customRestRounds');
    const customRoundBreak = document.getElementById('customRoundBreak');
    
    const customSets = document.getElementById('customSets');
    const customExPerSet = document.getElementById('customExPerSet');
    const customWorkSets = document.getElementById('customWorkSets');
    const customRestSets = document.getElementById('customRestSets');
    const customSetBreak = document.getElementById('customSetBreak');
    
    const customWorkMin = document.getElementById('customWorkMin');
    const customWorkSec = document.getElementById('customWorkSec');
    const customRestSimple = document.getElementById('customRestSimple');
    const customSimpleRounds = document.getElementById('customSimpleRounds');

    // ========== HELPER FUNCTIONS ==========
    function formatTime(seconds, showMilliseconds = false) {
        if (seconds < 0) seconds = 0;
        
        if (showMilliseconds) {
            const totalSeconds = Math.floor(seconds);
            const milliseconds = Math.floor((seconds - totalSeconds) * 100);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const secs = totalSeconds % 60;
            
            if (hours > 0) {
                return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
            } else {
                return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
            }
        } else {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
    }

    function updateTimerDisplay() {
        timerDisplay.textContent = formatTime(timerValue, currentMode === 'stopwatch');
        
        if (timerValue < 5 && timerValue > 0 && currentMode !== 'stopwatch') {
            timerDisplay.classList.add('warning');
        } else {
            timerDisplay.classList.remove('warning');
        }
    }

    function updateStructureInfo() {
        if (currentMode === 'stopwatch') {
            const monthCounter = document.getElementById('monthCounter');
            if (stopwatchMonthCounter > 0) {
                structureInfo.innerHTML = `<span class="progress-item">${stopwatchMonthCounter} month${stopwatchMonthCounter > 1 ? 's' : ''} +</span>`;
            } else {
                structureInfo.innerHTML = '<span class="progress-item">Stopwatch</span>';
            }
            return;
        }
        
        let html = '';
        
        if (workout.type === 'simple') {
            html = `Round ${workout.currentRound} / ${workout.totalRounds}`;
        } else if (workout.type === 'sets') {
            html = `Set ${workout.currentSetGroup} / ${workout.totalSetGroups} │ Ex ${workout.currentExercise} / ${workout.totalExercises}`;
        } else if (workout.type === 'rounds') {
            html = `Round ${workout.currentRound} / ${workout.totalRounds} │ Set ${workout.currentSet} / ${workout.totalSets} │ Ex ${workout.currentExercise} / ${workout.totalExercises}`;
        } else {
            html = 'Ready';
        }
        
        structureInfo.innerHTML = `<span class="progress-item">${html}</span>`;
    }

    function updatePhaseStatus() {
        if (workout.phase === 'work') {
            statusBadge.textContent = '▶ WORK';
        } else if (workout.phase === 'rest') {
            statusBadge.textContent = '▶ REST';
        } else if (workout.phase === 'break') {
            statusBadge.textContent = '▶ BREAK';
        }
    }

    function startBlinking() {
        statusBadge.classList.add('blinking');
    }

    function stopBlinking() {
        statusBadge.classList.remove('blinking');
    }

    function setStatus(status) {
        stopBlinking();
        
        if (currentMode === 'stopwatch') {
            // Stopwatch status messages
            if (status === 'standby') {
                statusBadge.textContent = '⚪ Standby';
            } else if (status === 'running') {
                statusBadge.textContent = '⏱️ Running...';
            } else if (status === 'paused') {
                statusBadge.textContent = '⏸ Paused';
            } else if (status === 'reset') {
                statusBadge.textContent = '↺ Reset — Ready';
            }
        } else {
            // Workout timer status messages
            if (status === 'standby') {
                statusBadge.textContent = '⚪ Standby';
            } else if (status === 'paused') {
                statusBadge.textContent = '⏸ Paused';
            } else if (status === 'reset') {
                statusBadge.textContent = '↺ Reset — Ready';
            } else if (status === 'running') {
                updatePhaseStatus();
                startBlinking();
            }
        }
    }

    function stopTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        timerRunning = false;
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
        stopTimer();
        setStatus('standby');
        
        workout.type = preset.type;
        
        if (preset.type === 'amrap') {
            workout.totalRounds = 1;
            workout.currentRound = 1;
            workout.workDuration = preset.duration;
            timerValue = preset.duration;
            workout.phase = 'work';
            structureInfo.innerHTML = '<span class="progress-item">AMRAP · 20 min</span>';
            
        } else if (preset.type === 'roundsBased') {
            workout.totalRounds = preset.rounds;
            workout.totalExercises = preset.exercisesPerRound;
            workout.totalSets = preset.setsPerExercise;
            workout.currentRound = 1;
            workout.currentExercise = 1;
            workout.currentSet = 1;
            workout.workDuration = preset.work;
            workout.restDuration = preset.rest;
            workout.breakDuration = preset.roundBreak || 0;
            timerValue = preset.work;
            workout.phase = 'work';
            updateStructureInfo();
            
        } else if (preset.type === 'setsBased') {
            workout.totalSetGroups = preset.sets;
            workout.totalExercises = preset.exercisesPerSet;
            workout.currentSetGroup = 1;
            workout.currentExercise = 1;
            workout.workDuration = preset.work;
            workout.restDuration = preset.rest;
            workout.breakDuration = preset.setBreak || 0;
            timerValue = preset.work;
            workout.phase = 'work';
            updateStructureInfo();
            
        } else if (preset.type === 'pyramid') {
            workout.totalRounds = preset.rounds;
            workout.totalExercises = preset.exercisesPerRound;
            workout.currentRound = 1;
            workout.currentExercise = 1;
            workout.restDuration = preset.rest;
            workout.pyramidBase = preset.pyramidBase;
            workout.pyramidPeak = preset.pyramidPeak;
            workout.pyramidPeakRound = preset.pyramidPeakRound;
            workout.pyramidCurrentWork = preset.pyramidBase;
            workout.workDuration = preset.pyramidBase;
            timerValue = preset.pyramidBase;
            workout.phase = 'work';
            updateStructureInfo();
            
        } else if (preset.type === 'density') {
            workout.totalRounds = preset.rounds;
            workout.totalExercises = preset.exercisesPerRound;
            workout.currentRound = 1;
            workout.currentExercise = 1;
            workout.workDuration = preset.blockDuration;
            workout.breakDuration = preset.roundBreak;
            timerValue = preset.blockDuration;
            workout.phase = 'work';
            updateStructureInfo();
            
        } else if (preset.type === 'simple') {
            workout.totalRounds = preset.rounds || 1;
            workout.currentRound = 1;
            workout.workDuration = preset.work;
            workout.restDuration = preset.rest || 0;
            timerValue = preset.work;
            workout.phase = 'work';
            updateStructureInfo();
        }
        
        updateTimerDisplay();
        statusBadge.textContent = `📌 loaded: ${preset.name}`;
    }

    // ========== STOPWATCH FUNCTIONS ==========
    function startStopwatch() {
        if (stopwatchRunning) return;
        
        stopwatchRunning = true;
        stopwatchInterval = setInterval(() => {
            stopwatchTime += 0.01;
            
            if (stopwatchTime >= MONTH_THRESHOLD) {
                stopwatchMonthCounter++;
                stopwatchTime = 0;
                
                const monthCounter = document.getElementById('monthCounter');
                if (stopwatchMonthCounter > 0) {
                    monthCounter.textContent = `${stopwatchMonthCounter} month${stopwatchMonthCounter > 1 ? 's' : ''} +`;
                    monthCounter.classList.add('visible');
                }
            }
            
            timerDisplay.textContent = formatTime(stopwatchTime, true);
        }, 10);
        
        statusBadge.textContent = '⏱️ Running...';
    }

    function pauseStopwatch() {
        if (!stopwatchRunning) return;
        
        clearInterval(stopwatchInterval);
        stopwatchRunning = false;
        statusBadge.textContent = '⏸ Paused';
    }

    function resetStopwatch() {
        clearInterval(stopwatchInterval);
        stopwatchRunning = false;
        stopwatchTime = 0;
        stopwatchMonthCounter = 0;
        
        const monthCounter = document.getElementById('monthCounter');
        monthCounter.textContent = '';
        monthCounter.classList.remove('visible');
        
        timerDisplay.textContent = formatTime(0, true);
        statusBadge.textContent = '↺ Reset — Ready';
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

            stopTimer();
            if (stopwatchRunning) {
                pauseStopwatch();
            }
            
            if (tab === 'stopwatch') {
                workout.type = 'stopwatch';
                resetStopwatch();
                structureInfo.innerHTML = '<span class="progress-item">Stopwatch</span>';
                document.getElementById('monthCounter').classList.remove('visible');
                
            } else if (tab === 'custom') {
                structureInfo.innerHTML = '<span class="progress-item">Custom Timer</span>';
                statusBadge.textContent = '⚪ Standby';
                
            } else {
                if (activePreset) loadPreset(activePreset);
                else {
                    renderPresets(activeCategory);
                    statusBadge.textContent = '⚪ Standby';
                    structureInfo.innerHTML = '<span class="progress-item">Ready</span>';
                }
            }
        });
    });

    // Custom tab switching
    customTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            customTabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const type = btn.dataset.customType;
            
            customRoundsPanel.style.display = type === 'rounds' ? 'block' : 'none';
            customSetsPanel.style.display = type === 'sets' ? 'block' : 'none';
            customSimplePanel.style.display = type === 'simple' ? 'block' : 'none';
        });
    });

    // Control buttons
    startBtn.addEventListener('click', () => {
        if (currentMode === 'stopwatch') {
            startStopwatch();
        } else {
            if (!timerRunning) {
                if (pausedTime !== null) {
                    timerValue = pausedTime;
                    pausedTime = null;
                }
                timerRunning = true;
                setStatus('running');
                
                if (timerInterval) clearInterval(timerInterval);
                timerInterval = setInterval(() => {
                    timerValue -= 0.01;
                    
                    if (timerValue <= 0) {
                        // Handle phase transitions here
                        // This is simplified - you'd need to implement the full phase logic
                        timerValue = 0;
                        clearInterval(timerInterval);
                        timerRunning = false;
                        setStatus('standby');
                    }
                    
                    updateTimerDisplay();
                }, 10);
            }
        }
    });

    pauseBtn.addEventListener('click', () => {
        if (currentMode === 'stopwatch') {
            pauseStopwatch();
        } else {
            if (timerRunning) {
                clearInterval(timerInterval);
                timerInterval = null;
                timerRunning = false;
                pausedTime = timerValue;
                setStatus('paused');
            }
        }
    });

    resetBtn.addEventListener('click', () => {
        if (currentMode === 'stopwatch') {
            resetStopwatch();
        } else {
            if (timerRunning) {
                clearInterval(timerInterval);
                timerInterval = null;
                timerRunning = false;
            }
            timerValue = 0;
            pausedTime = null;
            updateTimerDisplay();
            setStatus('reset');
            
            setTimeout(() => {
                if (!timerRunning) setStatus('standby');
            }, 1000);
        }
    });

    // Input validation for minutes/seconds
    [customWorkMin, customWorkSec].forEach(input => {
        if (input) {
            input.addEventListener('input', function() {
                let val = this.value.replace(/[^0-9]/g, '');
                if (val.length > 2) val = val.slice(0, 2);
                if (parseInt(val) > 59) val = '59';
                this.value = val;
            });
        }
    });

    // ========== INITIALIZATION ==========
    renderPresets('all');
    loadPreset(presets[0]);
    setStatus('standby');
})();
