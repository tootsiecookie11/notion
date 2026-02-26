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
            desc: '4 rounds · 3 sets x  2 exercises · 40s/20s work · 30s rnd break', 
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
            desc: '4 rounds · 2 sets x 4 exercises · 20s/10s work · 30s rnd break', 
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
            desc: '2 sets x 10 exercises · 55s/15s work · 60s set break', 
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
            desc: '3 sets x 8 exercises · 40s/20s work · 60s set break', 
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
            desc: '45 sec work · 5 sec rest', 
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
    const customRoundsPanel = document.getElementById('customRounds');
    const customSetsPanel = document.getElementById('customSets');
    const customSimplePanel = document.getElementById('customSimple');

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
    function formatTime(seconds) {
        if (seconds < 0) seconds = 0;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
                            workout.workDuration = workout
