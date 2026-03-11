import { useState, useEffect, useCallback } from 'react';
import type { Step } from '../engine/types';
import { useRuntimeEngine } from '../engine/useRuntimeEngine';
import { WorkoutScreen } from '../components/WorkoutScreen';

import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// ──── Types ────
interface BuilderItem {
  id: string;
  type: 'exercise' | 'rest' | 'group';
  name: string;
  duration: number;
  mode: 'time' | 'reps';
  reps?: number;
  children?: BuilderItem[];
  groupSets?: number;
  collapsed?: boolean;
}

// ──── Utility ────
const createId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// ──── Sortable Item ────
function SortableItem({
  item,
  onEdit,
  onRemove,
}: {
  item: BuilderItem;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style} className="item-container" onClick={onEdit}>
      <span className="drag-handle" {...attributes} {...listeners}>⋮⋮</span>
      <span className="item-name">{item.name}</span>
      <span className={item.mode === 'time' ? 'time-pill' : 'reps-pill'}>
        {item.mode === 'time' ? formatDuration(item.duration) : `x${item.reps || 0}`}
      </span>
      <button className="remove-btn" onClick={e => { e.stopPropagation(); onRemove(); }}>✕</button>
    </div>
  );
}

// ──── Sortable Group ────
function SortableGroup({
  item,
  onEditGroup,
  onRemoveGroup,
  onToggleCollapse,
  onUpdateChildren,
  onUpdateGroupSets,
  onEditChild,
  onRemoveChild,
}: {
  item: BuilderItem;
  onEditGroup: () => void;
  onRemoveGroup: () => void;
  onToggleCollapse: () => void;
  onUpdateChildren: (children: BuilderItem[]) => void;
  onUpdateGroupSets: (sets: number) => void;
  onEditChild: (child: BuilderItem) => void;
  onRemoveChild: (childId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const children = item.children || [];
  const collapsed = item.collapsed ?? false;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  const handleChildDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = children.findIndex(c => c.id === active.id);
      const newIndex = children.findIndex(c => c.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        onUpdateChildren(arrayMove(children, oldIndex, newIndex));
      }
    }
  };

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style} className="group-container">
      <div className="group-header">
        <span className="drag-handle" {...attributes} {...listeners}>⋮⋮</span>
        <div className="name-with-arrow" onClick={e => { e.stopPropagation(); onToggleCollapse(); }}>
          <span className="item-name" onClick={e => { e.stopPropagation(); onEditGroup(); }}>{item.name}</span>
          <span className={`arrow-icon ${collapsed ? '' : 'open'}`}>▼</span>
        </div>

        {/* Group sets stepper inline */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.25rem', marginLeft: 'auto', marginRight: '0.5rem',
        }}>
          <button
            className="stepper-btn"
            style={{ width: '28px', height: '28px', fontSize: '1rem' }}
            onClick={e => { e.stopPropagation(); onUpdateGroupSets(Math.max(1, (item.groupSets || 1) - 1)); }}
          >−</button>
          <span style={{ color: 'var(--celadon)', fontWeight: 600, fontSize: '0.9rem', minWidth: '16px', textAlign: 'center' }}>
            {item.groupSets || 1}×
          </span>
          <button
            className="stepper-btn"
            style={{ width: '28px', height: '28px', fontSize: '1rem' }}
            onClick={e => { e.stopPropagation(); onUpdateGroupSets((item.groupSets || 1) + 1); }}
          >+</button>
        </div>

        <button className="remove-btn" onClick={e => { e.stopPropagation(); onRemoveGroup(); }}>✕</button>
      </div>

      {!collapsed && (
        <div className="nested-items">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleChildDragEnd}>
            <SortableContext items={children.map(c => c.id)} strategy={verticalListSortingStrategy}>
              {children.map(child => (
                <SortableItem
                  key={child.id}
                  item={child}
                  onEdit={() => onEditChild(child)}
                  onRemove={() => onRemoveChild(child.id)}
                />
              ))}
            </SortableContext>
          </DndContext>

          {children.length === 0 && (
            <div style={{
              textAlign: 'center', color: 'var(--celadon)', opacity: 0.4, padding: '0.75rem', fontSize: '0.85rem',
            }}>
              Empty group — add items via ✏️ Edit
            </div>
          )}
        </div>
      )}
    </div>
  );
}


