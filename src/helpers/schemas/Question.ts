import * as z from "zod";

import {
  StreamNameSchema,
  QuestionIdSchema,
  QuestionIdSchemaNullable,
} from "./common";

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

const BaseQuestionSchema = z.object({
  id: QuestionIdSchema,
  type: QuestionTypeSchema,
  question: z.string(),
  next: QuestionIdSchemaNullable(["next"]),
});

export const SliderQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal(QuestionTypeSchema.enum.Slider),
  slider: z.tuple([z.string(), z.string()]), // [left, right]
  defaultValue: z.number().int().nonnegative().max(100).optional(),
  defaultValueFromQuestionId: QuestionIdSchema.optional(),
});

export const ChoiceSchema = z.object({
  key: z.string(),
  value: z.string(),
});

export const ChoicesQuestionSchema = BaseQuestionSchema.extend({
  type: z.union([
    z.literal(QuestionTypeSchema.enum.ChoicesWithSingleAnswer),
    z.literal(QuestionTypeSchema.enum.ChoicesWithMultipleAnswers),
  ]),
  choices: z.array(ChoiceSchema).nonempty(),
  specialCasesStartId: z
    .union([
      // TODO: https://github.com/vriad/zod/issues/104
      // Record<choice key, question ID>
      z.record(QuestionIdSchema.nullable()),
      // For when the user click "Prefer not to answer" or next without option.
      z.object({ _pna: QuestionIdSchema.nullable().optional() }),
    ])
    .optional(),
  randomizeChoicesOrder: z.boolean().optional(),
  randomizeExceptForChoiceIds: z.array(z.string()).optional(),
})
  .refine(
    (question) => {
      if (question.specialCasesStartId && question.choices) {
        const choicesKeys = question.choices.map((choice) => choice.key);
        for (const key of Object.keys(question.specialCasesStartId)) {
          if (key !== "_pna" && !choicesKeys.includes(key)) {
            return false;
          }
        }
      }
      return true;
    },
    {
      message:
        'Keys in `specialCasesStartId` must also be in `choices` or be "_pna".',
      path: ["specialCasesStartId"],
    },
  )
  .refine(
    (question) => {
      if (
        question.randomizeExceptForChoiceIds &&
        !question.randomizeChoicesOrder
      ) {
        return false;
      }
      return true;
    },
    {
      message:
        "`randomizeExceptForChoiceIds` should only be set when " +
        "`randomizeChoicesOrder` is set to `true`.",
      path: ["randomizeExceptForChoiceIds"],
    },
  )
  .refine(
    (question) => {
      if (
        question.choices &&
        question.randomizeExceptForChoiceIds &&
        question.randomizeChoicesOrder
      ) {
        const choicesKeys = question.choices.map((choice) => choice.key);
        for (const exceptKey of question.randomizeExceptForChoiceIds) {
          if (!choicesKeys.includes(exceptKey)) {
            return false;
          }
        }
      }
      return true;
    },
    {
      message:
        "Keys in `randomizeExceptForChoiceIds` should also be present in " +
        "`choices`.",
      path: ["randomizeExceptForChoiceIds"],
    },
  );

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

export const YesNoQuestionSchema = BaseQuestionSchema.extend({
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

export const MultipleTextQuestionSchema = BaseQuestionSchema.extend({
  // `id` will store the number of text fields answered.
  type: z.literal(QuestionTypeSchema.enum.MultipleText),
  indexName: z.string().nonempty(),
  variableName: z.string().nonempty(),
  placeholder: z.string().optional(),
  choices: z.union([z.literal("NAMES"), z.array(ChoiceSchema)]).optional(),
  forceChoice: z.boolean().optional(),
  max: z.number().int().positive(),
  // The max number of text field will be `max` minus the number of text the
  // participant entered in `maxMinus` question.
  maxMinus: QuestionIdSchema.optional(),
  repeatedItemStartId: QuestionIdSchema.optional(),
  // This is used when the user does not enter any name or select prefer not to
  // answer. Note that this has to exists somewhere else. If it is `null`, we
  // will go to `next` directly.
  // TODO: MAKE THIS null = stop HERE
  fallbackItemStartId: QuestionIdSchema.nullable().optional(),
});

export const HowLongAgoQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal(QuestionTypeSchema.enum.HowLongAgo),
});

export const BranchQuestionSchema = BaseQuestionSchema.extend({
  // This is not actually a question (it will not be displayed to the user)
  type: z.literal(QuestionTypeSchema.enum.Branch),
  condition: z.object({
    questionId: QuestionIdSchema,
    questionType: z.union([
      z.literal(QuestionTypeSchema.enum.MultipleText),
      z.literal(QuestionTypeSchema.enum.ChoicesWithSingleAnswer),
    ]),
    compare: z.literal("equal"),
    target: z.union([z.number(), z.string()]),
  }),
  branchStartId: z.object({
    // TODO: ALSO ALLOW NULL = STOP HERE
    true: QuestionIdSchema.nullable().optional(),
    false: QuestionIdSchema.nullable().optional(),
  }),
});

export const BranchWithRelativeComparisonQuestionSchema = BaseQuestionSchema.extend(
  {
    // This is not actually a question (it will not be displayed to the user)
    type: z.literal(QuestionTypeSchema.enum.BranchWithRelativeComparison),
    // TODO: ALSO ALLOW NULL = STOP HERE
    branchStartId: z.record(QuestionIdSchema.nullable()),
  },
);

export const QuestionSchema = z
  .union([
    SliderQuestionSchema,
    ChoicesWithSingleAnswerQuestionSchema,
    ChoicesWithMultipleAnswersQuestionSchema,
    YesNoQuestionSchema,
    MultipleTextQuestionSchema,
    HowLongAgoQuestionSchema,
    BranchQuestionSchema,
    BranchWithRelativeComparisonQuestionSchema,
  ])
  .refine((question) => {
    /**
     * This is to tell user in more details what is going wrong.
     *
     * `...Schema.parse` should throw error if any, replacing the default
     * error.
     *
     * The `default:` clause should handle the case where the type is invalid.
     */
    switch (question.type) {
      case QuestionTypeSchema.enum.Slider:
        SliderQuestionSchema.parse(question);
        break;

      case QuestionTypeSchema.enum.ChoicesWithSingleAnswer:
        ChoicesWithSingleAnswerQuestionSchema.parse(question);
        break;

      case QuestionTypeSchema.enum.ChoicesWithMultipleAnswers:
        ChoicesWithMultipleAnswersQuestionSchema.parse(question);
        break;

      case QuestionTypeSchema.enum.YesNo:
        YesNoQuestionSchema.parse(question);
        break;

      case QuestionTypeSchema.enum.MultipleText:
        MultipleTextQuestionSchema.parse(question);
        break;

      case QuestionTypeSchema.enum.HowLongAgo:
        HowLongAgoQuestionSchema.parse(question);
        break;

      case QuestionTypeSchema.enum.Branch:
        BranchQuestionSchema.parse(question);
        break;

      case QuestionTypeSchema.enum.BranchWithRelativeComparison:
        BranchWithRelativeComparisonQuestionSchema.parse(question);
        break;

      default:
        BaseQuestionSchema.parse(question);
        break;
    }
    return true;
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
