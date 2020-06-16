import { QuestionType } from "./helpers";
import { QuestionId, Question, QuestionsList } from "./types";

export interface Answer {
  id: QuestionId;
  type: QuestionType;
  preferNotToAnswer: boolean;
  nextWithoutOption: boolean;
  data: any | null;
  lastUpdateDate: Date;
}

export interface SliderAnswer extends Answer {
  type: QuestionType.Slider;
  data: number;
}

export interface ChoicesWithSingleAnswerAnswer extends Answer {
  type: QuestionType.ChoicesWithSingleAnswer;
  data: string;
}

export type ChoicesWithMultipleAnswersAnswerChoices = {
  [ket: string]: boolean;
};
export interface ChoicesWithMultipleAnswersAnswer extends Answer {
  type: QuestionType.ChoicesWithMultipleAnswers;
  data: ChoicesWithMultipleAnswersAnswerChoices;
}

export interface YesNoAnswer extends Answer {
  type: QuestionType.YesNo;
  data: boolean;
}

export interface MultipleTextAnswerData {
  count: number;
  values: { [key: string]: string }; // `key` will be piped with `eachId`
}
export interface MultipleTextAnswer extends Answer {
  type: QuestionType.MultipleText;
  data: MultipleTextAnswerData;
}

export type HowLongAgoAnswerData = [number, string];
export interface HowLongAgoAnswer extends Answer {
  type: QuestionType.HowLongAgo;
  data: HowLongAgoAnswerData;
}

export interface AnswersList {
  [id: string]: Answer;
}

export interface QuestionScreen {
  question: Question;
  onDataChange: (data: any) => void;
  allAnswers: AnswersList;
  allQuestions: QuestionsList;
  pipeInExtraMetaData: (input: string) => string;
  setDataValidationFunction?: (func: () => boolean) => void;
}
