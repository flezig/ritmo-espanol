export const STANDARD_RECOGNITION_DISTRIBUTION = [
  'type',
  'type',
  'type',
  'type',
  'type',
  'type',
  'type',
  'type',
  'choice',
  'choice',
  'choice',
  'choice',
  'phrase',
  'phrase',
  'phrase',
  'phrase',
  'phrase',
  'audioWord',
  'audioWord',
  'audioWord',
] as const;

export const standardRecognitionPercentages = {
  type: 40,
  choice: 20,
  phrase: 25,
  audioWord: 15,
} as const;

/** At most one four-option task per five positions, across all word skills.
 * Article tasks have only two options and retain their explicit gender check.
 */
export const limitChoiceFormat = <T extends string>(
  kind: T,
  index: number,
  skill: string,
): T | 'type' =>
  kind === 'choice' && skill !== 'article' && index % 5 !== 4 ? 'type' : kind;
