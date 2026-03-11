import type { WorkoutBlock, Step } from './types';

const uid = () => Math.random().toString(36).substring(2, 9);

export function compileToQueue(blocks: WorkoutBlock[]): Step[] {
  const queue: Step[] = [];

  function processBlock(block: WorkoutBlock) {
    switch (block.type) {
      case 'exercise':
        queue.push({
          id: `${block.id}_${uid()}`,
          name: block.name || 'Exercise',
          type: 'exercise',
          duration: block.duration,
          reps: block.reps,
          originalBlockId: block.id
        });
        break;

      case 'rest':
        queue.push({
          id: `${block.id}_${uid()}`,
          name: block.name || 'Rest',
          type: 'rest',
          duration: block.duration,
          originalBlockId: block.id
        });
        break;

      case 'sequence':
        block.blocks.forEach(processBlock);
        break;

      case 'repeat':
        for (let i = 0; i < block.rounds; i++) {
          block.blocks.forEach(processBlock);
        }
        break;

      case 'tabata':
        for (let i = 0; i < block.rounds; i++) {
          const ex = block.exercises.length > 0 ? block.exercises[i % block.exercises.length] : { name: 'Work' };
          
          queue.push({
            id: `${block.id}_work_${i}_${uid()}`,
            name: ex.name || 'Work',
            type: 'exercise',
            duration: block.workDuration,
            reps: ex.reps,
            originalBlockId: block.id
          });
          
          if (block.restDuration > 0) {
             queue.push({
              id: `${block.id}_rest_${i}_${uid()}`,
              name: 'Rest',
              type: 'rest',
              duration: block.restDuration,
              originalBlockId: block.id
            });
          }
        }
        break;

      case 'emom':
        for (let i = 0; i < block.rounds; i++) {
          const ex = block.exercises.length > 0 ? block.exercises[i % block.exercises.length] : { name: 'EMOM' };
          
          queue.push({
            id: `${block.id}_emom_${i}_${uid()}`,
            name: ex.name || 'EMOM',
            type: 'exercise',
            duration: block.intervalDuration,
            reps: ex.reps,
            originalBlockId: block.id
          });
        }
        break;

      case 'ladder': {
        let currentReps = block.startReps;
        const ascending = block.startReps <= block.endReps;
        let round = 0;
        
        while (ascending ? currentReps <= block.endReps : currentReps >= block.endReps) {
          queue.push({
             id: `${block.id}_ladder_${round}_${uid()}`,
             name: block.exerciseName,
             type: 'exercise',
             duration: block.durationPerRound || 0,
             reps: currentReps,
             originalBlockId: block.id
          });
          
          if (block.step === 0) break; // Safety net
          currentReps += (ascending ? block.step : -block.step);
          round++;
        }
        break;
      }
    }
  }

  blocks.forEach(processBlock);
  return queue;
}