// ──── Exercise/Break Modal ────
function ExerciseModal({
  item, isNew, onSave, onClose,
}: {
  item: BuilderItem; isNew: boolean;
  onSave: (item: BuilderItem) => void; onClose: () => void;
}) {
  const [name, setName] = useState(item.name);
  const [mode, setMode] = useState<'time' | 'reps'>(item.mode);
  const [timeValue, setTimeValue] = useState(formatTimeInput(item.duration));
  const [repsValue, setRepsValue] = useState(item.reps?.toString() || '10');
  const [isRest, setIsRest] = useState(item.type === 'rest');

  function formatTimeInput(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  function parseTimeInput(value: string): number {
    const parts = value.split(':');
    if (parts.length === 2) return Math.max(0, (parseInt(parts[0]) || 0) * 60 + (parseInt(parts[1]) || 0));
    return Math.max(0, parseInt(value) || 0);
  }

  const handleSave = () => {
    onSave({
      ...item,
      name,
      type: isRest ? 'rest' : 'exercise',
      mode,
      duration: mode === 'time' ? parseTimeInput(timeValue) : 30,
      reps: mode === 'reps' ? parseInt(repsValue) || 0 : undefined,
    });
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>✕</button>
        <input type="text" className="modal-title-input" value={name}
          onChange={e => setName(e.target.value)} placeholder="Exercise name" />

        <div className="pill-tabs">
          <button className={`pill-tab ${mode === 'time' ? 'active' : ''}`} onClick={() => setMode('time')}>⏱️ Time</button>
          <button className={`pill-tab ${mode === 'reps' ? 'active' : ''}`} onClick={() => setMode('reps')}>💪 Reps</button>
        </div>

        {mode === 'time' ? (
          <div className="input-field">
            <span style={{ color: 'var(--vanilla-custard)' }}>⏱️</span>
            <input type="text" value={timeValue} onChange={e => setTimeValue(e.target.value)} placeholder="00:00" />
          </div>
        ) : (
          <div className="input-field">
            <span style={{ color: 'var(--vanilla-custard)' }}>💪</span>
            <input type="number" value={repsValue} onChange={e => setRepsValue(e.target.value)} placeholder="0" />
          </div>
        )}

        <div className={`toggle-pill ${isRest ? 'rest' : 'active'}`} onClick={() => setIsRest(!isRest)}>
          <span>{isRest ? '😴 Rest' : '⚡ Active'}</span>
        </div>

        <button className="add-modal-btn" onClick={handleSave}>
          {isNew ? '+ Add Exercise' : '✓ Update'}
        </button>
      </div>
    </div>
  );
}

// ──── Group Edit Modal ────
function GroupEditModal({
  item, onSave, onClose, onAddExercise, onAddBreak,
}: {
  item: BuilderItem;
  onSave: (updated: BuilderItem) => void;
  onClose: () => void;
  onAddExercise: (groupId: string) => void;
  onAddBreak: (groupId: string) => void;
}) {
  const [name, setName] = useState(item.name);
  const [groupSets, setGroupSets] = useState(item.groupSets || 1);

  const handleSave = () => {
    onSave({ ...item, name, groupSets });
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>✕</button>
        <input type="text" className="modal-title-input" value={name}
          onChange={e => setName(e.target.value)} placeholder="Group name" />

        <div className="sets-field-container">
          <span className="sets-label">Group Sets</span>
          <div className="sets-field">
            <button className="stepper-btn" onClick={() => setGroupSets(s => Math.max(1, s - 1))}>−</button>
            <input type="number" className="sets-input" value={groupSets} min={1}
              onChange={e => setGroupSets(Math.max(1, parseInt(e.target.value) || 1))} />
            <button className="stepper-btn" onClick={() => setGroupSets(s => s + 1)}>+</button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <button className="add-modal-btn" style={{ flex: 1, background: 'var(--celadon)' }}
            onClick={() => { onAddExercise(item.id); onClose(); }}>
            + Exercise
          </button>
          <button className="add-modal-btn" style={{ flex: 1, background: 'var(--vanilla-custard)' }}
            onClick={() => { onAddBreak(item.id); onClose(); }}>
            + Break
          </button>
        </div>

        <button className="add-modal-btn" onClick={handleSave}>✓ Update Group</button>
      </div>
    </div>
  );
}


// ──── FAB Menu ────
function FabMenu({
  onAddExercise, onAddBreak, onAddGroup,
}: {
  onAddExercise: () => void; onAddBreak: () => void; onAddGroup: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && <div className="blur-overlay" onClick={() => setOpen(false)} />}
      <div className="fab-container">
        <button className={`fab-main ${open ? 'open' : ''}`} onClick={() => setOpen(!open)}>+</button>
        <div className={`fab-menu ${open ? 'open' : ''}`}>
          <button className="fab-item" onClick={() => { onAddExercise(); setOpen(false); }}>
            <span>Add Exercise</span>
            <div className="fab-icon exercise">💪</div>
          </button>
          <button className="fab-item" onClick={() => { onAddBreak(); setOpen(false); }}>
            <span>Add Break</span>
            <div className="fab-icon break">⏱️</div>
          </button>
          <button className="fab-item" onClick={() => { onAddGroup(); setOpen(false); }}>
            <span>Add Group</span>
            <div className="fab-icon group">📁</div>
          </button>
        </div>
      </div>
    </>
  );
}


