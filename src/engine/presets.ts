import type { WorkoutBlock } from './types';

export const predefinedTemplates: {
  id: string;
  name: string;
  icon: string;
  description: string;
  meta: string[];
  block: WorkoutBlock;
}[] = [
  {
    id: 'tabata',
    icon: '⏱️',
    name: 'TABATA',
    description: '20/10 · 8 rounds',
    meta: ['20s work', '10s rest', '8 rounds', '4m total'],
    block: {
      id: 'template_tabata',
      type: 'tabata',
      workDuration: 20,
      restDuration: 10,
      rounds: 8,
      exercises: [] // empty means generic "Work" step will be generated
    }
  },
  {
    id: 'tabata_hiit',
    icon: '🔥',
    name: 'TABATA HIIT',
    description: '45/15 · 5 rounds',
    meta: ['45s work', '15s rest', '5 rounds', '5m total'],
    block: {
      id: 'template_tabata_hiit',
      type: 'tabata',
      workDuration: 45,
      restDuration: 15,
      rounds: 5,
      exercises: []
    }
  },
  {
    id: 'hiit_interval',
    icon: '⚡',
    name: 'HIIT INTERVAL',
    description: '60/30 · 10 rounds',
    meta: ['60s work', '30s rest', '10 rounds', '15m total'],
    block: {
      id: 'template_hiit',
      type: 'tabata',
      workDuration: 60,
      restDuration: 30,
      rounds: 10,
      exercises: []
    }
  },
  {
    id: 'emom',
    icon: '⏳',
    name: 'EMOM',
    description: 'Every Minute on the Minute',
    meta: ['60s interval', '10 rounds', '10m total'],
    block: {
      id: 'template_emom',
      type: 'emom',
      intervalDuration: 60,
      rounds: 10,
      exercises: []
    }
  },
  {
    id: 'amrap',
    icon: '🔄',
    name: 'AMRAP',
    description: 'As Many Rounds As Possible',
    meta: ['12m time cap', 'Continuous'],
    block: {
      id: 'template_amrap',
      type: 'exercise',
      duration: 12 * 60,
      name: 'AMRAP Time Cap'
    }
  },
  {
    id: 'circuit',
    icon: '🔗',
    name: 'CIRCUIT',
    description: '4 Stations · 3 Rounds',
    meta: ['4 exercises', '3 rounds', 'No rest between'],
    block: {
      id: 'template_circuit',
      type: 'repeat',
      rounds: 3,
      blocks: [
        { id: 'c1', type: 'exercise', duration: 45, name: 'Station 1' },
        { id: 'c2', type: 'exercise', duration: 45, name: 'Station 2' },
        { id: 'c3', type: 'exercise', duration: 45, name: 'Station 3' },
        { id: 'c4', type: 'exercise', duration: 45, name: 'Station 4' }
      ]
    }
  },
  {
    id: 'ladder',
    icon: '🪜',
    name: 'LADDER',
    description: 'Ascending 1-10 Reps',
    meta: ['1 to 10 reps', '+1 per round'],
    block: {
      id: 'template_ladder',
      type: 'ladder',
      exerciseName: 'Exercise',
      startReps: 1,
      endReps: 10,
      step: 1
    }
  },
  {
    id: 'pyramid',
    icon: '🔺',
    name: 'PYRAMID LADDER',
    description: '1-5-1 Reps',
    meta: ['1 to 5', 'Back to 1'],
    block: {
      id: 'template_pyramid',
      type: 'sequence',
      blocks: [
        { id: 'p_asc', type: 'ladder', exerciseName: 'Exercise', startReps: 1, endReps: 5, step: 1 },
        { id: 'p_desc', type: 'ladder', exerciseName: 'Exercise', startReps: 4, endReps: 1, step: 1 }
      ]
    }
  },
  {
    id: 'ratio_3_1',
    icon: '⚖️',
    name: '3:1 RATIO',
    description: '90s work, 30s rest',
    meta: ['3x work to rest ratio'],
    block: {
      id: 'template_31',
      type: 'tabata',
      workDuration: 90,
      restDuration: 30,
      rounds: 5,
      exercises: []
    }
  },
  {
    id: 'density',
    icon: '🧱',
    name: 'DENSITY BLOCK',
    description: '8m Block',
    meta: ['Max work in 8 minutes'],
    block: {
      id: 'template_density',
      type: 'exercise',
      duration: 8 * 60,
      name: 'Density Block'
    }
  },
  {
    id: 'warmup',
    icon: '🌅',
    name: 'WARMUP / COOLDOWN',
    description: 'Mobility Flow',
    meta: ['30s per stretch', '10 stretches'],
    block: {
      id: 'template_warmup',
      type: 'repeat',
      rounds: 10,
      blocks: [
        { id: 'w1', type: 'exercise', duration: 30, name: 'Stretch / Mobility' }
      ]
    }
  }
];
