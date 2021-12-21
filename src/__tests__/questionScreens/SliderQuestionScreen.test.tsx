import { SliderAnswerData } from "@wellping/study-schemas/lib/answerTypes";
import { SliderQuestion } from "@wellping/study-schemas/lib/types";
import React from "react";
import { render } from "react-native-testing-library";

import { QuestionType } from "../../helpers/helpers";
import SliderQuestionScreen, {
  getQuestionDefaultSliderValue,
} from "../../questionScreens/SliderQuestionScreen";
import { SLIDER_DEFAULTS } from "../../questionScreens/constants";
import { simplePipeInExtraMetaData } from "../helper";
import {
  moveSlider,
  findSliderAsync,
} from "../reactNativeTestingLibraryHelper";

const SLIDER_QUESTIONS: {
  [questionId: string]: SliderQuestion;
} = {
  WithoutDefault: {
    id: "WithoutDefault",
    type: QuestionType.Slider,
    question: "This question does not have any default value settings.",
    slider: ["leftmost", "rightmost"],
    next: "WithConstantDefault",
  },
  WithConstantDefault: {
    id: "WithConstantDefault",
    type: QuestionType.Slider,
    question: "This question has a constant default value.",
    defaultValue: 25,
    slider: ["left", "right"],
    next: "WithDefaultFromElsewhere",
  },
  WithDefaultFromQWithoutDefault: {
    id: "WithDefaultFromQWithoutDefault",
    type: QuestionType.Slider,
    question:
      "This question has a default value that is from another question (that does not have `defaultValue`).",
    defaultValueFromQuestionId: "WithoutDefault",
    defaultValue: 100, // This should be ignored for this question.
    slider: ["left", "right"],
    next: "WithDefaultFromQWithDefault",
  },
  WithDefaultFromQWithDefault: {
    id: "WithDefaultFromQWithDefault",
    type: QuestionType.Slider,
    question:
      "This question has a default value that is from another question (that has `defaultValue`).",
    defaultValueFromQuestionId: "WithDefaultFromQWithoutDefault",
    defaultValue: 0, // This should be ignored for this question.
    slider: ["left", "right"],
    next: null,
  },
};
const WITHOUT_DEFAULT = SLIDER_QUESTIONS["WithoutDefault"];
const WITH_CONSTANT_DEFAULT = SLIDER_QUESTIONS["WithConstantDefault"];
const WITH_DEFAULT_FROM_Q_WITHOUT_DEFAULT =
  SLIDER_QUESTIONS["WithDefaultFromQWithoutDefault"];
const WITH_DEFAULT_FROM_Q_WITH_DEFAULT =
  SLIDER_QUESTIONS["WithDefaultFromQWithDefault"];

test("without default value", async () => {
  const mockLoadingCompleted = jest.fn();
  const mockOnDataChangeFn = jest.fn();
  const mockPipeInExtraMetaData = jest.fn(simplePipeInExtraMetaData);
  const mockSetDataValidationFunction = jest.fn();

  const renderResults = render(
    <SliderQuestionScreen
      key={WITHOUT_DEFAULT.id}
      question={WITHOUT_DEFAULT}
      loadingCompleted={mockLoadingCompleted}
      onDataChange={mockOnDataChangeFn}
      allAnswers={{}}
      allQuestions={SLIDER_QUESTIONS}
      pipeInExtraMetaData={mockPipeInExtraMetaData}
      setDataValidationFunction={mockSetDataValidationFunction}
    />,
  );
  const { toJSON } = renderResults;

  const sliderInput = await findSliderAsync(renderResults);
  expect(sliderInput.props.value).toBe(SLIDER_DEFAULTS.DEFAULT_VALUE);

  expect(mockLoadingCompleted).toHaveBeenCalledTimes(1);

  // Because there isn't a need to pipe in any data.
  expect(mockPipeInExtraMetaData).not.toHaveBeenCalled();

  // Because there isn't any requirement to validate the data.
  expect(mockSetDataValidationFunction).not.toHaveBeenCalled();

  expect(toJSON()).toMatchSnapshot();
});

