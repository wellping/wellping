import { QuestionSchema } from "../../../helpers/schemas/Question";

describe("QuestionSchema", () => {
  test("empty", () => {
    expect(() => {
      QuestionSchema.parse({});
    }).toThrowErrorMatchingSnapshot();
  });

  test("incomplete fields", () => {
    expect(() => {
      QuestionSchema.parse({
        id: "Feel_Ideal",
        type: "Slider",
        question: "(This is missing `slider` field)",
        defaultValueFromQuestionId: "Feel_Current",
        next: "Stressor",
      });
    }).toThrowErrorMatchingSnapshot();
  });

  test("next should not be undefined", () => {
    expect(() => {
      QuestionSchema.parse({
        id: "Feel_Ideal",
        type: "Slider",
        question: "(This is missing `next` field)",
        defaultValueFromQuestionId: "Feel_Current",
        slider: ["left", "right"],
      });
    }).toThrowErrorMatchingSnapshot();

    expect(() => {
      QuestionSchema.parse({
        id: "Feel_Ideal",
        type: "Slider",
        question: "Good question",
        defaultValueFromQuestionId: "Feel_Current",
        slider: ["left", "right"],
        next: null,
      });
    }).not.toThrowError();

    expect(() => {
      QuestionSchema.parse({
        id: "Feel_Ideal",
        type: "Slider",
        question: "Good question",
        defaultValueFromQuestionId: "Feel_Current",
        slider: ["left", "right"],
        next: "Next_Question",
      });
    }).not.toThrowError();
  });

  test("invalid type", () => {
    expect(() => {
      QuestionSchema.parse({
        id: "invalid_question",
        type: "OwO",
        question: "Invalid question!",
        next: null,
      });
    }).toThrowErrorMatchingSnapshot();
  });

  test("missing type", () => {
    expect(() => {
      QuestionSchema.parse({
        id: "Feel_Ideal",
        question: "Missing type question",
        defaultValueFromQuestionId: "Feel_Current",
        slider: ["left", "right"],
        next: null,
      });
    }).toThrowErrorMatchingSnapshot();
  });

  test("mismatch type", () => {
    expect(() => {
      QuestionSchema.parse({
        id: "Feel_Ideal",
        type: "ChoicesWithSingleAnswer",
        question: "Bad type question",
        defaultValueFromQuestionId: "Feel_Current",
        slider: ["left", "right"],
        next: "Next_Question",
      });
    }).toThrowErrorMatchingSnapshot();
  });
});
