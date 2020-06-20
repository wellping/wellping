import { type } from "os";

import { QuestionType } from "./helpers";
import { QuestionId, Question, QuestionsList } from "./types";

// We use `{ value: ... }` because it seems that `"simple-json"`
// does not support simply mixing normal values.
// This also increases the consistency of the data.

export type SliderAnswerData = {
  value: number;
};

export type ChoicesWithSingleAnswerAnswerData = {
  value: string;
};

export type ChoicesWithMultipleAnswersAnswerData = {
  value: ChoicesWithMultipleAnswersAnswerChoices;
};

export type YesNoAnswerData = {
  value: boolean;
};

export type MultipleTextAnswerData = {
  value: { [key: string]: string }; // `key` will be piped with `eachId`
};

export type HowLongAgoAnswerData = {
  value: HowLongAgoAnswerDataType;
};

export type AnswerData =
  | SliderAnswerData
  | ChoicesWithSingleAnswerAnswerData
  | ChoicesWithMultipleAnswersAnswerData
  | YesNoAnswerData
  | MultipleTextAnswerData
  | HowLongAgoAnswerData;

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
  [key: string]: boolean;
};
export interface ChoicesWithMultipleAnswersAnswer extends Answer {
  type: QuestionType.ChoicesWithMultipleAnswers;
  data: ChoicesWithMultipleAnswersAnswerChoices;
}

export interface YesNoAnswer extends Answer {
  type: QuestionType.YesNo;
  data: boolean;
}

export interface MultipleTextAnswer extends Answer {
  type: QuestionType.MultipleText;
  data: {
    count: number;
    values: { [key: string]: string }; // `key` will be piped with `eachId`
  };
}

export type HowLongAgoAnswerDataType = [number | null, string | null];
export interface HowLongAgoAnswer extends Answer {
  type: QuestionType.HowLongAgo;
  data: HowLongAgoAnswerDataType;
}

export interface AnswersList {
  [id: string]: Answer;
}

export interface QuestionScreenProps {
  question: Question;
  onDataChange: (data: AnswerData) => void;
  allAnswers: AnswersList;
  allQuestions: QuestionsList;
  pipeInExtraMetaData: (input: string) => string;
  setDataValidationFunction: (func: () => boolean) => void;
}