test("with constant default value", async () => {
  const mockLoadingCompleted = jest.fn();
  const mockOnDataChangeFn = jest.fn();
  const mockPipeInExtraMetaData = jest.fn(simplePipeInExtraMetaData);
  const mockSetDataValidationFunction = jest.fn();

  const renderResults = render(
    <SliderQuestionScreen
      key={WITH_CONSTANT_DEFAULT.id}
      question={WITH_CONSTANT_DEFAULT}
      loadingCompleted={mockLoadingCompleted}
      onDataChange={mockOnDataChangeFn}
      allAnswers={{}}
      allQuestions={SLIDER_QUESTIONS}
      pipeInExtraMetaData={mockPipeInExtraMetaData}
      setDataValidationFunction={mockSetDataValidationFunction}
    />,
  );
  const { toJSON } = renderResults;

  const sliderInput = await findSliderAsync(renderResults);
  expect(sliderInput.props.value).toBe(WITH_CONSTANT_DEFAULT.defaultValue);

  expect(mockLoadingCompleted).toHaveBeenCalledTimes(1);

  // Because there isn't a need to pipe in any data.
  expect(mockPipeInExtraMetaData).not.toHaveBeenCalled();

  // Because there isn't any requirement to validate the data.
  expect(mockSetDataValidationFunction).not.toHaveBeenCalled();

  expect(toJSON()).toMatchSnapshot();
});

test.each([
  ["without default value", { value: 31 }, WITH_DEFAULT_FROM_Q_WITHOUT_DEFAULT],
  ["without default value", null, WITH_DEFAULT_FROM_Q_WITHOUT_DEFAULT],
  ["with default value", { value: 61 }, WITH_DEFAULT_FROM_Q_WITH_DEFAULT],
  ["with default value", null, WITH_DEFAULT_FROM_Q_WITH_DEFAULT],
] as [string, SliderAnswerData | null, SliderQuestion][])(
  "with default value from a question %s with data `%o`",
  async (_, prevAnswerData, question) => {
    const mockLoadingCompleted = jest.fn();
    const mockOnDataChangeFn = jest.fn();
    const mockPipeInExtraMetaData = jest.fn(simplePipeInExtraMetaData);
    const mockSetDataValidationFunction = jest.fn();

    const renderResults = render(
      <SliderQuestionScreen
        key={question.id}
        question={question}
        loadingCompleted={mockLoadingCompleted}
        onDataChange={mockOnDataChangeFn}
        allAnswers={{
          // @ts-ignore (we don't need to craft an entire Answer)
          [question.defaultValueFromQuestionId]: {
            data: prevAnswerData,
          },
        }}
        allQuestions={SLIDER_QUESTIONS}
        pipeInExtraMetaData={mockPipeInExtraMetaData}
        setDataValidationFunction={mockSetDataValidationFunction}
      />,
    );
    const { toJSON } = renderResults;

    const sliderInput = await findSliderAsync(renderResults);
    // `defaultValue` should be ignored here.
    expect(sliderInput.props.value).not.toBe(question.defaultValue);

    expect(mockLoadingCompleted).toHaveBeenCalledTimes(1);

    // To pipe in `defaultValueFromQuestionId`.
    expect(mockPipeInExtraMetaData).toHaveBeenCalledTimes(1);

    // Because there isn't any requirement to validate the data.
    expect(mockSetDataValidationFunction).not.toHaveBeenCalled();

    expect(sliderInput.props.value).toBe(
      prevAnswerData
        ? prevAnswerData.value // If previous data is `null`, the question should use the default
        : // slider value of previous question.
          getQuestionDefaultSliderValue(
            SLIDER_QUESTIONS[question.defaultValueFromQuestionId!],
          ),
    );

    expect(toJSON()).toMatchSnapshot();
  },
);

test("update values", async () => {
  const mockLoadingCompleted = jest.fn();
  const mockOnDataChangeFn = jest.fn();
  const mockPipeInExtraMetaData = jest.fn(simplePipeInExtraMetaData);
  const mockSetDataValidationFunction = jest.fn();

  const renderResults = render(
    <SliderQuestionScreen
      key={WITHOUT_DEFAULT.id}
      question={WITHOUT_DEFAULT}
      loadingCompleted={mockLoadingCompleted}
      onDataChange={mockOnDataChangeFn}
      allAnswers={{}}
      allQuestions={SLIDER_QUESTIONS}
      pipeInExtraMetaData={mockPipeInExtraMetaData}
      setDataValidationFunction={mockSetDataValidationFunction}
    />,
  );

  const sliderInput = await findSliderAsync(renderResults);

  expect(mockLoadingCompleted).toHaveBeenCalledTimes(1);

  const NEW_VALUES = [88, 99, 66, 55];
  for (let i = 0; i < NEW_VALUES.length; i++) {
    const NEW_VALUE = NEW_VALUES[i];
    moveSlider(sliderInput, NEW_VALUE);
    expect(mockOnDataChangeFn).toHaveBeenNthCalledWith(i + 1, {
      value: NEW_VALUE,
    } as SliderAnswerData);
    expect(mockOnDataChangeFn).toHaveBeenCalledTimes(i + 1);
  }
});
