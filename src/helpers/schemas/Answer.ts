import * as z from "zod";

import { QuestionIdSchema, ChoiceSchema, PingIdSchema } from "./common";

// We use `{ value: ... }` because it increases the consistency of the data.
// BUT TODO: USE PLAIN E.G. z.number instead of z.object for all answer data

export const SliderAnswerDataSchema = z.object({
  value: z.number(),
});

export const ChoicesWithSingleAnswerAnswerDataSchema = z.object({
  value: ChoiceSchema,
});

// We use an array of tuples here (instead of `{ [key: string]: boolean }`)
// because the order shown on the screen can be kept in the results.
// This is potentially helpful for analysis later if the order is randomized
// as now we know the order the user saw the choices in.
export const ChoicesWithMultipleAnswersAnswerChoicesSchema = z.array(
  z.tuple([ChoiceSchema, z.boolean()]),
);
export const ChoicesWithMultipleAnswersAnswerDataSchema = z.object({
  value: ChoicesWithMultipleAnswersAnswerChoicesSchema,
});

export const YesNoAnswerDataSchema = z.object({
  value: z.boolean(),
});

export const MultipleTextAnswerDataSchema = z.object({
  value: z.array(z.string()),
});

export const HowLongAgoAnswerDataTypeSchema = z.tuple([
  z.number().nullable(),
  z.string().nullable(),
]);
export const HowLongAgoAnswerDataSchema = z.object({
  value: HowLongAgoAnswerDataTypeSchema,
});

export const AnswerDataSchema = z.union([
  SliderAnswerDataSchema,
  ChoicesWithSingleAnswerAnswerDataSchema,
  ChoicesWithMultipleAnswersAnswerDataSchema,
  YesNoAnswerDataSchema,
  MultipleTextAnswerDataSchema,
  HowLongAgoAnswerDataSchema,
]);

const BaseAnswerSchema = z.object({
  pingId: PingIdSchema,

  questionId: QuestionIdSchema,

  /**
   * MARK: WHY_PNA_TRUE_OR_NULL
   *
   * It should not be set to `false`. Instead, it should be either `null` or
   * `false`. This is because using `null` means this key will not be stored in
   * Firebase and hence saving the storage needed for each question.
   */
  preferNotToAnswer: z.union([z.literal(true), z.literal(null)]),

  /**
   * If `null` (and `preferNotToAnswer` is not true), it means that the user
   * clicks "Next" without answering.
   */
  data: AnswerDataSchema.nullable(),

  /**
   * The last update date for the answer (i.e., the last time the user interact
   * with this question - usually when the user clicks "Next").
   */
  date: z.date(),
});

export const SliderAnswerSchema = BaseAnswerSchema.extend({
  data: SliderAnswerDataSchema.nullable(),
});
export const ChoicesWithSingleAnswerAnswerSchema = BaseAnswerSchema.extend({
  data: ChoicesWithSingleAnswerAnswerDataSchema.nullable(),
});
export const ChoicesWithMultipleAnswersAnswerSchema = BaseAnswerSchema.extend({
  data: ChoicesWithMultipleAnswersAnswerDataSchema.nullable(),
});
export const YesNoAnswerSchema = BaseAnswerSchema.extend({
  data: YesNoAnswerDataSchema.nullable(),
});
export const MultipleTextAnswerSchema = BaseAnswerSchema.extend({
  data: MultipleTextAnswerDataSchema.nullable(),
});
export const HowLongAgoAnswerSchema = BaseAnswerSchema.extend({
  data: HowLongAgoAnswerDataSchema.nullable(),
});

export const AnswerSchema = z.union([
  SliderAnswerSchema,
  ChoicesWithSingleAnswerAnswerSchema,
  ChoicesWithMultipleAnswersAnswerSchema,
  YesNoAnswerSchema,
  MultipleTextAnswerSchema,
  HowLongAgoAnswerSchema,
]);

export const AnswersListSchema = z.record(AnswerSchema);
