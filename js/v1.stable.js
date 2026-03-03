(function() {
    // ============================================
    // ===== GLOBAL STATE & UTILITIES =====
    // ============================================
    
    // Global state
    let currentMode = 'presets';
    let timerInterval = null;
    let timerRunning = false;
    let pausedTime = null;
    
    // Global workout state (shared between preset and custom)
    let workout = {
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
        breakDuration: 0,
        timeLeft: 0
    };

    // Global DOM elements
    const timerDisplay = document.getElementById('timerDisplay');
    const structureInfo = document.getElementById('structureInfo');
    const statusMsg = document.getElementById('statusMessage');
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const resetBtn = document.getElementById('resetBtn');
    const tabBtns = document.querySelectorAll('.tab-btn');

    // Tab containers
    const presetsTab = document.getElementById('presetsTab');
    const customTab = document.getElementById('customTab');
    const stopwatchTab = document.getElementById('stopwatchTab');

    // ============================================
    // ===== GLOBAL HELPER FUNCTIONS =====
    // ============================================
    
    function formatTime(seconds, showMilliseconds = false) {
        if (seconds < 0) seconds = 0;
        
        const alwaysShowMs = (currentMode === 'custom' && seconds < 60) || showMilliseconds;
    
        if (alwaysShowMs || showMilliseconds) {
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
            const secs = Math.floor(seconds % 60);
            return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
    }

    function updateTimerDisplay() {
        let displayValue = 0;
        
        if (currentMode === 'stopwatch') {
            displayValue = stopwatchModule.stopwatchTime;
        } else {
            // For countdown timers that are running, add 1 second offset to show the full starting value
            displayValue = workout.timeLeft || 0;
            if (timerRunning && workout.timeLeft > 0) {
                displayValue = workout.timeLeft + 1.0;
            }
        }
        
        timerDisplay.textContent = formatTime(displayValue, currentMode === 'stopwatch' || (currentMode === 'custom' && displayValue < 60));
        
        // Warning at 5 seconds
        if (currentMode !== 'stopwatch') {
            if ((workout.timeLeft < 5 && workout.timeLeft > 0)) {
                timerDisplay.classList.add('warning');
            } else {
                timerDisplay.classList.remove('warning');
            }
        } else {
            timerDisplay.classList.remove('warning');
        }
    }

    function updatePhaseStatus() {
        if (workout.phase === 'work') {
            statusMsg.textContent = '▶ WORK';
        } else if (workout.phase === 'rest') {
            statusMsg.textContent = '▶ REST';
        } else if (workout.phase === 'break') {
            statusMsg.textContent = '▶ BREAK';
        }
    }

    function startBlinking() {
        statusMsg.classList.add('blinking');
    }

    function stopBlinking() {
        statusMsg.classList.remove('blinking');
    }

    function setStatus(status) {
        stopBlinking();
        
        if (status === 'standby') {
            statusMsg.textContent = '⏳ Standby';
        } else if (status === 'paused') {
            statusMsg.textContent = '✋ Paused';
        } else if (status === 'reset') {
            statusMsg.textContent = '♻️ Reset — Ready';
        } else if (status === 'running') {
            updatePhaseStatus();
            startBlinking();
        } else if (status === 'complete') {
            statusMsg.textContent = '🎉 Workout Done';
            statusMsg.classList.remove('blinking');
        }
    }

    function stopTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        timerRunning = false;
    }

    function nextPhase() {
        if (workout.type === 'simple') {
            if (workout.phase === 'work') {
                workout.phase = 'rest';
                workout.timeLeft = workout.restDuration;
            } else if (workout.phase === 'rest') {
                if (workout.currentRound < workout.totalRounds) {
                    workout.currentRound++;
                    workout.phase = 'work';
                    workout.timeLeft = workout.workDuration;
                } else {
                    stopWorkout();
                    return;
                }
            }
        } else if (workout.type === 'setsBased') {
            if (workout.phase === 'work') {
                workout.phase = 'rest';
                workout.timeLeft = workout.restDuration;
            } else if (workout.phase === 'rest') {
                if (workout.currentExercise < workout.totalExercises) {
                    workout.currentExercise++;
                    workout.phase = 'work';
                    workout.timeLeft = workout.workDuration;
                } else {
                    if (workout.currentSet < workout.totalSets) {
                        workout.currentSet++;
                        workout.currentExercise = 1;
                        workout.phase = 'break';
                        workout.timeLeft = workout.breakDuration;
                    } else {
                        stopWorkout();
                        return;
                    }
                }
            } else if (workout.phase === 'break') {
                workout.phase = 'work';
                workout.timeLeft = workout.workDuration;
            }
        } else if (workout.type === 'roundsBased') {
            if (workout.phase === 'work') {
                workout.phase = 'rest';
                workout.timeLeft = workout.restDuration;
            } else if (workout.phase === 'rest') {
                if (workout.currentExercise < workout.totalExercises) {
                    workout.currentExercise++;
                    workout.phase = 'work';
                    workout.timeLeft = workout.workDuration;
                } else {
                    if (workout.currentSet < workout.totalSets) {
                        workout.currentSet++;
                        workout.currentExercise = 1;
                        workout.phase = 'work';
                        workout.timeLeft = workout.workDuration;
                    } else {
                        if (workout.currentRound < workout.totalRounds) {
                            workout.currentRound++;
                            workout.currentSet = 1;
                            workout.currentExercise = 1;
                            workout.phase = 'break';
                            workout.timeLeft = workout.breakDuration;
                        } else {
                            stopWorkout();
                            return;
                        }
                    }
                }
            } else if (workout.phase === 'break') {
                workout.phase = 'work';
                workout.timeLeft = workout.workDuration;
            }
        }
        
        updatePhaseStatus();
        updateStructureInfo();
        updateTimerDisplay();
    }

    function stopWorkout() {
        stopTimer();
        setStatus('complete');
        if (structureInfo) {
            structureInfo.innerHTML = '<span class="progress-item">Congratulations!</span>';
        }
        
        setTimeout(() => {
            setStatus('standby');
            if (structureInfo) {
                structureInfo.innerHTML = '<span class="progress-item">Ready</span>';
            }
        }, 4000);
    }

    function updateStructureInfo() {
        let html = '';
        
        if (workout.type === 'simple') {
            html = `Round ${workout.currentRound} / ${workout.totalRounds}`;
        } else if (workout.type === 'setsBased') {
            html = `Set ${workout.currentSet} / ${workout.totalSets} │ Ex ${workout.currentExercise} / ${workout.totalExercises}`;
        } else if (workout.type === 'roundsBased') {
            html = `Round ${workout.currentRound} / ${workout.totalRounds} │ Set ${workout.currentSet} / ${workout.totalSets} │ Ex ${workout.currentExercise} / ${workout.totalExercises}`;
        } else {
            html = 'Ready';
        }
        
        if (structureInfo) {
            structureInfo.innerHTML = `<span class="progress-item">${html}</span>`;
        }
    }

    function startTimer() {
        if (timerRunning) return;
        
        timerRunning = true;
        setStatus('running');
        
        if (timerInterval) clearInterval(timerInterval);
        
        if (pausedTime === null) {
        }

        timerInterval = setInterval(() => {
            workout.timeLeft -= 0.01;
            
            if (workout.timeLeft <= 0) {
                workout.timeLeft = 0;
                updateTimerDisplay();
                nextPhase();
            } else {
                updateTimerDisplay();
            }
        }, 10);
    }

    // ============================================
    // ===== PRESET TAB MODULE =====
    // ============================================
    
    const presetModule = {
        // Preset library
        presets: [
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
        ],

        activePreset: null,
        presetsGrid: document.getElementById('presetsGrid'),
        categoryPills: document.querySelectorAll('.category-pill'),
        activeCategory: 'all',

        init() {
            this.renderPresets('all');
            this.attachEvents();
        },

        renderPresets(category = 'all') {
            const filtered = category === 'all' ? this.presets : this.presets.filter(p => p.category === category);
            this.presetsGrid.innerHTML = filtered.map(p => `
                <div class="preset-card" data-preset='${JSON.stringify(p).replace(/'/g, "&apos;")}'>
                    <div class="preset-name">${p.name}</div>
                    <div class="preset-desc">${p.desc}</div>
                </div>
            `).join('');
        },

        loadPreset(preset) {
            this.activePreset = preset;
            stopTimer();
            setStatus('standby');
            
            workout.type = preset.type;
            
            if (preset.type === 'amrap') {
                workout.totalRounds = 1;
                workout.currentRound = 1;
                workout.workDuration = preset.duration;
                workout.timeLeft = preset.duration;
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
                workout.timeLeft = preset.work;
                workout.phase = 'work';
                
            } else if (preset.type === 'setsBased') {
                workout.totalSets = preset.sets;
                workout.totalExercises = preset.exercisesPerSet;
                workout.currentSet = 1;
                workout.currentExercise = 1;
                workout.workDuration = preset.work;
                workout.restDuration = preset.rest;
                workout.breakDuration = preset.setBreak || 0;
                workout.timeLeft = preset.work;
                workout.phase = 'work';
                
            } else if (preset.type === 'pyramid') {
                workout.type = 'simple';
                workout.totalRounds = preset.rounds;
                workout.currentRound = 1;
                workout.workDuration = preset.pyramidBase;
                workout.restDuration = preset.rest;
                workout.timeLeft = preset.pyramidBase;
                workout.phase = 'work';
                
            } else if (preset.type === 'density') {
                workout.type = 'simple';
                workout.totalRounds = preset.rounds;
                workout.currentRound = 1;
                workout.workDuration = preset.blockDuration;
                workout.timeLeft = preset.blockDuration;
                workout.phase = 'work';
                
            } else if (preset.type === 'simple') {
                workout.totalRounds = preset.rounds || 1;
                workout.currentRound = 1;
                workout.workDuration = preset.work;
                workout.restDuration = preset.rest || 0;
                workout.timeLeft = preset.work;
                workout.phase = 'work';
            }
            
            updateTimerDisplay();
            updateStructureInfo();
            statusMsg.textContent = `📌 loaded: ${preset.name}`;
        },

        attachEvents() {
            // Preset click
            this.presetsGrid.addEventListener('click', (e) => {
                const card = e.target.closest('.preset-card');
                if (!card) return;
                const presetData = card.dataset.preset;
                if (!presetData) return;
                try {
                    const preset = JSON.parse(presetData.replace(/&apos;/g, "'"));
                    this.loadPreset(preset);
                } catch (err) { 
                    console.warn(err); 
                }
            });

            // Category filter
            this.categoryPills.forEach(pill => {
                pill.addEventListener('click', () => {
                    this.categoryPills.forEach(p => p.classList.remove('active'));
                    pill.classList.add('active');
                    this.activeCategory = pill.dataset.category;
                    this.renderPresets(this.activeCategory);
                });
            });
        }
    };

    // ============================================
    // ===== CUSTOM TAB MODULE =====
    // ============================================
    
    const customModule = {
        // DOM elements
        timerTypeSelect: document.getElementById('timerTypeSelect'),
        emptyState: document.getElementById('emptyState'),
        roundFields: document.getElementById('roundFields'),
        setFields: document.getElementById('setFields'),
        simpleFields: document.getElementById('simpleFields'),
        errorMsg: document.getElementById('errorMessage'),
        
        // Dropdown elements
        customDropdown: document.getElementById('customDropdown'),
        dropdownSelected: document.getElementById('dropdownSelected'),
        dropdownOptions: document.getElementById('dropdownOptions'),
        dropdownPlaceholder: document.getElementById('dropdownPlaceholder'),
        hiddenSelect: document.getElementById('timerTypeSelect'),
        
        selectedDropdownValue: '',
        dropdownInitialized: false,
        _inputValidationAttached: false,

        init() {
            // Reset to default state
            this.resetToDefault();
            
            // Initialize dropdown only once
            if (!this.dropdownInitialized) {
                this.initDropdown();
                this.dropdownInitialized = true;
            }
            
            this.attachEvents();
        },

        resetToDefault() {
            // Reset dropdown
            if (this.customDropdown) {
                this.customDropdown.classList.remove('open');
            }
            if (this.dropdownPlaceholder) {
                this.dropdownPlaceholder.innerHTML = '— Select timer type —';
                this.dropdownPlaceholder.classList.add('dropdown-placeholder');
                this.dropdownPlaceholder.classList.remove('selected-value');
            }
            if (this.hiddenSelect) {
                this.hiddenSelect.value = '';
            }
            
            // Reset selected value
            this.selectedDropdownValue = '';
            
            // Remove selected class from all options
            document.querySelectorAll('.dropdown-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            
            // Hide all panels
            this.hideAllPanels();
            this.clearAllFields();
        },

        hideAllPanels() {
            this.roundFields.style.display = 'none';
            this.setFields.style.display = 'none';
            this.simpleFields.style.display = 'none';
        },

        clearAllFields() {
            document.querySelectorAll('input').forEach(input => {
                input.value = '';
                input.classList.remove('error');
            });
        },

        validateFields(container) {
            const inputs = container.querySelectorAll('input.required');
            let isValid = true;
            const invalidInputs = [];
        
            inputs.forEach(input => {
                if (input.value === '') {
                    input.classList.add('error');
                    isValid = false;
                    invalidInputs.push(input);
                } else {
                    input.classList.remove('error');
                }
            });
        
            return { isValid, invalidInputs };
        },

        loadWorkoutFromFields() {
            if (this.timerTypeSelect.value === 'rounds') {
                workout.type = 'roundsBased';
                workout.totalRounds = parseInt(document.getElementById('roundRounds').value) || 1;
                workout.totalSets = parseInt(document.getElementById('roundSets').value) || 1;
                workout.totalExercises = parseInt(document.getElementById('roundExercises').value) || 1;
            
                const workMin = parseInt(document.getElementById('roundWorkMin').value) || 0;
                const workSec = parseInt(document.getElementById('roundWorkSec').value) || 0;
                workout.workDuration = (workMin * 60) + workSec;
            
                const restMin = parseInt(document.getElementById('roundRestMin').value) || 0;
                const restSec = parseInt(document.getElementById('roundRestSec').value) || 0;
                workout.restDuration = (restMin * 60) + restSec;
            
                const breakMin = parseInt(document.getElementById('roundBreakMin').value) || 0;
                const breakSec = parseInt(document.getElementById('roundBreakSec').value) || 0;
                workout.breakDuration = (breakMin * 60) + breakSec;
            
            } else if (this.timerTypeSelect.value === 'sets') {
                workout.type = 'setsBased';
                workout.totalSets = parseInt(document.getElementById('setGroups').value) || 1;
                workout.totalExercises = parseInt(document.getElementById('setExercises').value) || 1;
            
                const workMin = parseInt(document.getElementById('setWorkMin').value) || 0;
                const workSec = parseInt(document.getElementById('setWorkSec').value) || 0;
                workout.workDuration = (workMin * 60) + workSec;
            
                const restMin = parseInt(document.getElementById('setRestMin').value) || 0;
                const restSec = parseInt(document.getElementById('setRestSec').value) || 0;
                workout.restDuration = (restMin * 60) + restSec;
            
                const breakMin = parseInt(document.getElementById('setBreakMin').value) || 0;
                const breakSec = parseInt(document.getElementById('setBreakSec').value) || 0;
                workout.breakDuration = (breakMin * 60) + breakSec;
            
            } else if (this.timerTypeSelect.value === 'simple') {
                workout.type = 'simple';
                workout.totalRounds = parseInt(document.getElementById('simpleRounds').value) || 1;
            
                const workMin = parseInt(document.getElementById('simpleWorkMin').value) || 0;
                const workSec = parseInt(document.getElementById('simpleWorkSec').value) || 0;
                workout.workDuration = (workMin * 60) + workSec;
            
                const restMin = parseInt(document.getElementById('simpleRestMin').value) || 0;
                const restSec = parseInt(document.getElementById('simpleRestSec').value) || 0;
                workout.restDuration = (restMin * 60) + restSec;
                workout.breakDuration = 0;
            }
        
            workout.currentRound = 1;
            workout.currentSet = 1;
            workout.currentExercise = 1;
            workout.phase = 'work';
            workout.timeLeft = workout.workDuration;
            pausedTime = null;
        
            updateTimerDisplay();
            updateStructureInfo();
        },

        initDropdown() {
            if (!this.customDropdown || !this.dropdownSelected || !this.dropdownOptions) return;
            
            // Store reference to this module
            const self = this;

            // Toggle dropdown
            this.dropdownSelected.addEventListener('click', function(e) {
                e.stopPropagation();
                e.preventDefault();
                self.customDropdown.classList.toggle('open');
            });

            // Handle option selection
            document.querySelectorAll('.dropdown-option').forEach(option => {
                option.addEventListener('click', function(e) {
                    e.stopPropagation();
                    e.preventDefault();
                    
                    const value = this.dataset.value;
                    const text = this.textContent;
                    
                    self.selectedDropdownValue = value;
                    
                    self.dropdownPlaceholder.innerHTML = text;
                    self.dropdownPlaceholder.classList.remove('dropdown-placeholder');
                    self.dropdownPlaceholder.classList.add('selected-value');
                    
                    if (self.hiddenSelect) {
                        self.hiddenSelect.value = value;
                        const changeEvent = new Event('change', { bubbles: true });
                        self.hiddenSelect.dispatchEvent(changeEvent);
                    }
                    
                    document.querySelectorAll('.dropdown-option').forEach(opt => {
                        opt.classList.remove('selected');
                    });
                    
                    this.classList.add('selected');
                    
                    self.customDropdown.classList.remove('open');
                });
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', function(e) {
                if (self.customDropdown && !self.customDropdown.contains(e.target)) {
                    self.customDropdown.classList.remove('open');
                }
            });

            this.customDropdown.addEventListener('click', function(e) {
                e.stopPropagation();
            });
        },

        attachEvents() {
            // Remove existing listeners to prevent duplicates
            if (this._changeListener) {
                this.timerTypeSelect.removeEventListener('change', this._changeListener);
            }
            
            // Dropdown change
            this._changeListener = () => {
                this.roundFields.style.display = 'none';
                this.setFields.style.display = 'none';
                this.simpleFields.style.display = 'none';
                
                this.clearAllFields();
                
                if (this.timerTypeSelect.value === 'rounds') this.roundFields.style.display = 'block';
                else if (this.timerTypeSelect.value === 'sets') this.setFields.style.display = 'block';
                else if (this.timerTypeSelect.value === 'simple') this.simpleFields.style.display = 'block';
                
                workout.type = '';
                workout.timeLeft = 0;
                pausedTime = null;
                updateTimerDisplay();
                setStatus('standby');
                structureInfo.innerHTML = '<span class="progress-item">Ready</span>';
                this.errorMsg.classList.remove('visible', 'show-temporarily');
                this.emptyState.classList.remove('visible', 'show-temporarily');
            };
            
            this.timerTypeSelect.addEventListener('change', this._changeListener);

            // Input validation for time fields - only attach once
            if (!this._inputValidationAttached) {
                document.querySelectorAll('input[type="text"]').forEach(input => {
                    input.addEventListener('input', function() {
                        this.value = this.value.replace(/[^0-9]/g, '');
                        if (this.value.length > 2) {
                            this.value = this.value.slice(0, 2);
                        }
                    });
                });
                this._inputValidationAttached = true;
            }
        },

        handleStart() {
            if (!this.timerTypeSelect.value) {
                this.emptyState.classList.remove('visible', 'show-temporarily');
                void this.emptyState.offsetWidth;
                this.emptyState.classList.add('show-temporarily');

                setTimeout(() => {
                    this.emptyState.classList.remove('show-temporarily');
                }, 4000);
                return false;
            }
            
            let currentPanel;
            if (this.timerTypeSelect.value === 'rounds') currentPanel = this.roundFields;
            else if (this.timerTypeSelect.value === 'sets') currentPanel = this.setFields;
            else currentPanel = this.simpleFields;

            const validation = this.validateFields(currentPanel);
            
            if (validation.isValid) {
                this.errorMsg.classList.remove('visible', 'show-temporarily');
                
                if (!timerRunning) {
                    if (pausedTime !== null) {
                        workout.timeLeft = pausedTime;
                        pausedTime = null;
                    } else {
                        this.loadWorkoutFromFields();
                    }
                    
                    startTimer();
                }
                return true;
            } else {
                this.errorMsg.classList.remove('visible', 'show-temporarily');
                void this.errorMsg.offsetWidth;
                this.errorMsg.classList.add('show-temporarily');

                const invalidInputs = validation.invalidInputs;

                setTimeout(() => {
                    invalidInputs.forEach(input => {
                        input.classList.remove('error');
                    });
                }, 2500);

                setTimeout(() => {
                    this.errorMsg.classList.remove('show-temporarily');
                }, 4000);
                
                return false;
            }
        },

        reset() {
            if (this.timerTypeSelect.value) {
                stopTimer();
                this.loadWorkoutFromFields();
                pausedTime = null;
                setStatus('reset');

                document.querySelectorAll('input.error').forEach(input => {
                    input.classList.remove('error');
                });
                this.errorMsg.classList.remove('visible', 'show-temporarily');

                setTimeout(() => {
                    if (!timerRunning) setStatus('standby');
                }, 1000);
                
                return true;
            }
            return false;
        }
    };

    // ============================================
    // ===== STOPWATCH TAB MODULE =====
    // ============================================
    
    const stopwatchModule = {
        stopwatchTime: 0,
        stopwatchRunning: false,
        stopwatchInterval: null,
        MAX_TIME: 24 * 60 * 60, // 24 hours in seconds

        init() {
            this.stopwatchTime = 0;
            this.stopwatchRunning = false;
            if (this.stopwatchInterval) {
                clearInterval(this.stopwatchInterval);
                this.stopwatchInterval = null;
            }
            updateTimerDisplay();
        },

        start() {
            if (this.stopwatchRunning) return;
            if (this.stopwatchTime >= this.MAX_TIME) return; // Don't start if max time reached
            
            this.stopwatchRunning = true;
            this.stopwatchInterval = setInterval(() => {
                this.stopwatchTime += 0.01;
                
                // Stop at 24 hours - no message
                if (this.stopwatchTime >= this.MAX_TIME) {
                    this.stopwatchTime = this.MAX_TIME;
                    this.stop();
                }
                
                updateTimerDisplay();
            }, 10);
            
            statusMsg.textContent = '▶ Running...';
            statusMsg.classList.remove('blinking');
        },

        pause() {
            if (!this.stopwatchRunning) return;
            
            clearInterval(this.stopwatchInterval);
            this.stopwatchRunning = false;
            statusMsg.textContent = '⏸ Paused';
        },

        stop() {
            clearInterval(this.stopwatchInterval);
            this.stopwatchRunning = false;
        },

        reset() {
            this.stop();
            this.stopwatchTime = 0;
            updateTimerDisplay();
            statusMsg.textContent = '↺ Reset — Ready';
        }
    };

    // ============================================
    // ===== TAB SWITCHING =====
    // ============================================
    
    function switchTab(tab) {
        currentMode = tab;
        
        // Hide all tab containers
        presetsTab.style.display = 'none';
        customTab.style.display = 'none';
        stopwatchTab.style.display = 'none';

        // Stop any running timers
        stopTimer();
        stopwatchModule.stop();
        stopwatchModule.stopwatchTime = 0;
        
        
        // Show selected tab and initialize
        if (tab === 'presets') {
            presetsTab.style.display = 'block';
            structureInfo.style.display = 'flex';
            if (!presetModule.activePreset) {
                presetModule.renderPresets('all');
            }
            
        } else if (tab === 'custom') {
            customTab.style.display = 'block';
            structureInfo.style.display = 'flex';
            
            // Reset custom module to default state
            customModule.resetToDefault();
            
            structureInfo.innerHTML = '<span class="progress-item">Ready</span>';
            statusMsg.textContent = '⏳ Standby';
            statusMsg.classList.remove('blinking');
            
        } else if (tab === 'stopwatch') {
            stopwatchTab.style.display = 'block';
            structureInfo.style.display = 'none';
            stopwatchModule.init();
            statusMsg.textContent = '⏳ Standby';
            statusMsg.classList.remove('blinking');
        }

        updateTimerDisplay();
    }

    // ============================================
    // ===== GLOBAL EVENT LISTENERS =====
    // ============================================
    
    // Tab switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            switchTab(btn.dataset.tab);
        });
    });

    // Start button
    startBtn.addEventListener('click', () => {
        if (currentMode === 'stopwatch') {
            stopwatchModule.start();
        } else if (currentMode === 'presets') {
            if (!presetModule.activePreset) return;
            if (timerRunning) return;
            
            if (pausedTime !== null) {
                workout.timeLeft = pausedTime;
                pausedTime = null;
            }
            
            startTimer();
            
        } else if (currentMode === 'custom') {
            customModule.handleStart();
        }
    });

    // Pause button
    pauseBtn.addEventListener('click', () => {
        if (currentMode === 'stopwatch') {
            stopwatchModule.pause();
        } else if (timerRunning) {
            clearInterval(timerInterval);
            timerInterval = null;
            timerRunning = false;
            pausedTime = workout.timeLeft;
            setStatus('paused');
        }
    });

    // Reset button
    resetBtn.addEventListener('click', () => {
        if (currentMode === 'stopwatch') {
            stopwatchModule.reset();
            
        } else if (currentMode === 'presets' && presetModule.activePreset) {
            stopTimer();
            presetModule.loadPreset(presetModule.activePreset);
            setStatus('reset');

            document.querySelectorAll('input.error').forEach(input => {
                input.classList.remove('error');
            });
            customModule.errorMsg.classList.remove('visible', 'show-temporarily');

            setTimeout(() => {
                if (!timerRunning) setStatus('standby');
            }, 1000);
            
        } else if (currentMode === 'custom') {
            customModule.reset();
        }
    });

    // ============================================
    // ===== INITIALIZATION =====
    // ============================================
    
    // Initialize all modules
    presetModule.init();
    customModule.init();
    stopwatchModule.init();
    
    // Start with presets tab
    switchTab('presets');
    setStatus('standby');
    updateTimerDisplay();
    updateStructureInfo();
})();