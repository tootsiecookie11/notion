export type BlockType = 'sequence' | 'exercise' | 'rest' | 'repeat' | 'tabata' | 'emom' | 'ladder';

export interface BaseBlock {
  id: string;
  type: BlockType;
  name?: string;
}

export interface ExerciseBlock extends BaseBlock {
  type: 'exercise';
  duration: number; // in seconds, 0 if rep-based with no time limit
  reps?: number;
}

export interface RestBlock extends BaseBlock {
  type: 'rest';
  duration: number; // in seconds
}

export interface SequenceBlock extends BaseBlock {
  type: 'sequence';
  blocks: WorkoutBlock[];
}

export interface RepeatBlock extends BaseBlock {
  type: 'repeat';
  rounds: number;
  blocks: WorkoutBlock[];
}

export interface TabataBlock extends BaseBlock {
  type: 'tabata';
  workDuration: number;
  restDuration: number;
  rounds: number;
  exercises: { name: string; reps?: number }[];
}

export interface EMOMBlock extends BaseBlock {
  type: 'emom';
  intervalDuration: number; // usually 60s
  rounds: number;
  exercises: { name: string; reps?: number }[];
}

export interface LadderBlock extends BaseBlock {
  type: 'ladder';
  exerciseName: string;
  startReps: number;
  endReps: number;
  step: number; 
  durationPerRound?: number;
}

export type WorkoutBlock = ExerciseBlock | RestBlock | SequenceBlock | RepeatBlock | TabataBlock | EMOMBlock | LadderBlock;

export interface Step {
  id: string;
  name: string;
  type: 'exercise' | 'rest' | 'prep';
  duration: number; // seconds
  reps?: number;
  originalBlockId?: string;
}
