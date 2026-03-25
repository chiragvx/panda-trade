import { useReducedMotion } from 'framer-motion';

export function useMotionVariants<T extends object>(variants: T): T {
  const reduce = useReducedMotion();
  if (!reduce) return variants;
  
  // Strip all transforms, keep only opacity
  return Object.fromEntries(
    Object.entries(variants).map(([k, v]) => [
      k,
      typeof v === 'object' 
        ? { ...v, x: 0, y: 0, scale: 1, filter: 'none' }
        : v
    ])
  ) as T;
}
