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
    const customRestRounds =
