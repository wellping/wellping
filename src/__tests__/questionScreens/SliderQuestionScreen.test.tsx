import React from "react";
import { render, fireEvent, A11yAPI } from "react-native-testing-library";
import { ReactTestInstance } from "react-test-renderer";

import { SliderAnswerData } from "../../helpers/answerTypes";
import { QuestionType } from "../../helpers/helpers";
import { SliderQuestion } from "../../helpers/types";
import SliderQuestionScreen, {
  DEFAULT_SLIDER_VALUE,
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
    question: "This question has a default value.",
    defaultValue: 25,
    slider: ["left", "right"],
    next: null,
  },
};
const WITHOUT_DEFAULT = SLIDER_QUESTIONS["WithoutDefault"];
const WITH_CONSTANT_DEFAULT = SLIDER_QUESTIONS["WithConstantDefault"];

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

test("without default value", () => {
  const mockOnDataChangeFn = jest.fn();
  const mockPipeInExtraMetaData = jest.fn();
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
  const mockPipeInExtraMetaData = jest.fn();
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

test("update values", () => {
  const mockOnDataChangeFn = jest.fn();
  const mockPipeInExtraMetaData = jest.fn();
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
