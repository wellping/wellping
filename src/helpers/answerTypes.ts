import { AnswerEntity } from "../entities/AnswerEntity";
import { Question, QuestionsList, Choice } from "./types";

// We use `{ value: ... }` because it seems that `"simple-json"`
// does not support simply mixing normal values.
// This also increases the consistency of the data.

export type SliderAnswerData = {
  value: number;
};

export type ChoicesWithSingleAnswerAnswerData = {
  value: Choice;
};

// TODO: use [Choice, boolean][] so that the order shown on the screen is kept in the results.
export type ChoicesWithMultipleAnswersAnswerChoices = {
  [key: string /* actually Choice */]: boolean;
};
export type ChoicesWithMultipleAnswersAnswerData = {
  value: ChoicesWithMultipleAnswersAnswerChoices;
};

export type YesNoAnswerData = {
  value: boolean;
};

export type MultipleTextAnswerData = {
  value: string[];
};

export type HowLongAgoAnswerDataType = [number | null, string | null];
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

export interface AnswersList {
  [id: string]: AnswerEntity;
}

export interface QuestionScreenProps {
  question: Question;
  onDataChange: (data: AnswerData) => void;
  allAnswers: AnswersList;
  allQuestions: QuestionsList;
  pipeInExtraMetaData: (input: string) => string;
  setDataValidationFunction: (func: () => boolean) => void;
}
