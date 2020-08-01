import { QuestionType } from "../../../../helpers/helpers";
import { QuestionsListSchema } from "../../../../helpers/schemas/Question";

describe("QuestionsListSchema", () => {
  test("should not accept inconsistent key and id", () => {
    expect(() => {
      QuestionsListSchema.parse({
        Feel_Ideal: {
          id: "Feel_Ideal",
          type: QuestionType.HowLongAgo,
          question: "how long ago question",
          next: "Next_Question",
        },
      });
    }).not.toThrowError();

    expect(() => {
      QuestionsListSchema.parse({
        NotTheSameKey: {
          id: "Feel_Ideal",
          type: QuestionType.HowLongAgo,
          question: "how long ago question",
          next: "Next_Question",
        },
      });
    }).toThrowErrorMatchingSnapshot("single");

    expect(() => {
      QuestionsListSchema.parse({
        NotTheSameKey: {
          id: "Feel_Ideal",
          type: QuestionType.HowLongAgo,
          question: "how long ago question",
          next: "Feel_Current",
        },
        Feel_Current: {
          id: "Feel_Current",
          type: QuestionType.HowLongAgo,
          question: "how long ago question",
          next: "How_Are",
        },
        How_Are: {
          id: "NotId",
          type: QuestionType.HowLongAgo,
          question: "how long ago question",
          next: null,
        },
      });
    }).toThrowErrorMatchingSnapshot("multiple");
  });
});
