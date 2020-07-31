import { QuestionType } from "../../../../helpers/helpers";
import { MultipleTextQuestionSchema } from "../../../../helpers/schemas/Question";

describe("MultipleTextQuestionSchema", () => {
  test("type", () => {
    const question = {
      id: "Feel_Ideal",
      question: "Multiple text question",
      indexName: "INDEX",
      variableName: "TARGET_NAME",
      eachId: "Name_[__INDEX__]",
      max: 3,
      next: "Next_Question",
    };

    expect(() => {
      MultipleTextQuestionSchema.parse({
        ...question,
        type: QuestionType.MultipleText,
      });
    }).not.toThrowError();

    expect(() => {
      MultipleTextQuestionSchema.parse({
        ...question,
        type: QuestionType.HowLongAgo,
      });
    }).toThrowErrorMatchingSnapshot();
  });

  describe("indexName", () => {
    const question = {
      id: "Feel_Ideal",
      type: QuestionType.MultipleText,
      question: "Multiple text question",
      variableName: "TARGET_NAME",
      eachId: "Name_[__INDEX__]",
      max: 3,
      next: "Next_Question",
    };

    test("should not be undefined", () => {
      expect(() => {
        MultipleTextQuestionSchema.parse({
          ...question,
        });
      }).toThrowErrorMatchingSnapshot();
    });

    test("should not be empty", () => {
      expect(() => {
        MultipleTextQuestionSchema.parse({
          ...question,
          indexName: "",
        });
      }).toThrowErrorMatchingSnapshot();
    });

    test("can be any string", () => {
      expect(() => {
        MultipleTextQuestionSchema.parse({
          ...question,
          indexName: "hello_world",
        });
      }).not.toThrowError();

      expect(() => {
        MultipleTextQuestionSchema.parse({
          ...question,
          indexName: "HELLO WORLD",
        });
      }).not.toThrowError();

      expect(() => {
        MultipleTextQuestionSchema.parse({
          ...question,
          indexName: "__+O+__",
        });
      }).not.toThrowError();
    });
  });
});
