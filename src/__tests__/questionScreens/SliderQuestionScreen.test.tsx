import React from "react";
import { render, fireEvent } from "react-native-testing-library";
import { ReactTestInstance } from "react-test-renderer";

import { SliderAnswerData } from "../../helpers/answerTypes";
import { QuestionType } from "../../helpers/helpers";
import { SliderQuestion } from "../../helpers/types";
import SliderQuestionScreen, {
  DEFAULT_SLIDER_VALUE,
} from "../../questionScreens/SliderQuestionScreen";

const SLIDER_A11Y_LABEL = "slider input";

const SLIDER_QUESTIONS: {
  [questionId: string]: SliderQuestion;
} = {
  WithoutDefault: {
    id: "WithoutDefault",
    type: QuestionType.Slider,
    question: "This question does not have any default value settings.",
    slider: ["leftmost", "rightmost"],
    next: "WithDefault",
  },
  WithDefault: {
    id: "WithDefault",
    type: QuestionType.Slider,
    question: "This question has a default value.",
    defaultValue: 25,
    slider: ["left", "right"],
    next: null,
  },
};

const WITHOUT_DEFAULT = SLIDER_QUESTIONS["WithoutDefault"];

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

  const sliderInputs = getAllByA11yLabel(SLIDER_A11Y_LABEL);
  expect(sliderInputs).toHaveLength(1);
  const sliderInput = sliderInputs[0];

  expect(toJSON()).toMatchSnapshot();

  expect(sliderInput.props.value).toBe(DEFAULT_SLIDER_VALUE);

  const NEW_VALUE = 75;
  moveSlider(sliderInput, NEW_VALUE);
  expect(mockOnDataChangeFn).toHaveBeenCalledWith({
    value: NEW_VALUE,
  } as SliderAnswerData);
});
