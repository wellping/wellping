import React from "react";
import { render, fireEvent, A11yAPI } from "react-native-testing-library";
import { ReactTestInstance } from "react-test-renderer";

import { SliderAnswerData } from "../../helpers/answerTypes";
import { QuestionType } from "../../helpers/helpers";
import { SliderQuestion } from "../../helpers/types";
import SliderQuestionScreen, {
  DEFAULT_SLIDER_VALUE,
  getQuestionDefaultSliderValue,
} from "../../questionScreens/SliderQuestionScreen";

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
  WithDefaultFromElsewhere: {
    id: "WithDefaultFromElsewhere",
    type: QuestionType.Slider,
    question:
      "This question has a default value that is from another question.",
    defaultValueFromQuestionId: "WithConstantDefault",
    defaultValue: 100, // This should be ignored for this question.
    slider: ["left", "right"],
    next: null,
  },
};
const WITHOUT_DEFAULT = SLIDER_QUESTIONS["WithoutDefault"];
const WITH_CONSTANT_DEFAULT = SLIDER_QUESTIONS["WithConstantDefault"];
const WITH_DEFAULT_FROM_ELSEWHERE =
  SLIDER_QUESTIONS["WithDefaultFromElsewhere"];

const SLIDER_A11Y_LABEL = "slider input";
const getSlider = (getAllByA11yLabel: A11yAPI["getAllByA11yLabel"]) => {
  const sliderInputs = getAllByA11yLabel(SLIDER_A11Y_LABEL);
  expect(sliderInputs).toHaveLength(1);
  const sliderInput = sliderInputs[0];
  return sliderInput;
};
const moveSlider = (sliderInput: ReactTestInstance, value: number) => {
  fireEvent(sliderInput, "onSlidingComplete", {
    nativeEvent: { value },
  });
};

const simplePipeInExtraMetaData = (id: string) => id;

test("without default value", () => {
  const mockOnDataChangeFn = jest.fn();
  const mockPipeInExtraMetaData = jest.fn(simplePipeInExtraMetaData);
  const mockSetDataValidationFunction = jest.fn();

  const { getAllByA11yLabel, toJSON } = render(
    <SliderQuestionScreen
      key={WITHOUT_DEFAULT.id}
      question={WITHOUT_DEFAULT}
      onDataChange={mockOnDataChangeFn}
      allAnswers={{}}
      allQuestions={SLIDER_QUESTIONS}
      pipeInExtraMetaData={mockPipeInExtraMetaData}
      setDataValidationFunction={mockSetDataValidationFunction}
    />,
  );

  // Because there isn't a need to pipe in any data.
  expect(mockPipeInExtraMetaData).not.toHaveBeenCalled();

  // Because there isn't any requirement to validate the data.
  expect(mockSetDataValidationFunction).not.toHaveBeenCalled();

  const sliderInput = getSlider(getAllByA11yLabel);
  expect(sliderInput.props.value).toBe(DEFAULT_SLIDER_VALUE);

  expect(toJSON()).toMatchSnapshot();
});

test("with constant default value", () => {
  const mockOnDataChangeFn = jest.fn();
  const mockPipeInExtraMetaData = jest.fn(simplePipeInExtraMetaData);
  const mockSetDataValidationFunction = jest.fn();

  const { getAllByA11yLabel, toJSON } = render(
    <SliderQuestionScreen
      key={WITH_CONSTANT_DEFAULT.id}
      question={WITH_CONSTANT_DEFAULT}
      onDataChange={mockOnDataChangeFn}
      allAnswers={{}}
      allQuestions={SLIDER_QUESTIONS}
      pipeInExtraMetaData={mockPipeInExtraMetaData}
      setDataValidationFunction={mockSetDataValidationFunction}
    />,
  );

  // Because there isn't a need to pipe in any data.
  expect(mockPipeInExtraMetaData).not.toHaveBeenCalled();

  // Because there isn't any requirement to validate the data.
  expect(mockSetDataValidationFunction).not.toHaveBeenCalled();

  const sliderInput = getSlider(getAllByA11yLabel);
  expect(sliderInput.props.value).toBe(WITH_CONSTANT_DEFAULT.defaultValue);

  expect(toJSON()).toMatchSnapshot();
});

const testDefaultValueFromElsewhere = (
  prevAnswerData: SliderAnswerData | null,
) => {
  const mockOnDataChangeFn = jest.fn();
  const mockPipeInExtraMetaData = jest.fn(simplePipeInExtraMetaData);
  const mockSetDataValidationFunction = jest.fn();

  const { getAllByA11yLabel, toJSON } = render(
    <SliderQuestionScreen
      key={WITH_DEFAULT_FROM_ELSEWHERE.id}
      question={WITH_DEFAULT_FROM_ELSEWHERE}
      onDataChange={mockOnDataChangeFn}
      allAnswers={{
        // @ts-ignore (we don't need to craft an entire AnswerEntity)
        WithConstantDefault: {
          data: prevAnswerData,
        },
      }}
      allQuestions={SLIDER_QUESTIONS}
      pipeInExtraMetaData={mockPipeInExtraMetaData}
      setDataValidationFunction={mockSetDataValidationFunction}
    />,
  );

  // To pipe in `defaultValueFromQuestionId`.
  expect(mockPipeInExtraMetaData).toHaveBeenCalledTimes(1);

  // Because there isn't any requirement to validate the data.
  expect(mockSetDataValidationFunction).not.toHaveBeenCalled();

  const sliderInput = getSlider(getAllByA11yLabel);
  // `defaultValue` should be ignored here.
  expect(sliderInput.props.value).not.toBe(
    WITH_DEFAULT_FROM_ELSEWHERE.defaultValue,
  );

  expect(toJSON()).toMatchSnapshot();

  return sliderInput;
};

test("with default value from elsewhere - with previous data", () => {
  const PREV_ANSWER_DATA = 33;
  const sliderInput = testDefaultValueFromElsewhere({
    value: PREV_ANSWER_DATA,
  });
  expect(sliderInput.props.value).toBe(PREV_ANSWER_DATA);
});

test("with default value from elsewhere - without previous data", () => {
  const sliderInput = testDefaultValueFromElsewhere(null);
  expect(sliderInput.props.value).toBe(
    // If previous data is `null`, the question should use the default
    // slider value of previous question.
    getQuestionDefaultSliderValue(
      SLIDER_QUESTIONS[WITH_DEFAULT_FROM_ELSEWHERE.defaultValueFromQuestionId!],
    ),
  );
});

test("update values", () => {
  const mockOnDataChangeFn = jest.fn();
  const mockPipeInExtraMetaData = jest.fn(simplePipeInExtraMetaData);
  const mockSetDataValidationFunction = jest.fn();

  const { getAllByA11yLabel } = render(
    <SliderQuestionScreen
      key={WITHOUT_DEFAULT.id}
      question={WITHOUT_DEFAULT}
      onDataChange={mockOnDataChangeFn}
      allAnswers={{}}
      allQuestions={SLIDER_QUESTIONS}
      pipeInExtraMetaData={mockPipeInExtraMetaData}
      setDataValidationFunction={mockSetDataValidationFunction}
    />,
  );

  const sliderInput = getSlider(getAllByA11yLabel);

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
