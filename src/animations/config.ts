export const EASING = {
  // Apple's exact easing curves extracted from macOS/iOS
  standard:    [0.25, 0.1,  0.25, 1.0],   // default, most UI
  decelerate:  [0.0,  0.0,  0.2,  1.0],   // things entering screen
  accelerate:  [0.4,  0.0,  1.0,  1.0],   // things leaving screen
  spring:      { type: 'spring', stiffness: 400, damping: 40, mass: 1 },
  springGentle:{ type: 'spring', stiffness: 280, damping: 32, mass: 1 },
  springBouncy:{ type: 'spring', stiffness: 500, damping: 28, mass: 0.8 },
} as const;

export const DURATION = {
  instant:   0.08,   // micro feedback (button press)
  fast:      0.15,   // hover states, small reveals
  standard:  0.22,   // most transitions (tab switch, dropdown)
  emphasis:  0.35,   // layout changes, modals
  slow:      0.5,    // preset switches, onboarding
} as const;

export const VARIANTS = {
  // Reusable motion variants — import and spread, never rewrite
  
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: DURATION.standard, ease: EASING.standard } },
    exit:    { opacity: 0, transition: { duration: DURATION.fast,     ease: EASING.accelerate } },
  },

  slideUp: {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0,  transition: { duration: DURATION.standard, ease: EASING.decelerate } },
    exit:    { opacity: 0, y: -8, transition: { duration: DURATION.fast,     ease: EASING.accelerate } },
  },

  slideDown: {
    initial: { opacity: 0, y: -12 },
    animate: { opacity: 1, y: 0,   transition: { duration: DURATION.standard, ease: EASING.decelerate } },
    exit:    { opacity: 0, y: 12,  transition: { duration: DURATION.fast,     ease: EASING.accelerate } },
  },

  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1,    transition: { duration: DURATION.standard, ease: EASING.decelerate } },
    exit:    { opacity: 0, scale: 0.97, transition: { duration: DURATION.fast,     ease: EASING.accelerate } },
  },

  slideInRight: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0,  transition: EASING.spring },
    exit:    { opacity: 0, x: 20, transition: { duration: DURATION.fast, ease: EASING.accelerate } },
  },

  tabContent: {
    // Used in FlexLayout factory for tab switches
    initial: { opacity: 0, scale: 0.99, filter: 'blur(2px)' },
    animate: { opacity: 1, scale: 1,    filter: 'blur(0px)',
               transition: { duration: DURATION.standard, ease: EASING.decelerate } },
    exit:    { opacity: 0, scale: 1.01, filter: 'blur(2px)',
               transition: { duration: DURATION.fast,     ease: EASING.accelerate } },
  },

  listItem: {
    // Used for watchlist rows, order rows — stagger parent controls timing
    initial: { opacity: 0, x: -8 },
    animate: { opacity: 1, x: 0 },
    exit:    { opacity: 0, x: 8 },
  },
} as const;

export const STAGGER = {
  fast:     { animate: { transition: { staggerChildren: 0.03 } } },
  standard: { animate: { transition: { staggerChildren: 0.06 } } },
  slow:     { animate: { transition: { staggerChildren: 0.1  } } },
} as const;

