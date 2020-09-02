import * as z from "zod";

import { PingSchema } from "./schemas/Ping";
import {
  QuestionSchema,
  SliderQuestionSchema,
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
import {
  StudyFileSchema,
  StudyInfoSchema,
  ExtraDataSchema,
  FirebaseConfigSchema,
  FirebaseServerConfigSchema,
  BeiweServerConfigSchema,
} from "./schemas/StudyFile";
import {
  QuestionIdSchema,
  StreamNameSchema,
  StudyIdSchema,
  ChoiceSchema,
  ChoicesListSchema,
  PingIdSchema,
} from "./schemas/common";

export type Choice = z.infer<typeof ChoiceSchema>;
export type ChoicesList = z.infer<typeof ChoicesListSchema>;

export type StreamName = z.infer<typeof StreamNameSchema>;

export type QuestionId = z.infer<typeof QuestionIdSchema>;

export type QuestionTypeType = z.infer<typeof QuestionTypeSchema>;

export type Question = z.infer<typeof QuestionSchema>;

export type SliderQuestion = z.infer<typeof SliderQuestionSchema>;

export type ChoicesQuestion = z.infer<typeof ChoicesQuestionSchema>;

export type ChoicesWithSingleAnswerQuestion = z.infer<
  typeof ChoicesWithSingleAnswerQuestionSchema
>;

export type ChoicesWithMultipleAnswersQuestion = z.infer<
  typeof ChoicesWithMultipleAnswersQuestionSchema
>;

export type YesNoQuestion = z.infer<typeof YesNoQuestionSchema>;

export type MultipleTextQuestion = z.infer<typeof MultipleTextQuestionSchema>;

export type HowLongAgoQuestion = z.infer<typeof HowLongAgoQuestionSchema>;

export type BranchQuestion = z.infer<typeof BranchQuestionSchema>;

export type BranchWithRelativeComparisonQuestion = z.infer<
  typeof BranchWithRelativeComparisonQuestionSchema
>;

export type PingId = z.infer<typeof PingIdSchema>;

export type Ping = z.infer<typeof PingSchema>;

export type QuestionsList = z.infer<typeof QuestionsListSchema>;

export type Streams = z.infer<typeof StreamsSchema>;

export type StudyID = z.infer<typeof StudyIdSchema>;

export type FirebaseConfig = z.infer<typeof FirebaseConfigSchema>;
export type FirebaseServerConfig = z.infer<typeof FirebaseServerConfigSchema>;

export type BeiweServerConfig = z.infer<typeof BeiweServerConfigSchema>;

export type StudyInfo = z.infer<typeof StudyInfoSchema>;

export type ExtraData = z.infer<typeof ExtraDataSchema>;

export type StudyFile = z.infer<typeof StudyFileSchema>;
