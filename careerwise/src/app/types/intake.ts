export type IntakeValue =
  | string
  | number
  | string[]
  | { code: string; name: string }[]
  | null;

export type IntakeAnswers = Record<string, IntakeValue>;