// ──── Main Custom Builder ────
export function CustomBuilder() {
  const [items, setItems] = useState<BuilderItem[]>([]);
  const [sets, setSets] = useState(3);
  const [activeQueue, setActiveQueue] = useState<Step[] | null>(null);
  const [modalItem, setModalItem] = useState<{ item: BuilderItem; isNew: boolean; groupId?: string } | null>(null);
  const [groupModal, setGroupModal] = useState<BuilderItem | null>(null);
  const [showError, setShowError] = useState(false);
  const [exerciseCounter, setExerciseCounter] = useState(1);
  const [groupCounter, setGroupCounter] = useState(1);

  const { state, currentStep, nextStep, start, pause, reset, next, prev } = useRuntimeEngine(activeQueue || []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  // ── Add handlers ──
  const openAddExercise = useCallback(() => {
    const num = exerciseCounter;
    setExerciseCounter(c => c + 1);
    setModalItem({
      item: { id: createId(), type: 'exercise', name: `Exercise ${num}`, duration: 45, mode: 'time' },
      isNew: true,
    });
  }, [exerciseCounter]);

  const openAddBreak = useCallback(() => {
    setModalItem({
      item: { id: createId(), type: 'rest', name: 'Rest', duration: 30, mode: 'time' },
      isNew: true,
    });
  }, []);

  const openAddGroup = useCallback(() => {
    const num = groupCounter;
    setGroupCounter(c => c + 1);
    const groupItem: BuilderItem = {
      id: createId(), type: 'group', name: `Group ${num}`,
      duration: 0, mode: 'time', children: [], groupSets: 1, collapsed: false,
    };
    setItems(prev => [...prev, groupItem]);
  }, [groupCounter]);

  const addExerciseToGroup = useCallback((groupId: string) => {
    const num = exerciseCounter;
    setExerciseCounter(c => c + 1);
    const child: BuilderItem = { id: createId(), type: 'exercise', name: `Exercise ${num}`, duration: 45, mode: 'time' };
    setItems(prev => prev.map(item =>
      item.id === groupId ? { ...item, children: [...(item.children || []), child] } : item
    ));
  }, [exerciseCounter]);

  const addBreakToGroup = useCallback((groupId: string) => {
    const child: BuilderItem = { id: createId(), type: 'rest', name: 'Rest', duration: 30, mode: 'time' };
    setItems(prev => prev.map(item =>
      item.id === groupId ? { ...item, children: [...(item.children || []), child] } : item
    ));
  }, []);

  // ── Save / Remove handlers ──
  const handleModalSave = (savedItem: BuilderItem) => {
    if (modalItem?.isNew) {
      if (modalItem.groupId) {
        // Adding to a group
        setItems(prev => prev.map(item =>
          item.id === modalItem.groupId
            ? { ...item, children: [...(item.children || []), savedItem] }
            : item
        ));
      } else {
        setItems(prev => [...prev, savedItem]);
      }
    } else {
      // Editing — could be top-level or inside a group
      setItems(prev => prev.map(item => {
        if (item.id === savedItem.id) return savedItem;
        if (item.type === 'group' && item.children) {
          return { ...item, children: item.children.map(c => c.id === savedItem.id ? savedItem : c) };
        }
        return item;
      }));
    }
    setModalItem(null);
  };

  const handleGroupSave = (updated: BuilderItem) => {
    setItems(prev => prev.map(i => i.id === updated.id ? { ...i, name: updated.name, groupSets: updated.groupSets } : i));
    setGroupModal(null);
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const removeChildFromGroup = (groupId: string, childId: string) => {
    setItems(prev => prev.map(item =>
      item.id === groupId
        ? { ...item, children: (item.children || []).filter(c => c.id !== childId) }
        : item
    ));
  };

  const toggleGroupCollapse = (id: string) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, collapsed: !item.collapsed } : item
    ));
  };

  const updateGroupChildren = (groupId: string, children: BuilderItem[]) => {
    setItems(prev => prev.map(item =>
      item.id === groupId ? { ...item, children } : item
    ));
  };

  const updateGroupSets = (groupId: string, newSets: number) => {
    setItems(prev => prev.map(item =>
      item.id === groupId ? { ...item, groupSets: newSets } : item
    ));
  };

  // ── DnD handler for top-level ──
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems(prev => {
        const oldIndex = prev.findIndex(i => i.id === active.id);
        const newIndex = prev.findIndex(i => i.id === over.id);
        if (oldIndex !== -1 && newIndex !== -1) {
          return arrayMove(prev, oldIndex, newIndex);
        }
        return prev;
      });
    }
  };

  // ── Compile workout ──
  const handleStartWorkout = () => {
    if (items.length === 0) {
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
      return;
    }

    const steps: Step[] = [];
    let stepId = 0;

    const flattenItem = (item: BuilderItem) => {
      if (item.type === 'group') {
        const groupRepeat = item.groupSets || 1;
        for (let gs = 0; gs < groupRepeat; gs++) {
          for (const child of (item.children || [])) {
            steps.push({
              id: `c-${stepId++}`,
              name: child.name,
              duration: child.duration,
              type: child.type === 'rest' ? 'rest' : 'exercise',
              reps: child.reps,
            });
          }
        }
      } else {
        steps.push({
          id: `c-${stepId++}`,
          name: item.name,
          duration: item.duration,
          type: item.type === 'rest' ? 'rest' : 'exercise',
          reps: item.reps,
        });
      }
    };

    for (let s = 0; s < sets; s++) {
      for (const item of items) {
        flattenItem(item);
      }
    }

    setActiveQueue(steps);
  };

  // Auto-start
  useEffect(() => {
    if (activeQueue && activeQueue.length > 0 && state.isStandby) {
      start();
    }
  }, [activeQueue, start, state.isStandby]);

  const handleFinished = () => { reset(); setActiveQueue(null); };
  const handleReset = () => { reset(); setActiveQueue(null); };

  // ── Running View ──
  if (activeQueue) {
    return (
      <WorkoutScreen
        queue={activeQueue} engineState={state}
        currentStep={currentStep} nextStep={nextStep}
        onStartPause={state.isRunning ? pause : start}
        onReset={handleReset} onPrev={prev} onNext={next}
        onFinished={handleFinished} totalSets={sets}
      />
    );
  }

  // ── Builder View ──
  return (
    <>
      <button className={`start-workout-btn ${showError ? 'error' : ''}`} onClick={handleStartWorkout}>
        ▶ Start Workout
      </button>

      {showError && (
        <div className="error-pill"><span>⚠</span><span>Add at least one item</span></div>
      )}

      {items.length > 0 && (
        <>
          <div className="sets-field-container">
            <span className="sets-label">Sets</span>
            <div className="sets-field">
              <button className="stepper-btn" onClick={() => setSets(s => Math.max(1, s - 1))}>−</button>
              <input type="number" className="sets-input" value={sets} min={1}
                onChange={e => setSets(Math.max(1, parseInt(e.target.value) || 1))} />
              <button className="stepper-btn" onClick={() => setSets(s => s + 1)}>+</button>
            </div>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
              <div className="sortable-list">
                {items.map(item => {
                  if (item.type === 'group') {
                    return (
                      <SortableGroup
                        key={item.id}
                        item={item}
                        onEditGroup={() => setGroupModal(item)}
                        onRemoveGroup={() => removeItem(item.id)}
                        onToggleCollapse={() => toggleGroupCollapse(item.id)}
                        onUpdateChildren={(children) => updateGroupChildren(item.id, children)}
                        onUpdateGroupSets={(s) => updateGroupSets(item.id, s)}
                        onEditChild={(child) => setModalItem({ item: child, isNew: false })}
                        onRemoveChild={(childId) => removeChildFromGroup(item.id, childId)}
                      />
                    );
                  }
                  return (
                    <SortableItem
                      key={item.id}
                      item={item}
                      onEdit={() => setModalItem({ item, isNew: false })}
                      onRemove={() => removeItem(item.id)}
                    />
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        </>
      )}

      {/* FAB */}
      <FabMenu onAddExercise={openAddExercise} onAddBreak={openAddBreak} onAddGroup={openAddGroup} />

      {/* Exercise/Break Modal */}
      {modalItem && (
        <ExerciseModal
          item={modalItem.item} isNew={modalItem.isNew}
          onSave={handleModalSave} onClose={() => setModalItem(null)}
        />
      )}

      {/* Group Edit Modal */}
      {groupModal && (
        <GroupEditModal
          item={groupModal}
          onSave={handleGroupSave}
          onClose={() => setGroupModal(null)}
          onAddExercise={addExerciseToGroup}
          onAddBreak={addBreakToGroup}
        />
      )}
    </>
  );
}
