import * as z from "zod";

import {
  QuestionSchema,
  SliderQuestionSchema,
  ChoiceSchema,
  ChoicesQuestionSchema,
  ChoicesWithSingleAnswerQuestionSchema,
  ChoicesWithMultipleAnswersQuestionSchema,
  YesNoQuestionSchema,
  MultipleTextQuestionSchema,
  HowLongAgoQuestionSchema,
  QuestionsListSchema,
  BranchQuestionSchema,
  BranchWithRelativeComparisonQuestionSchema,
  QuestionTypeSchema,
} from "./schemas/Question";
import { StreamsSchema } from "./schemas/Stream";
import { StudyFileSchema, StudyInfoSchema } from "./schemas/StudyFile";
import {
  QuestionIdSchema,
  StreamNameSchema,
  StudyIdSchema,
} from "./schemas/common";

export type StreamName = z.infer<typeof StreamNameSchema>;

export type QuestionId = z.infer<typeof QuestionIdSchema>;

export type QuestionTypeType = z.infer<typeof QuestionTypeSchema>;

export interface Question extends z.infer<typeof QuestionSchema> {}

export interface SliderQuestion extends z.infer<typeof SliderQuestionSchema> {}

export type Choice = z.infer<typeof ChoiceSchema>;
export interface ChoicesQuestion
  extends z.infer<typeof ChoicesQuestionSchema> {}

export interface ChoicesWithSingleAnswerQuestion
  extends z.infer<typeof ChoicesWithSingleAnswerQuestionSchema> {}

export interface ChoicesWithMultipleAnswersQuestion
  extends z.infer<typeof ChoicesWithMultipleAnswersQuestionSchema> {}

export interface YesNoQuestion extends z.infer<typeof YesNoQuestionSchema> {}

export interface MultipleTextQuestion
  extends z.infer<typeof MultipleTextQuestionSchema> {}

export interface HowLongAgoQuestion
  extends z.infer<typeof HowLongAgoQuestionSchema> {}

export interface BranchQuestion extends z.infer<typeof BranchQuestionSchema> {}

export interface BranchWithRelativeComparisonQuestion
  extends z.infer<typeof BranchWithRelativeComparisonQuestionSchema> {}

export interface QuestionsList extends z.infer<typeof QuestionsListSchema> {}

export type Streams = z.infer<typeof StreamsSchema>;

export type StudyID = z.infer<typeof StudyIdSchema>;

export type StudyInfo = z.infer<typeof StudyInfoSchema>;

export type StudyFile = z.infer<typeof StudyFileSchema>;

// TODO: REMOVE THIS
export type Names = string[];
