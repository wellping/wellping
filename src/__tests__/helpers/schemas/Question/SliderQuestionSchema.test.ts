import { QuestionType } from "../../../../helpers/helpers";
import { SliderQuestionSchema } from "../../../../helpers/schemas/Question";

describe("SliderQuestionSchema", () => {
  test("type", () => {
    const question = {
      id: "Feel_Ideal",
      question: "Slider question",
      next: "Next_Question",
      slider: ["left", "right"],
    };

    expect(() => {
      SliderQuestionSchema.parse({
        ...question,
        type: QuestionType.Slider,
      });
    }).not.toThrowError();

    expect(() => {
      SliderQuestionSchema.parse({
        ...question,
        type: QuestionType.HowLongAgo,
      });
    }).toThrowErrorMatchingSnapshot();
  });

  test("slider tuple", () => {
    const question = {
      id: "Feel_Ideal",
      type: QuestionType.Slider,
      question: "Slider question",
      next: "Next_Question",
    };

    expect(() => {
      SliderQuestionSchema.parse({
        ...question,
        slider: ["left", "right"],
      });
    }).not.toThrowError();

    expect(() => {
      SliderQuestionSchema.parse({
        ...question,
        slider: ["left", "right", "top"],
      });
    }).toThrowErrorMatchingSnapshot("three items");

    expect(() => {
      SliderQuestionSchema.parse({
        ...question,
        slider: ["left"],
      });
    }).toThrowErrorMatchingSnapshot("one item");

    expect(() => {
      SliderQuestionSchema.parse({
        ...question,
        slider: [],
      });
    }).toThrowErrorMatchingSnapshot("zero item");
  });

  test("default value range 0 - 100", () => {
    const question = {
      id: "Feel_Ideal",
      type: QuestionType.Slider,
      question: "Range question",
      slider: ["left", "right"],
      next: "Next_Question",
    };

    expect(() => {
      SliderQuestionSchema.parse({
        ...question,
        defaultValue: 50,
      });
    }).not.toThrowError();

    expect(() => {
      SliderQuestionSchema.parse({
        ...question,
        defaultValue: 0,
      });
    }).not.toThrowError();

    expect(() => {
      SliderQuestionSchema.parse({
        ...question,
        defaultValue: 100,
      });
    }).not.toThrowError();

    expect(() => {
      SliderQuestionSchema.parse({
        ...question,
        defaultValue: -1,
      });
    }).toThrowErrorMatchingSnapshot("<0");

    expect(() => {
      SliderQuestionSchema.parse({
        ...question,
        defaultValue: 101,
      });
    }).toThrowErrorMatchingSnapshot(">100");
  });

  describe("defaultValueFromQuestionId", () => {
    const question = {
      id: "Feel_Ideal",
      type: QuestionType.Slider,
      question: "Range question",
      slider: ["left", "right"],
      next: "Next_Question",
    };

    test("can be undefined", () => {
      expect(() => {
        SliderQuestionSchema.parse({
          ...question,
        });
      }).not.toThrowError();
    });

    test("cannot be null", () => {
      expect(() => {
        SliderQuestionSchema.parse({
          ...question,
          defaultValueFromQuestionId: null,
        });
      }).toThrowErrorMatchingSnapshot();
    });

    test("is question ID", () => {
      expect(() => {
        SliderQuestionSchema.parse({
          ...question,
          defaultValueFromQuestionId: "valid_question_id",
        });
      }).not.toThrowError();

      expect(() => {
        SliderQuestionSchema.parse({
          ...question,
          defaultValueFromQuestionId: "INVALID QUESTION-ID",
        });
      }).toThrowErrorMatchingSnapshot("invalid id");

      expect(() => {
        SliderQuestionSchema.parse({
          ...question,
          defaultValueFromQuestionId: "",
        });
      }).toThrowErrorMatchingSnapshot("empty id");
    });
  });
});
