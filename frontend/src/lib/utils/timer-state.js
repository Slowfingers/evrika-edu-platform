export function advanceTimer(stages, index, remaining, elapsed) {
  remaining -= elapsed;
  while (remaining <= 0) {
    if (index + 1 >= stages.length) return { index, remaining: 0, finished: true };
    index++;
    remaining += stages[index].duration * 60;
  }
  return { index, remaining, finished: false };
}

export function editTimerStage(stages, index, remaining, editedIndex, updated) {
  const duration = Math.max(1, Math.min(120, Number(updated.duration) || 1));
  if (editedIndex === index) remaining = Math.max(0, remaining + (duration - stages[index].duration) * 60);
  return { stages: stages.map((stage, i) => i === editedIndex ? { ...updated, duration } : stage), remaining };
}

export function removeTimerStage(stages, index, remaining, removed) {
  if (stages.length <= 1) return { stages, index, remaining };
  stages = stages.filter((_, i) => i !== removed);
  if (removed < index) index--;
  else if (removed === index) {
    index = Math.min(index, stages.length - 1);
    remaining = stages[index].duration * 60;
  }
  return { stages, index, remaining };
}
