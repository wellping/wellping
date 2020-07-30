import * as z from "zod";

import { StreamNameSchema } from "./StudyFile";
import { idRegexCheck, idRegexErrorMessage } from "./helper";

export const QuestionIdSchema = z.string().refine(idRegexCheck, {
  message: idRegexErrorMessage("Question ID"),
});

export const QuestionTypeSchema = z.enum([
  "Slider",
  "ChoicesWithSingleAnswer",
  "ChoicesWithMultipleAnswers",
  "YesNo",
  "MultipleText",
  "HowLongAgo",
  "Branch",
  "BranchWithRelativeComparison",
]);

export const QuestionSchema = z
  .object({
    id: QuestionIdSchema,
    type: QuestionTypeSchema,
    question: z.string(),
    next: QuestionIdSchema.nullable(),
  })
  .refine(
    (question) => {
      // TODO: MAKE SURE VALIDATE TYPES MATCH
      return true;
    },
    {
      message: "The question does not have required fields for its type.",
    },
  );

export const SliderQuestionSchema = QuestionSchema.extend({
  type: z.literal(QuestionTypeSchema.enum.Slider),
  slider: z.tuple([z.string(), z.string()]), // [left, right]
  defaultValue: z.number().int().nonnegative().max(100).optional(),
  defaultValueFromQuestionId: QuestionIdSchema.optional(),
});

export const ChoiceSchema = z.object({
  key: z.string(),
  value: z.string(),
});

export const ChoicesQuestionSchema = QuestionSchema.extend({
  type: z.union([
    z.literal(QuestionTypeSchema.enum.ChoicesWithSingleAnswer),
    z.literal(QuestionTypeSchema.enum.ChoicesWithMultipleAnswers),
  ]),
  choices: z.array(ChoiceSchema).nonempty(),
  specialCasesStartId: z
    .intersection(
      // Record<QuestionId, QuestionId>
      z.record(QuestionIdSchema.nullable()),
      // For when the user click "Prefer not to answer" or next without option.
      z.object({ _pna: QuestionIdSchema.nullable().optional() }),
    )
    .optional(),
  randomizeChoicesOrder: z.boolean().optional(),
  randomizeExceptForChoiceIds: z.array(z.string()).optional(),
});

export const ChoicesWithSingleAnswerQuestionSchema = ChoicesQuestionSchema.extend(
  {
    type: z.literal(QuestionTypeSchema.enum.ChoicesWithSingleAnswer),
  },
);

export const ChoicesWithMultipleAnswersQuestionSchema = ChoicesQuestionSchema.extend(
  {
    type: z.literal(QuestionTypeSchema.enum.ChoicesWithMultipleAnswers),
  },
);

export const YesNoQuestionSchema = QuestionSchema.extend({
  type: z.literal(QuestionTypeSchema.enum.YesNo),
  branchStartId: z
    .object({
      yes: QuestionIdSchema.nullable().optional(),
      no: QuestionIdSchema.nullable().optional(),
    })
    .optional(),
  // Currently only `yes` is supported and also can only followup after 3 days
  // and 7 days with the same stream.
  addFollowupStream: z
    .object({
      yes: StreamNameSchema.optional(),
      // TODO: no: StreamNameSchema.optional(),
    })
    .optional(),
});

export const QuestionsListSchema = z.record(QuestionSchema).refine(
  (questions) => {
    for (const questionId in questions) {
      if (questionId !== questions[questionId].id) {
        return false;
      }
    }
    return true;
  },
  {
    message:
      "The key in for the question in questions list should be same as " +
      "its question ID.",
  },
);
