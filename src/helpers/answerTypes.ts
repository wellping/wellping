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

// We use an array of tuples here (instead of `{ [key: string]: boolean }`)
// because the order shown on the screen can be kept in the results.
// This is potentially helpful for analysis later if the order is randomized
// as now we know the order the user saw the choices in.
export type ChoicesWithMultipleAnswersAnswerChoices = [Choice, boolean][];
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
