import * as z from "zod";

import {
  StreamNameSchema,
  QuestionIdSchema,
  QuestionIdSchemaNullable,
  ChoicesListSchema,
  ChoiceSchema,
} from "./common";
import { idRegexCheck, idRegexErrorMessage } from "./helper";

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
  /**
   * The question ID.
   */
  id: QuestionIdSchema,

  /**
   * The question type.
   */
  type: QuestionTypeSchema,

  /**
   * The question text.
   */
  question: z.string(),

  /**
   * The optional fallback next IDs.
   */
  fallbackNext: z
    .object({
      /**
       * If not `undefined`, this will replace `next` when the user prefers not
       * to answer this question.
       */
      preferNotToAnswer: QuestionIdSchema.nullable().optional(),

      /**
       * If not `undefined`, this will replace `next` when the user presses the
       * "Next" button without interacting with the question UI (the slider,
       * the selection buttons, etc.).
       */
      nextWithoutAnswering: QuestionIdSchema.nullable().optional(),
    })
    .optional(),

  /**
   * The question ID of the next question.
   */
  next: QuestionIdSchemaNullable(["next"]),
});

export const SliderQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal(QuestionTypeSchema.enum.Slider),
  slider: z.tuple([z.string(), z.string()]), // [left, right]
  defaultValue: z.number().int().nonnegative().max(100).optional(),
  defaultValueFromQuestionId: QuestionIdSchema.optional(),
});

export const ChoicesQuestionSchema = BaseQuestionSchema.extend({
  type: z.union([
    z.literal(QuestionTypeSchema.enum.ChoicesWithSingleAnswer),
    z.literal(QuestionTypeSchema.enum.ChoicesWithMultipleAnswers),
  ]),
  choices: z.union([z.string(), ChoicesListSchema]),
  specialCasesStartId: z
    // We use an array of tuples here so that the special case next question is
    // deterministic in the case of ChoicesWithMultipleAnswers.
    .array(z.tuple([ChoiceSchema, QuestionIdSchema.nullable()]))
    .optional(),
  randomizeChoicesOrder: z.boolean().optional(),
  randomizeExceptForChoiceIds: z.array(z.string()).optional(),
})
  .refine(
    (question) => {
      if (
        question.specialCasesStartId &&
        Array.isArray(question.specialCasesStartId) &&
        question.choices
      ) {
        if (typeof question.choices === "string") {
          // Can't check if it is using reusable choices.
          return true;
        }
        for (const specialCase of question.specialCasesStartId) {
          if (!question.choices.includes(specialCase[0])) {
            return false;
          }
        }
      }
      return true;
    },
    {
      message:
        "Choices keys in `specialCasesStartId` must also be in `choices`.",
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
        if (typeof question.choices === "string") {
          // Can't check if it is using reusable choices.
          return true;
        }
        for (const exceptKey of question.randomizeExceptForChoiceIds) {
          if (!question.choices.includes(exceptKey)) {
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
  indexName: z
    .string()
    .nonempty()
    .refine(idRegexCheck, {
      // Because `indexName` might be used in Question ID.
      message: idRegexErrorMessage("index name"),
    }),
  variableName: z
    .string()
    .nonempty()
    .refine(idRegexCheck, {
      // Because `variableName` might be used in Question ID.
      message: idRegexErrorMessage("variable name"),
    }),
  placeholder: z.string().optional(),
  choices: z.union([z.string(), ChoicesListSchema]).optional(),
  forceChoice: z.boolean().optional(),
  max: z.number().int().positive(),
  // The max number of text field will be `max` minus the number of text the
  // participant entered in `maxMinus` question.
  maxMinus: QuestionIdSchema.optional(),
  repeatedItemStartId: QuestionIdSchema.optional(),
}).refine(
  (question) => {
    if (question.forceChoice !== undefined) {
      if (question.choices === undefined) {
        return false;
      }
    }
    return true;
  },
  {
    message: "`forceChoice` can only be set if `choices` is set.",
    path: ["forceChoice"],
  },
);

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

export const QuestionsListSchema = z
  .record(QuestionSchema)
  .refine(
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
        "The key for the question in questions list should be same as " +
        "its question ID.",
    },
  )
  .refine(
    (questions) => {
      const questionKeys = Object.keys(questions);
      for (const questionId in questions) {
        const nextId = questions[questionId].next;
        if (nextId !== null && !questionKeys.includes(nextId)) {
          return false;
        }
      }
      return true;
    },
    {
      message:
        "A question's `next` question ID is not present in the question list.",
    },
  );
