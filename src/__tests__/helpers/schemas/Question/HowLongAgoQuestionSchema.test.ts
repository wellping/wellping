import { QuestionType } from "../../../../helpers/helpers";
import { HowLongAgoQuestionSchema } from "../../../../helpers/schemas/Question";

describe("HowLongAgoQuestionSchema", () => {
  test("type", () => {
    const question = {
      id: "Feel_Ideal",
      question: "how long ago question",
      next: "Next_Question",
    };

    expect(() => {
      HowLongAgoQuestionSchema.parse({
        ...question,
        type: QuestionType.HowLongAgo,
      });
    }).not.toThrowError();

    expect(() => {
      HowLongAgoQuestionSchema.parse({
        ...question,
        type: QuestionType.ChoicesWithMultipleAnswers,
      });
    }).toThrowErrorMatchingSnapshot();
  });
});
