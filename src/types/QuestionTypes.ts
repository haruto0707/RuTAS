export type QuestionType = 'singleChoice' | 'multipleChoice' | 'rating' | 'freeText' | 'ranking' | 'slider';

export interface BaseQuestion {
  id: string;
  text: string;
  type: QuestionType;
  options: string[];
  min: number;
  max: number;
  step: number;
}

export interface SingleChoiceQuestion extends BaseQuestion {
  type: 'singleChoice';
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multipleChoice';
}

export interface RatingQuestion extends BaseQuestion {
  type: 'rating';
}

export interface FreeTextQuestion extends BaseQuestion {
  type: 'freeText';
}

export interface RankingQuestion extends BaseQuestion {
  type: 'ranking';
}

export interface SliderQuestion extends BaseQuestion {
  type: 'slider';
}

export type Question = SingleChoiceQuestion | MultipleChoiceQuestion | RatingQuestion | FreeTextQuestion | RankingQuestion | SliderQuestion;