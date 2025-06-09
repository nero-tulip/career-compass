export type Answer = {
    questionId: string;
    score: number;
};

export type MacroAnswer = {
    questionId: string;
    score: number;
    questionText: string;
    selectedLabel: string;
};