import * as z from "zod";

import {
  SliderAnswerDataSchema,
  ChoicesWithSingleAnswerAnswerDataSchema,
  ChoicesWithMultipleAnswersAnswerChoicesSchema,
  ChoicesWithMultipleAnswersAnswerDataSchema,
  YesNoAnswerDataSchema,
  MultipleTextAnswerDataSchema,
  HowLongAgoAnswerDataTypeSchema,
  HowLongAgoAnswerDataSchema,
  AnswerDataSchema,
  AnswersListSchema,
  SliderAnswerSchema,
  ChoicesWithSingleAnswerAnswerSchema,
  ChoicesWithMultipleAnswersAnswerSchema,
  YesNoAnswerSchema,
  MultipleTextAnswerSchema,
  HowLongAgoAnswerSchema,
  AnswerSchema,
} from "./schemas/Answer";
import { Question, QuestionsList } from "./types";

export type SliderAnswerData = z.infer<typeof SliderAnswerDataSchema>;

export type ChoicesWithSingleAnswerAnswerData = z.infer<
  typeof ChoicesWithSingleAnswerAnswerDataSchema
>;

export type ChoicesWithMultipleAnswersAnswerChoices = z.infer<
  typeof ChoicesWithMultipleAnswersAnswerChoicesSchema
>;
export type ChoicesWithMultipleAnswersAnswerData = z.infer<
  typeof ChoicesWithMultipleAnswersAnswerDataSchema
>;

export type YesNoAnswerData = z.infer<typeof YesNoAnswerDataSchema>;

export type MultipleTextAnswerData = z.infer<
  typeof MultipleTextAnswerDataSchema
>;

export type HowLongAgoAnswerDataType = z.infer<
  typeof HowLongAgoAnswerDataTypeSchema
>;
export type HowLongAgoAnswerData = z.infer<typeof HowLongAgoAnswerDataSchema>;

export type AnswerData = z.infer<typeof AnswerDataSchema>;

export type SliderAnswer = z.infer<typeof SliderAnswerSchema>;
export type ChoicesWithSingleAnswerAnswer = z.infer<
  typeof ChoicesWithSingleAnswerAnswerSchema
>;
export type ChoicesWithMultipleAnswersAnswer = z.infer<
  typeof ChoicesWithMultipleAnswersAnswerSchema
>;
export type YesNoAnswer = z.infer<typeof YesNoAnswerSchema>;
export type MultipleTextAnswer = z.infer<typeof MultipleTextAnswerSchema>;
export type HowLongAgoAnswer = z.infer<typeof HowLongAgoAnswerSchema>;

export type Answer = z.infer<typeof AnswerSchema>;

export type AnswersList = z.infer<typeof AnswersListSchema>;

export interface QuestionScreenProps {
  question: Question;
  loadingCompleted: () => void;
  onDataChange: (data: AnswerData) => void;
  allAnswers: AnswersList;
  allQuestions: QuestionsList;
  pipeInExtraMetaData: (input: string) => string;
  setDataValidationFunction: (func: () => boolean) => void;
}
