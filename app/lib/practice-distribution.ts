export const STANDARD_RECOGNITION_DISTRIBUTION = [
  'type', 'type', 'type', 'type', 'type', 'type', 'type',
  'choice', 'choice', 'choice', 'choice', 'choice', 'choice',
  'phrase', 'phrase', 'phrase', 'phrase',
  'audioWord', 'audioWord', 'audioWord',
] as const;

export const standardRecognitionPercentages = {
  type: 35,
  choice: 30,
  phrase: 20,
  audioWord: 15,
} as const;
