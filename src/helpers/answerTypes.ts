import { AnswerEntity } from "../entities/AnswerEntity";
import { Question, QuestionsList } from "./types";

// We use `{ value: ... }` because it seems that `"simple-json"`
// does not support simply mixing normal values.
// This also increases the consistency of the data.

export type SliderAnswerData = {
  value: number;
};

export type ChoicesWithSingleAnswerAnswerData = {
  value: string;
};

export type ChoicesWithMultipleAnswersAnswerChoices = {
  [key: string]: boolean;
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
