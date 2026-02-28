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
    
    // Current workout state
    let workout = {
        type: 'simple',
        // For roundsBased
        currentRound: 1,
        totalRounds: 1,
        currentExercise: 1,
        totalExercises: 1,
        currentSet: 1,
        totalSets: 1,
        // For setsBased
        currentSetGroup: 1,
        totalSetGroups: 1,
        // Timing
        phase: 'work', // work, rest, roundBreak, setBreak
        timeLeft: 0,
        workDuration: 0,
        restDuration: 0,
        breakDuration: 0,
        // For pyramid
        pyramidCurrentWork: 20
    };

        // ========== STOPWATCH VARIABLES ==========
    let stopwatchTime = 0; // in seconds
    let stopwatchRunning = false;
    let stopwatchInterval = null;
    let stopwatchMonthCounter = 0;
    const MONTH_THRESHOLD = 744 * 60 * 60; // 744 hours in seconds

    // DOM elements
    const timerDisplay = document.getElementById('timerDisplay');
    const roundDisplay = document.getElementById('roundDisplay');
    const structureInfo = document.getElementById('structureInfo');
    const exerciseInfo = document.getElementById('exerciseInfo');
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
            // For stopwatch: show with milliseconds
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
            // For regular timer
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
    }

    function updateDisplay() {
        timerDisplay.innerText = formatTime(workout.timeLeft);
    }

    function updateInfoDisplays() {
        // Update round info
        let roundText = '';
        if (workout.type === 'roundsBased') {
            roundText = `round ${workout.currentRound}/${workout.totalRounds} · ex ${workout.currentExercise}/${workout.totalExercises} · set ${workout.currentSet}/${workout.totalSets}`;
        } else if (workout.type === 'setsBased') {
            roundText = `set ${workout.currentSetGroup}/${workout.totalSetGroups} · ex ${workout.currentExercise}/${workout.totalExercises}`;
        } else if (workout.type === 'pyramid') {
            roundText = `round ${workout.currentRound}/${workout.totalRounds} · ex ${workout.currentExercise}/${workout.totalExercises}`;
        } else if (workout.type === 'density') {
            roundText = `block ${workout.currentRound}/${workout.totalRounds} · ex ${workout.currentExercise}/${workout.totalExercises}`;
        } else if (workout.type === 'amrap' || workout.type === 'simple') {
            roundText = `round ${workout.currentRound}/${workout.totalRounds}`;
        }
        
        if (workout.phase) {
            roundText += ` · ${workout.phase}`;
        }
        roundDisplay.innerText = roundText;

        // Update exercise info
        if (workout.type !== 'amrap' && workout.type !== 'simple' && workout.totalExercises > 1) {
            exerciseInfo.innerText = `exercise ${workout.currentExercise} of ${workout.totalExercises}`;
        } else {
            exerciseInfo.innerText = '';
        }
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
        stopTimer();
        
        // Set workout type and initialize state
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
        updateInfoDisplays();
        statusMsg.innerText = `📌 loaded: ${preset.name}`;
    }

    // ========== TIMER LOGIC ==========
    function nextPhase() {
        if (workout.type === 'amrap') {
            // AMRAP just counts down, when it hits 0, workout is done
            if (workout.timeLeft <= 0) {
                stopTimer();
                statusMsg.innerText = '✅ AMRAP complete!';
                return;
            }
        }
        
        else if (workout.type === 'roundsBased') {
            if (workout.phase === 'work') {
                // Move to rest
                workout.phase = 'rest';
                workout.timeLeft = workout.restDuration;
            } 
            else if (workout.phase === 'rest') {
                // After rest, move to next exercise/set/round
                if (workout.currentSet < workout.totalSets) {
                    // Same exercise, next set
                    workout.currentSet++;
                    workout.phase = 'work';
                    workout.timeLeft = workout.workDuration;
                } 
                else {
                    // All sets for this exercise done, move to next exercise
                    workout.currentSet = 1;
                    
                    if (workout.currentExercise < workout.totalExercises) {
                        // Next exercise in same round
                        workout.currentExercise++;
                        workout.phase = 'work';
                        workout.timeLeft = workout.workDuration;
                    } 
                    else {
                        // All exercises in round done
                        if (workout.currentRound < workout.totalRounds) {
                            // Move to next round with break
                            workout.currentRound++;
                            workout.currentExercise = 1;
                            workout.phase = 'roundBreak';
                            workout.timeLeft = workout.breakDuration;
                        } 
                        else {
                            // Workout complete
                            stopTimer();
                            statusMsg.innerText = '🎉 workout complete!';
                            return;
                        }
                    }
                }
            } 
            else if (workout.phase === 'roundBreak') {
                // After round break, start next round
                workout.phase = 'work';
                workout.timeLeft = workout.workDuration;
            }
        }
        
        else if (workout.type === 'setsBased') {
            if (workout.phase === 'work') {
                // Move to rest
                workout.phase = 'rest';
                workout.timeLeft = workout.restDuration;
            } 
            else if (workout.phase === 'rest') {
                // After rest, move to next exercise or set
                if (workout.currentExercise < workout.totalExercises) {
                    // Next exercise in same set
                    workout.currentExercise++;
                    workout.phase = 'work';
                    workout.timeLeft = workout.workDuration;
                } 
                else {
                    // All exercises in set done
                    if (workout.currentSetGroup < workout.totalSetGroups) {
                        // Move to next set with break
                        workout.currentSetGroup++;
                        workout.currentExercise = 1;
                        workout.phase = 'setBreak';
                        workout.timeLeft = workout.breakDuration;
                    } 
                    else {
                        // Workout complete
                        stopTimer();
                        statusMsg.innerText = '🎉 workout complete!';
                        return;
                    }
                }
            } 
            else if (workout.phase === 'setBreak') {
                // After set break, start next set
                workout.phase = 'work';
                workout.timeLeft = workout.workDuration;
            }
        }
        
        else if (workout.type === 'pyramid') {
            if (workout.phase === 'work') {
                // Move to rest
                workout.phase = 'rest';
                workout.timeLeft = workout.restDuration;
            } 
            else if (workout.phase === 'rest') {
                // After rest, move to next exercise or round
                if (workout.currentExercise < workout.totalExercises) {
                    // Next exercise in same round
                    workout.currentExercise++;
                    
                    // Update pyramid work time based on round
                    if (workout.currentRound <= workout.pyramidPeakRound) {
                        workout.workDuration = workout.pyramidBase + (workout.currentRound - 1) * 10;
                    } else {
                        workout.workDuration = workout.pyramidPeak - (workout.currentRound - workout.pyramidPeakRound) * 10;
                    }
                    
                    workout.phase = 'work';
                    workout.timeLeft = workout.workDuration;
                } 
                else {
                    // All exercises in round done
                    if (workout.currentRound < workout.totalRounds) {
                        // Move to next round
                        workout.currentRound++;
                        workout.currentExercise = 1;
                        
                        // Update work time for new round
                        if (workout.currentRound <= workout.pyramidPeakRound) {
                            workout.workDuration = workout.pyramidBase + (workout.currentRound - 1) * 10;
                        } else {
                            workout.workDuration = workout.pyramidPeak - (workout.currentRound - workout.pyramidPeakRound) * 10;
                        }
                        
                        workout.phase = 'work';
                        workout.timeLeft = workout.workDuration;
                    } 
                    else {
                        // Workout complete
                        stopTimer();
                        statusMsg.innerText = '🎉 pyramid complete!';
                        return;
                    }
                }
            }
        }
        
        else if (workout.type === 'density') {
            if (workout.phase === 'work') {
                // Block time is up, move to next exercise within block? 
                // For density, each block is continuous work through exercises
                if (workout.currentExercise < workout.totalExercises) {
                    workout.currentExercise++;
                    workout.timeLeft = workout.workDuration; // Reset block timer? No, block continues
                    // Actually for density, it's continuous, so we don't change timeLeft
                    // Just update the exercise display
                } else {
                    // All exercises in block done
                    if (workout.currentRound < workout.totalRounds) {
                        workout.currentRound++;
                        workout.currentExercise = 1;
                        workout.phase = 'roundBreak';
                        workout.timeLeft = workout.breakDuration;
                    } else {
                        stopTimer();
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
                    statusMsg.innerText = '✅ complete!';
                    return;
                }
            }
        }
        
        updateDisplay();
        updateInfoDisplays();
    }

    function startTimer() {
        if (isRunning) return;
        if (timerInterval) clearInterval(timerInterval);
        isRunning = true;
        statusMsg.innerText = '▶ running';

        timerInterval = setInterval(() => {
            if (workout.timeLeft <= 0) {
                nextPhase();
            } else {
                workout.timeLeft--;
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
            loadCustomTimer();
        } else if (currentMode === 'stopwatch') {
            workout.timeLeft = 0;
            workout.type = 'stopwatch';
            roundDisplay.innerText = 'stopwatch';
            exerciseInfo.innerText = '';
            structureInfo.innerText = '';
            updateDisplay();
        }
        
        statusMsg.innerText = '↺ reset · ready';
    }

    function loadCustomTimer() {
    // ========== CUSTOM TIMER FUNCTIONS ==========
    let customTimerValue = 0;
    let customTimerRunning = false;
    let customTimerInterval = null;
    let customPausedTime = null;
    
    // Custom workout state
    let customWorkout = {
        type: '',
        phase: 'work',
        currentRound: 1,
        totalRounds: 1,
        currentSet: 1,
        totalSets: 1,
        currentExercise: 1,
        totalExercises: 1,
        workDuration: 0,
        restDuration: 0,
        breakDuration: 0
    };
    
    // Custom timer DOM elements
    const emptyState = document.getElementById('emptyState');
    const roundFields = document.getElementById('customRoundsPanel');
    const setFields = document.getElementById('customSetsPanel');
    const simpleFields = document.getElementById('customSimplePanel');
    const errorMsg = document.getElementById('errorMessage');
    
    // Custom timer input elements
    const roundRounds = document.getElementById('roundRounds');
    const roundSets = document.getElementById('roundSets');
    const roundExercises = document.getElementById('roundExercises');
    const roundWorkMin = document.getElementById('roundWorkMin');
    const roundWorkSec = document.getElementById('roundWorkSec');
    const roundRestMin = document.getElementById('roundRestMin');
    const roundRestSec = document.getElementById('roundRestSec');
    const roundBreakMin = document.getElementById('roundBreakMin');
    const roundBreakSec = document.getElementById('roundBreakSec');
    
    const setGroups = document.getElementById('setGroups');
    const setExercises = document.getElementById('setExercises');
    const setWorkMin = document.getElementById('setWorkMin');
    const setWorkSec = document.getElementById('setWorkSec');
    const setRestMin = document.getElementById('setRestMin');
    const setRestSec = document.getElementById('setRestSec');
    const setBreakMin = document.getElementById('setBreakMin');
    const setBreakSec = document.getElementById('setBreakSec');
    
    const simpleRounds = document.getElementById('simpleRounds');
    const simpleWorkMin = document.getElementById('simpleWorkMin');
    const simpleWorkSec = document.getElementById('simpleWorkSec');
    const simpleRestMin = document.getElementById('simpleRestMin');
    const simpleRestSec = document.getElementById('simpleRestSec');
    
    // Custom timer helper functions
    function updateCustomTimerDisplay() {
        timerDisplay.innerText = formatTime(customTimerValue, false);
        
        if (customTimerValue < 6 && customTimerValue > 0) {
            timerDisplay.classList.add('warning');
        } else {
            timerDisplay.classList.remove('warning');
        }
    }
    
    function updateCustomStructureInfo() {
        let html = '';
        
        if (customWorkout.type === 'simple') {
            html = `Round ${customWorkout.currentRound} / ${customWorkout.totalRounds}`;
        } else if (customWorkout.type === 'sets') {
            html = `Set ${customWorkout.currentSet} / ${customWorkout.totalSets} │ Ex ${customWorkout.currentExercise} / ${customWorkout.totalExercises}`;
        } else if (customWorkout.type === 'rounds') {
            html = `Round ${customWorkout.currentRound} / ${customWorkout.totalRounds} │ Set ${customWorkout.currentSet} / ${customWorkout.totalSets} │ Ex ${customWorkout.currentExercise} / ${customWorkout.totalExercises}`;
        } else {
            html = 'Ready';
        }
        
        structureInfo.innerHTML = `<span class="progress-item">${html}</span>`;
    }
    
    function updateCustomPhaseStatus() {
        if (customWorkout.phase === 'work') {
            statusMsg.textContent = '▶ WORK';
        } else if (customWorkout.phase === 'rest') {
            statusMsg.textContent = '▶ REST';
        } else if (customWorkout.phase === 'break') {
            statusMsg.textContent = '▶ BREAK';
        }
    }
    
    function startCustomBlinking() {
        statusMsg.classList.add('blinking');
    }
    
    function stopCustomBlinking() {
        statusMsg.classList.remove('blinking');
    }
    
    function setCustomStatus(status) {
        stopCustomBlinking();
        
        if (status === 'standby') {
            statusMsg.textContent = '⚪ Standby';
            statusMsg.className = 'status-badge standby';
        } else if (status === 'paused') {
            statusMsg.textContent = '⏸ Paused';
            statusMsg.className = 'status-badge paused';
        } else if (status === 'reset') {
            statusMsg.textContent = '↺ Reset — Ready';
            statusMsg.className = 'status-badge reset';
        } else if (status === 'running') {
            updateCustomPhaseStatus();
            startCustomBlinking();
            statusMsg.className = 'status-badge running';
        }
    }
    
    function clearCustomFields() {
        document.querySelectorAll('#customTab input').forEach(input => {
            input.value = '';
            input.classList.remove('error');
        });
    }
    
    function loadCustomWorkoutFromFields() {
        const activeCustomTab = document.querySelector('.custom-tab-btn.active');
        const customType = activeCustomTab ? activeCustomTab.dataset.customType : 'rounds';
        
        customWorkout.type = customType;
        
        if (customType === 'rounds') {
            customWorkout.totalRounds = parseInt(roundRounds?.value) || 1;
            customWorkout.totalSets = parseInt(roundSets?.value) || 1;
            customWorkout.totalExercises = parseInt(roundExercises?.value) || 1;
            
            const workMin = parseInt(roundWorkMin?.value) || 0;
            const workSec = parseInt(roundWorkSec?.value) || 0;
            customWorkout.workDuration = (workMin * 60) + workSec;
            
            const restMin = parseInt(roundRestMin?.value) || 0;
            const restSec = parseInt(roundRestSec?.value) || 0;
            customWorkout.restDuration = (restMin * 60) + restSec;
            
            const breakMin = parseInt(roundBreakMin?.value) || 0;
            const breakSec = parseInt(roundBreakSec?.value) || 0;
            customWorkout.breakDuration = (breakMin * 60) + breakSec;
            
        } else if (customType === 'sets') {
            customWorkout.totalSets = parseInt(setGroups?.value) || 1;
            customWorkout.totalExercises = parseInt(setExercises?.value) || 1;
            
            const workMin = parseInt(setWorkMin?.value) || 0;
            const workSec = parseInt(setWorkSec?.value) || 0;
            customWorkout.workDuration = (workMin * 60) + workSec;
            
            const restMin = parseInt(setRestMin?.value) || 0;
            const restSec = parseInt(setRestSec?.value) || 0;
            customWorkout.restDuration = (restMin * 60) + restSec;
            
            const breakMin = parseInt(setBreakMin?.value) || 0;
            const breakSec = parseInt(setBreakSec?.value) || 0;
            customWorkout.breakDuration = (breakMin * 60) + breakSec;
            
        } else if (customType === 'simple') {
            customWorkout.totalRounds = parseInt(simpleRounds?.value) || 1;
            
            const workMin = parseInt(simpleWorkMin?.value) || 0;
            const workSec = parseInt(simpleWorkSec?.value) || 0;
            customWorkout.workDuration = (workMin * 60) + workSec;
            
            const restMin = parseInt(simpleRestMin?.value) || 0;
            const restSec = parseInt(simpleRestSec?.value) || 0;
            customWorkout.restDuration = (restMin * 60) + restSec;
        }
        
        customWorkout.currentRound = 1;
        customWorkout.currentSet = 1;
        customWorkout.currentExercise = 1;
        customWorkout.phase = 'work';
        customTimerValue = customWorkout.workDuration;
        customPausedTime = null;
        
        updateCustomTimerDisplay();
        updateCustomStructureInfo();
    }
    
    function validateCustomFields(container) {
        const inputs = container.querySelectorAll('.required');
        let isValid = true;
        
        inputs.forEach(input => {
            if (input.value === '') {
                input.classList.add('error');
                isValid = false;
            } else {
                input.classList.remove('error');
            }
        });
        
        return isValid;
    }
    
    function customNextPhase() {
        if (customWorkout.type === 'simple') {
            if (customWorkout.phase === 'work') {
                customWorkout.phase = 'rest';
                customTimerValue = customWorkout.restDuration;
            } else if (customWorkout.phase === 'rest') {
                if (customWorkout.currentRound < customWorkout.totalRounds) {
                    customWorkout.currentRound++;
                    customWorkout.phase = 'work';
                    customTimerValue = customWorkout.workDuration;
                } else {
                    stopCustomWorkout();
                    return;
                }
            }
        } else if (customWorkout.type === 'sets') {
            if (customWorkout.phase === 'work') {
                customWorkout.phase = 'rest';
                customTimerValue = customWorkout.restDuration;
            } else if (customWorkout.phase === 'rest') {
                if (customWorkout.currentExercise < customWorkout.totalExercises) {
                    customWorkout.currentExercise++;
                    customWorkout.phase = 'work';
                    customTimerValue = customWorkout.workDuration;
                } else {
                    if (customWorkout.currentSet < customWorkout.totalSets) {
                        customWorkout.currentSet++;
                        customWorkout.currentExercise = 1;
                        customWorkout.phase = 'break';
                        customTimerValue = customWorkout.breakDuration;
                    } else {
                        stopCustomWorkout();
                        return;
                    }
                }
            } else if (customWorkout.phase === 'break') {
                customWorkout.phase = 'work';
                customTimerValue = customWorkout.workDuration;
            }
        } else if (customWorkout.type === 'rounds') {
            if (customWorkout.phase === 'work') {
                customWorkout.phase = 'rest';
                customTimerValue = customWorkout.restDuration;
            } else if (customWorkout.phase === 'rest') {
                if (customWorkout.currentExercise < customWorkout.totalExercises) {
                    customWorkout.currentExercise++;
                    customWorkout.phase = 'work';
                    customTimerValue = customWorkout.workDuration;
                } else {
                    if (customWorkout.currentSet < customWorkout.totalSets) {
                        customWorkout.currentSet++;
                        customWorkout.currentExercise = 1;
                        customWorkout.phase = 'work';
                        customTimerValue = customWorkout.workDuration;
                    } else {
                        if (customWorkout.currentRound < customWorkout.totalRounds) {
                            customWorkout.currentRound++;
                            customWorkout.currentSet = 1;
                            customWorkout.currentExercise = 1;
                            customWorkout.phase = 'break';
                            customTimerValue = customWorkout.breakDuration;
                        } else {
                            stopCustomWorkout();
                            return;
                        }
                    }
                }
            } else if (customWorkout.phase === 'break') {
                customWorkout.phase = 'work';
                customTimerValue = customWorkout.workDuration;
            }
        }
        
        updateCustomPhaseStatus();
        updateCustomStructureInfo();
        updateCustomTimerDisplay();
    }
    
    function stopCustomWorkout() {
        if (customTimerInterval) {
            clearInterval(customTimerInterval);
            customTimerInterval = null;
        }
        customTimerRunning = false;
        setCustomStatus('standby');
        structureInfo.innerHTML = '<span class="progress-item">Complete!</span>';
    }
    
    // Custom tab switching
    customTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            customTabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const type = btn.dataset.customType;
            
            customRoundsPanel.style.display = type === 'rounds' ? 'block' : 'none';
            customSetsPanel.style.display = type === 'sets' ? 'block' : 'none';
            customSimplePanel.style.display = type === 'simple' ? 'block' : 'none';
            
            if (currentMode === 'custom') {
                clearCustomFields();
                customWorkout.type = '';
                customTimerValue = 0;
                customPausedTime = null;
                updateCustomTimerDisplay();
                setCustomStatus('standby');
                structureInfo.innerHTML = '<span class="progress-item">Ready</span>';
                errorMsg.classList.remove('visible');
            }
        });
    });
    
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

            // Stop any running timers
            stopTimer();
            if (stopwatchRunning) {
                pauseStopwatch();
            }
            if (customTimerRunning) {
                clearInterval(customTimerInterval);
                customTimerRunning = false;
            }
            
            if (tab === 'stopwatch') {
                // Stopwatch mode
                workout.type = 'stopwatch';
                resetStopwatch();
                structureInfo.innerHTML = '<span class="progress-item">Stopwatch</span>';
                
                statusMsg.innerText = '⏳ Standby';
                statusMsg.className = 'status-badge standby';
                document.getElementById('monthCounter').classList.remove('visible');
                
            } else if (tab === 'custom') {
                // Custom mode
                structureInfo.innerHTML = '<span class="progress-item">Ready</span>';
                setCustomStatus('standby');
                customTimerValue = 0;
                updateCustomTimerDisplay();
                errorMsg.classList.remove('visible');
                emptyState.classList.remove('hidden');
                
            } else {
                // Presets mode
                structureInfo.style.display = 'block';
                if (activePreset) loadPreset(activePreset);
                else {
                    renderPresets(activeCategory);
                    statusMsg.innerText = 'ready · select a preset';
                    statusMsg.className = 'status-badge';
                }
            }
            
            // Hide month counter when not in stopwatch mode
            if (tab !== 'stopwatch') {
                document.getElementById('monthCounter').classList.remove('visible');
            }
        });
    });

    // Control buttons
    startBtn.addEventListener('click', () => {
        if (currentMode === 'stopwatch') {
            startStopwatch();
        } else if (currentMode === 'custom') {
            if (!document.querySelector('.custom-tab-btn.active')) {
                emptyState.style.border = '1px solid #B07BAC';
                emptyState.style.background = 'rgba(176, 123, 172, 0.1)';
                setTimeout(() => {
                    emptyState.style.border = '1px dashed rgba(176, 123, 172, 0.3)';
                    emptyState.style.background = 'rgba(255, 255, 255, 0.2)';
                }, 500);
                return;
            }
            
            let currentPanel;
            const activeType = document.querySelector('.custom-tab-btn.active').dataset.customType;
            if (activeType === 'rounds') currentPanel = customRoundsPanel;
            else if (activeType === 'sets') currentPanel = customSetsPanel;
            else currentPanel = customSimplePanel;
            
            if (validateCustomFields(currentPanel)) {
                errorMsg.classList.remove('visible');
                
                if (!customTimerRunning) {
                    if (customPausedTime !== null) {
                        customTimerValue = customPausedTime;
                        customPausedTime = null;
                    } else {
                        loadCustomWorkoutFromFields();
                    }
                    
                    customTimerRunning = true;
                    setCustomStatus('running');
                    
                    if (customTimerInterval) clearInterval(customTimerInterval);
                    customTimerInterval = setInterval(() => {
                        customTimerValue -= 0.01;
                        
                        if (customTimerValue <= 0) {
                            customNextPhase();
                        }
                        
                        updateCustomTimerDisplay();
                    }, 10);
                }
            } else {
                errorMsg.classList.add('visible');
            }
        } else {
            startTimer();
        }
    });

    pauseBtn.addEventListener('click', () => {
        if (currentMode === 'stopwatch') {
            pauseStopwatch();
        } else if (currentMode === 'custom') {
            if (customTimerRunning) {
                clearInterval(customTimerInterval);
                customTimerInterval = null;
                customTimerRunning = false;
                customPausedTime = customTimerValue;
                setCustomStatus('paused');
            }
        } else {
            pauseTimer();
        }
    });

    resetBtn.addEventListener('click', () => {
        if (currentMode === 'stopwatch') {
            resetStopwatch();
        } else if (currentMode === 'custom') {
            if (customTimerRunning) {
                clearInterval(customTimerInterval);
                customTimerInterval = null;
                customTimerRunning = false;
            }
            
            loadCustomWorkoutFromFields();
            customPausedTime = null;
            setCustomStatus('reset');
            
            setTimeout(() => {
                if (!customTimerRunning) setCustomStatus('standby');
            }, 1000);
        } else {
            resetTimer();
        }
    });

        // ========== STOPWATCH FUNCTIONS ==========
    function startStopwatch() {
        if (stopwatchRunning) return;
        
        stopwatchRunning = true;
        stopwatchInterval = setInterval(() => {
            stopwatchTime += 0.01; // Increment by 10ms
            
            // Check if we've reached 744 hours
            if (stopwatchTime >= MONTH_THRESHOLD) {
                stopwatchMonthCounter++;
                stopwatchTime = 0;
                
                // Update month counter display
                const monthCounter = document.getElementById('monthCounter');
                if (stopwatchMonthCounter > 0) {
                    monthCounter.textContent = `${stopwatchMonthCounter} month${stopwatchMonthCounter > 1 ? 's' : ''} +`;
                    monthCounter.classList.add('visible');
                }
            }
            
            updateStopwatchDisplay();
        }, 10); // Update every 10ms for smooth milliseconds
        
        statusMsg.innerText = '▶️ Running...';
        statusMsg.className = 'status-badge running';
    }

    function pauseStopwatch() {
        if (!stopwatchRunning) return;
        
        clearInterval(stopwatchInterval);
        stopwatchRunning = false;
        statusMsg.innerText = '⏸ Paused';
        statusMsg.className = 'status-badge paused';
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
        statusMsg.innerText = '✅ Reset — Ready';
        statusMsg.className = 'status-badge reset';
    }

    function updateStopwatchDisplay() {
        timerDisplay.innerText = formatTime(stopwatchTime, true);
    }

    // Input validation for min/sec fields
    document.querySelectorAll('#customTab input[type="text"]').forEach(input => {
        input.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '');
            if (this.value.length > 2) {
                this.value = this.value.slice(0, 2);
            }
        });
    });
        
    // ========== INITIALIZATION ==========
    renderPresets('all');
    loadPreset(presets[0]); // Load AMRAP by default
})();
