import { QuestionType } from "../../../../helpers/helpers";
import { QuestionTypeSchema } from "../../../../helpers/schemas/Question";

describe("QuestionTypeSchema", () => {
  test("should not change", () => {
    expect(QuestionTypeSchema).toMatchInlineSnapshot(`
      Object {
        "t": "enum",
        "values": Array [
          "Slider",
          "ChoicesWithSingleAnswer",
          "ChoicesWithMultipleAnswers",
          "YesNo",
          "MultipleText",
          "HowLongAgo",
          "Branch",
          "BranchWithRelativeComparison",
        ],
      }
    `);
  });

  test(".enum should be equal to QuestionType", () => {
    expect(QuestionTypeSchema.enum).toStrictEqual(QuestionType);
  });
});
