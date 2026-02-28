(function() {
    // ========== PRESET LIBRARY ==========
    const presets = [
        { 
            name: 'AMRAP', 
            desc: '20 mins.', 
            category: 'hiit', 
            type: 'amrap',
            duration: 20 * 60
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
    
    // Workout state
    let workout = {
        type: 'simple',
        currentRound: 1,
        totalRounds: 1,
        currentExercise: 1,
        totalExercises: 1,
        currentSet: 1,
        totalSets: 1,
        currentSetGroup: 1,
        totalSetGroups: 1,
        phase: 'work',
        timeLeft: 0,
        workDuration: 0,
        restDuration: 0,
        breakDuration: 0,
        pyramidCurrentWork: 20
    };

    // ========== STOPWATCH VARIABLES ==========
    let stopwatchTime = 0;
    let stopwatchRunning = false;
    let stopwatchInterval = null;
    let stopwatchMonthCounter = 0;
    const MONTH_THRESHOLD = 744 * 60 * 60;

    // DOM elements
    const timerDisplay = document.getElementById('timerDisplay');
    const structureInfo = document.getElementById('structureInfo');
    const statusMsg = document.getElementById('statusMessage');
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

    function updateDisplay() {
        timerDisplay.innerText = formatTime(workout.timeLeft);
        
        // 6-second warning for timer modes
        if (currentMode !== 'stopwatch' && workout.timeLeft < 6 && workout.timeLeft > 0) {
            timerDisplay.classList.add('warning');
        } else {
            timerDisplay.classList.remove('warning');
        }
    }

    function updateStopwatchDisplay() {
        timerDisplay.innerText = formatTime(stopwatchTime, true);
        
        // No warning color for stopwatch
        timerDisplay.classList.remove('warning');
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
        
        if (workout.type === 'simple' || workout.type === 'amrap') {
            html = `Round ${workout.currentRound} / ${workout.totalRounds}`;
        } else if (workout.type === 'setsBased') {
            html = `Set ${workout.currentSetGroup} / ${workout.totalSetGroups} │ Ex ${workout.currentExercise} / ${workout.totalExercises}`;
        } else if (workout.type === 'roundsBased') {
            html = `Round ${workout.currentRound} / ${workout.totalRounds} │ Set ${workout.currentSet} / ${workout.totalSets} │ Ex ${workout.currentExercise} / ${workout.totalExercises}`;
        } else if (workout.type === 'pyramid') {
            html = `Round ${workout.currentRound} / ${workout.totalRounds} │ Ex ${workout.currentExercise} / ${workout.totalExercises}`;
        } else if (workout.type === 'density') {
            html = `Block ${workout.currentRound} / ${workout.totalRounds} │ Ex ${workout.currentExercise} / ${workout.totalExercises}`;
        } else {
            html = 'Ready';
        }
        
        structureInfo.innerHTML = `<span class="progress-item">${html}</span>`;
    }

    function setStatus(status) {
        statusMsg.classList.remove('blinking', 'standby', 'running', 'paused', 'reset');
        
        if (status === 'standby') {
            statusMsg.textContent = '⏳ Standby';
            statusMsg.classList.add('standby');
        } else if (status === 'paused') {
            statusMsg.textContent = '⏸ Paused';
            statusMsg.classList.add('paused');
        } else if (status === 'reset') {
            statusMsg.textContent = '↺ Reset — Ready';
            statusMsg.classList.add('reset');
        } else if (status === 'running') {
            if (currentMode === 'stopwatch') {
                statusMsg.textContent = '⏱️ Running...';
                statusMsg.classList.add('running');
            } else {
                // Update phase-based status for workout timers
                if (workout.phase === 'work') {
                    statusMsg.textContent = '▶ WORK';
                } else if (workout.phase === 'rest') {
                    statusMsg.textContent = '▶ REST';
                } else if (workout.phase === 'roundBreak' || workout.phase === 'setBreak' || workout.phase === 'break') {
                    statusMsg.textContent = '▶ BREAK';
                }
                statusMsg.classList.add('running', 'blinking');
            }
        }
    }

    function stopTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        isRunning = false;
    }

    // ========== STOPWATCH FUNCTIONS ==========
    function startStopwatch() {
        if (stopwatchRunning) return;
        
        stopwatchRunning = true;
        setStatus('running');
        
        stopwatchInterval = setInterval(() => {
            stopwatchTime += 0.01;
            
            if (stopwatchTime >= MONTH_THRESHOLD) {
                stopwatchMonthCounter++;
                stopwatchTime = 0;
                
                const monthCounter = document.getElementById('monthCounter');
                monthCounter.textContent = `${stopwatchMonthCounter} month${stopwatchMonthCounter > 1 ? 's' : ''} +`;
                monthCounter.classList.add('visible');
                updateStructureInfo();
            }
            
            updateStopwatchDisplay();
        }, 10);
    }

    function pauseStopwatch() {
        if (!stopwatchRunning) return;
        
        clearInterval(stopwatchInterval);
        stopwatchRunning = false;
        setStatus('paused');
    }

    function resetStopwatch() {
        clearInterval(stopwatchInterval);
        stopwatchRunning = false;
        stopwatchTime = 0;
        stopwatchMonthCounter = 0;
        
        const monthCounter = document.getElementById('monthCounter');
        monthCounter.textContent = '';
        monthCounter.classList.remove('visible');
        
        updateStopwatchDisplay();
        updateStructureInfo();
        setStatus('reset');
        
        setTimeout(() => {
            if (!stopwatchRunning) setStatus('standby');
        }, 1000);
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
            workout.timeLeft = preset.duration;
            workout.phase = 'work';
            structureInfo.innerText = 'AMRAP · as many rounds as possible in 20 min';
            
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
            workout.timeLeft = preset.work;
            workout.phase = 'work';
            structureInfo.innerText = `${preset.rounds} rounds · ${preset.exercisesPerRound} exercises · ${preset.setsPerExercise} sets each`;
            
        } else if (preset.type === 'setsBased') {
            workout.totalSetGroups = preset.sets;
            workout.totalExercises = preset.exercisesPerSet;
            workout.currentSetGroup = 1;
            workout.currentExercise = 1;
            workout.workDuration = preset.work;
            workout.restDuration = preset.rest;
            workout.breakDuration = preset.setBreak || 0;
            workout.timeLeft = preset.work;
            workout.phase = 'work';
            structureInfo.innerText = `${preset.sets} sets · ${preset.exercisesPerSet} exercises per set`;
            
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
            workout.timeLeft = preset.pyramidBase;
            workout.phase = 'work';
            structureInfo.innerText = `pyramid · work 20→50→20 · ${preset.rest}s rest`;
            
        } else if (preset.type === 'density') {
            workout.totalRounds = preset.rounds;
            workout.totalExercises = preset.exercisesPerRound;
            workout.currentRound = 1;
            workout.currentExercise = 1;
            workout.workDuration = preset.blockDuration;
            workout.breakDuration = preset.roundBreak;
            workout.timeLeft = preset.blockDuration;
            workout.phase = 'work';
            structureInfo.innerText = `${preset.rounds} blocks · ${preset.exercisesPerRound} exercises · ${Math.floor(preset.blockDuration/60)} min each`;
            
        } else if (preset.type === 'simple') {
            workout.totalRounds = preset.rounds || 1;
            workout.currentRound = 1;
            workout.workDuration = preset.work;
            workout.restDuration = preset.rest || 0;
            workout.timeLeft = preset.work;
            workout.phase = 'work';
            structureInfo.innerText = `${preset.work}s work · ${preset.rest || 0}s rest · ${preset.rounds || 1} rounds`;
        }
        
        updateDisplay();
        updateStructureInfo();
        statusMsg.innerText = `📌 loaded: ${preset.name}`;
    }

    // ========== TIMER LOGIC ==========
    function nextPhase() {
        if (workout.type === 'amrap') {
            if (workout.timeLeft <= 0) {
                stopTimer();
                setStatus('standby');
                statusMsg.innerText = '✅ AMRAP complete!';
                return;
            }
        }
        
        else if (workout.type === 'roundsBased') {
            if (workout.phase === 'work') {
                workout.phase = 'rest';
                workout.timeLeft = workout.restDuration;
            } 
            else if (workout.phase === 'rest') {
                if (workout.currentSet < workout.totalSets) {
                    workout.currentSet++;
                    workout.phase = 'work';
                    workout.timeLeft = workout.workDuration;
                } 
                else {
                    workout.currentSet = 1;
                    
                    if (workout.currentExercise < workout.totalExercises) {
                        workout.currentExercise++;
                        workout.phase = 'work';
                        workout.timeLeft = workout.workDuration;
                    } 
                    else {
                        if (workout.currentRound < workout.totalRounds) {
                            workout.currentRound++;
                            workout.currentExercise = 1;
                            workout.phase = 'roundBreak';
                            workout.timeLeft = workout.breakDuration;
                        } 
                        else {
                            stopTimer();
                            setStatus('standby');
                            statusMsg.innerText = '🎉 workout complete!';
                            return;
                        }
                    }
                }
            } 
            else if (workout.phase === 'roundBreak') {
                workout.phase = 'work';
                workout.timeLeft = workout.workDuration;
            }
        }
        
        else if (workout.type === 'setsBased') {
            if (workout.phase === 'work') {
                workout.phase = 'rest';
                workout.timeLeft = workout.restDuration;
            } 
            else if (workout.phase === 'rest') {
                if (workout.currentExercise < workout.totalExercises) {
                    workout.currentExercise++;
                    workout.phase = 'work';
                    workout.timeLeft = workout.workDuration;
                } 
                else {
                    if (workout.currentSetGroup < workout.totalSetGroups) {
                        workout.currentSetGroup++;
                        workout.currentExercise = 1;
                        workout.phase = 'setBreak';
                        workout.timeLeft = workout.breakDuration;
                    } 
                    else {
                        stopTimer();
                        setStatus('standby');
                        statusMsg.innerText = '🎉 workout complete!';
                        return;
                    }
                }
            } 
            else if (workout.phase === 'setBreak') {
                workout.phase = 'work';
                workout.timeLeft = workout.workDuration;
            }
        }
        
        else if (workout.type === 'pyramid') {
            if (workout.phase === 'work') {
                workout.phase = 'rest';
                workout.timeLeft = workout.restDuration;
            } 
            else if (workout.phase === 'rest') {
                if (workout.currentExercise < workout.totalExercises) {
                    workout.currentExercise++;
                    
                    if (workout.currentRound <= workout.pyramidPeakRound) {
                        workout.workDuration = workout.pyramidBase + (workout.currentRound - 1) * 10;
                    } else {
                        workout.workDuration = workout.pyramidPeak - (workout.currentRound - workout.pyramidPeakRound) * 10;
                    }
                    
                    workout.phase = 'work';
                    workout.timeLeft = workout.workDuration;
                } 
                else {
                    if (workout.currentRound < workout.totalRounds) {
                        workout.currentRound++;
                        workout.currentExercise = 1;
                        
                        if (workout.currentRound <= workout.pyramidPeakRound) {
                            workout.workDuration = workout.pyramidBase + (workout.currentRound - 1) * 10;
                        } else {
                            workout.workDuration = workout.pyramidPeak - (workout.currentRound - workout.pyramidPeakRound) * 10;
                        }
                        
                        workout.phase = 'work';
                        workout.timeLeft = workout.workDuration;
                    } 
                    else {
                        stopTimer();
                        setStatus('standby');
                        statusMsg.innerText = '🎉 pyramid complete!';
                        return;
                    }
                }
            }
        }
        
        else if (workout.type === 'density') {
            if (workout.phase === 'work') {
                if (workout.currentExercise < workout.totalExercises) {
                    workout.currentExercise++;
                } else {
                    if (workout.currentRound < workout.totalRounds) {
                        workout.currentRound++;
                        workout.currentExercise = 1;
                        workout.phase = 'roundBreak';
                        workout.timeLeft = workout.breakDuration;
                    } else {
                        stopTimer();
                        setStatus('standby');
                        statusMsg.innerText = '🎉 density complete!';
                        return;
                    }
                }
            } else if (workout.phase === 'roundBreak') {
                workout.phase = 'work';
                workout.timeLeft = workout.workDuration;
            }
        }
        
        else if (workout.type === 'simple') {
            if (workout.phase === 'work') {
                if (workout.restDuration > 0) {
                    workout.phase = 'rest';
                    workout.timeLeft = workout.restDuration;
                } else if (workout.currentRound < workout.totalRounds) {
                    workout.currentRound++;
                    workout.timeLeft = workout.workDuration;
                } else {
                    stopTimer();
                    setStatus('standby');
                    statusMsg.innerText = '✅ complete!';
                    return;
                }
            } else if (workout.phase === 'rest') {
                if (workout.currentRound < workout.totalRounds) {
                    workout.currentRound++;
                    workout.phase = 'work';
                    workout.timeLeft = workout.workDuration;
                } else {
                    stopTimer();
                    setStatus('standby');
                    statusMsg.innerText = '✅ complete!';
                    return;
                }
            }
        }
        
        // Update status badge with new phase when running
        if (isRunning) {
            setStatus('running');
        }
        updateDisplay();
        updateStructureInfo();
    }

    function startTimer() {
        if (isRunning) return;
        if (timerInterval) clearInterval(timerInterval);
        
        isRunning = true;
        setStatus('running');

        timerInterval = setInterval(() => {
            if (workout.timeLeft <= 0) {
                nextPhase();
            } else {
                workout.timeLeft -= 0.01;
                updateDisplay();
            }
        }, 10);
    }

    function pauseTimer() {
        if (!isRunning) return;
        clearInterval(timerInterval);
        timerInterval = null;
        isRunning = false;
        setStatus('paused');
    }

    function resetTimer() {
        stopTimer();
        
        if (currentMode === 'presets' && activePreset) {
            loadPreset(activePreset);
        } else if (currentMode === 'custom') {
            loadCustomTimer();
        }
        
        setStatus('reset');
        
        setTimeout(() => {
            if (!isRunning) setStatus('standby');
        }, 1000);
    }

    function loadCustomTimer() {
        const activeCustomTab = document.querySelector('.custom-tab-btn.active');
        const customType = activeCustomTab ? activeCustomTab.dataset.customType : 'rounds';
        
        workout.type = customType === 'rounds' ? 'roundsBased' : 
                      customType === 'sets' ? 'setsBased' : 'simple';
        
        if (customType === 'rounds') {
            workout.totalRounds = parseInt(customRounds.value) || 4;
            workout.totalExercises = parseInt(customExPerRound.value) || 4;
            workout.totalSets = parseInt(customSetsPerEx.value) || 2;
            workout.currentRound = 1;
            workout.currentExercise = 1;
            workout.currentSet = 1;
            workout.workDuration = parseInt(customWorkRounds.value) || 20;
            workout.restDuration = parseInt(customRestRounds.value) || 10;
            workout.breakDuration = parseInt(customRoundBreak.value) || 30;
            workout.timeLeft = workout.workDuration;
            workout.phase = 'work';
            structureInfo.innerText = `${workout.totalRounds} rounds · ${workout.totalExercises} exercises · ${workout.totalSets} sets`;
            
        } else if (customType === 'sets') {
            workout.totalSetGroups = parseInt(customSets.value) || 3;
            workout.totalExercises = parseInt(customExPerSet.value) || 8;
            workout.currentSetGroup = 1;
            workout.currentExercise = 1;
            workout.workDuration = parseInt(customWorkSets.value) || 40;
            workout.restDuration = parseInt(customRestSets.value) || 20;
            workout.breakDuration = parseInt(customSetBreak.value) || 60;
            workout.timeLeft = workout.workDuration;
            workout.phase = 'work';
            structureInfo.innerText = `${workout.totalSetGroups} sets · ${workout.totalExercises} exercises each`;
            
        } else if (customType === 'simple') {
            const workMins = parseInt(customWorkMin.value) || 0;
            const workSecs = parseInt(customWorkSec.value) || 0;
            workout.totalRounds = parseInt(customSimpleRounds.value) || 1;
            workout.currentRound = 1;
            workout.workDuration = (workMins * 60) + workSecs;
            workout.restDuration = parseInt(customRestSimple.value) || 0;
            workout.timeLeft = workout.workDuration;
            workout.phase = 'work';
            structureInfo.innerText = `${Math.floor(workout.workDuration/60)}:${(workout.workDuration%60).toString().padStart(2,'0')} work · ${workout.restDuration}s rest · ${workout.totalRounds} rounds`;
        }
        
        updateDisplay();
        updateStructureInfo();
        statusMsg.innerText = '✨ custom timer loaded';
    }

    // ========== EVENT LISTENERS ==========
    
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

    categoryPills.forEach(pill => {
        pill.addEventListener('click', () => {
            categoryPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            activeCategory = pill.dataset.category;
            renderPresets(activeCategory);
        });
    });

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
                structureInfo.style.display = 'block';
                document.getElementById('monthCounter').classList.remove('visible');
                
            } else if (tab === 'custom') {
                structureInfo.style.display = 'block';
                loadCustomTimer();
                setStatus('standby');
                
            } else {
                structureInfo.style.display = 'block';
                if (activePreset) loadPreset(activePreset);
                else {
                    renderPresets(activeCategory);
                    setStatus('standby');
                }
            }
        });
    });

    customTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            customTabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const type = btn.dataset.customType;
            
            customRoundsPanel.style.display = type === 'rounds' ? 'block' : 'none';
            customSetsPanel.style.display = type === 'sets' ? 'block' : 'none';
            customSimplePanel.style.display = type === 'simple' ? 'block' : 'none';
            
            if (currentMode === 'custom') {
                loadCustomTimer();
            }
        });
    });

    startBtn.addEventListener('click', () => {
        if (currentMode === 'stopwatch') {
            startStopwatch();
        } else {
            startTimer();
        }
    });

    pauseBtn.addEventListener('click', () => {
        if (currentMode === 'stopwatch') {
            pauseStopwatch();
        } else {
            pauseTimer();
        }
    });

    resetBtn.addEventListener('click', () => {
        if (currentMode === 'stopwatch') {
            resetStopwatch();
        } else {
            resetTimer();
        }
    });

    const customInputs = [
        customRounds, customExPerRound, customSetsPerEx, customWorkRounds, customRestRounds, customRoundBreak,
        customSets, customExPerSet, customWorkSets, customRestSets, customSetBreak,
        customRestSimple, customSimpleRounds, customWorkMin, customWorkSec
    ];
    
    customInputs.forEach(input => {
        if (input) {
            input.addEventListener('change', () => {
                if (currentMode === 'custom') {
                    loadCustomTimer();
                }
            });
        }
    });

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
