const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

export const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia(REDUCED_MOTION).matches;
