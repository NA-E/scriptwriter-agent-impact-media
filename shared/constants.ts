// Step number constants for consistency across the application
export const STEP_NUMBERS = {
  TRANSCRIPT_ANALYSIS: 1,
  RESEARCH: 2, 
  OUTLINE_GENERATION: 3
} as const;

// Step names mapping
export const STEP_NAMES = {
  [STEP_NUMBERS.TRANSCRIPT_ANALYSIS]: 'Transcript Analysis',
  [STEP_NUMBERS.RESEARCH]: 'Research',
  [STEP_NUMBERS.OUTLINE_GENERATION]: 'Outline Generation'
} as const;

// Type for step numbers
export type StepNumber = typeof STEP_NUMBERS[keyof typeof STEP_NUMBERS];

// Helper function to get step name by number
export const getStepName = (stepNumber: StepNumber): string => {
  return STEP_NAMES[stepNumber] || 'Unknown Step';
};

// Helper function to validate step number
export const isValidStepNumber = (stepNumber: number): stepNumber is StepNumber => {
  return Object.values(STEP_NUMBERS).includes(stepNumber as StepNumber);
};

// Webhook timeout constant (12 minutes in milliseconds)
export const WEBHOOK_TIMEOUT_MS = 720000;