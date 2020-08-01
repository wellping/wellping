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
          indexName: "INDEX",
        });
      }).not.toThrowError();

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

  describe("variableName", () => {
    const question = {
      id: "Feel_Ideal",
      type: QuestionType.MultipleText,
      question: "Multiple text question",
      indexName: "INDEX",
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
          variableName: "",
        });
      }).toThrowErrorMatchingSnapshot();
    });

    test("can be any string", () => {
      expect(() => {
        MultipleTextQuestionSchema.parse({
          ...question,
          variableName: "TARGET",
        });
      }).not.toThrowError();

      expect(() => {
        MultipleTextQuestionSchema.parse({
          ...question,
          variableName: "target_name",
        });
      }).not.toThrowError();

      expect(() => {
        MultipleTextQuestionSchema.parse({
          ...question,
          variableName: "HELLO WORLD",
        });
      }).not.toThrowError();

      expect(() => {
        MultipleTextQuestionSchema.parse({
          ...question,
          variableName: "__+O+__",
        });
      }).not.toThrowError();
    });
  });

  describe("eachId", () => {
    const question = {
      id: "Feel_Ideal",
      type: QuestionType.MultipleText,
      question: "Multiple text question",
      indexName: "INDEX",
      variableName: "TARGET_NAME",
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
          eachId: "",
        });
      }).toThrowErrorMatchingSnapshot();
    });

    test("can be any string", () => {
      expect(() => {
        MultipleTextQuestionSchema.parse({
          ...question,
          eachId: "Name_[__INDEX__]",
        });
      }).not.toThrowError();

      expect(() => {
        MultipleTextQuestionSchema.parse({
          ...question,
          eachId: "target_name",
        });
      }).not.toThrowError();

      expect(() => {
        MultipleTextQuestionSchema.parse({
          ...question,
          eachId: "HELLO WORLD",
        });
      }).not.toThrowError();

      expect(() => {
        MultipleTextQuestionSchema.parse({
          ...question,
          eachId: "__+O+__",
        });
      }).not.toThrowError();
    });
  });
});
