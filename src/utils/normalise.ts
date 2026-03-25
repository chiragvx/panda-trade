export const normalise = (value: number, min: number, max: number, invert: boolean = false): number => {
  let normalised = ((value - min) / (max - min)) * 100;
  normalised = Math.max(0, Math.min(100, normalised));
  return invert ? 100 - normalised : normalised;
};
