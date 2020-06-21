import React from "react";
import { render, fireEvent } from "react-native-testing-library";

import { SliderAnswerData } from "../../helpers/answerTypes";
import { QuestionType } from "../../helpers/helpers";
import { SliderQuestion } from "../../helpers/types";
import SliderQuestionScreen from "../../questionScreens/SliderQuestionScreen";

const SLIDER_QUESTIONS: {
  [questionId: string]: SliderQuestion;
} = {
  Feel_Current: {
    id: "Feel_Current",
    type: QuestionType.Slider,
    question:
      "Please use the slider bar to indicate how you are feeling right now.",
    slider: ["extremely negative", "extremely positive"],
    next: "Feel_Ideal",
  },
  Feel_Ideal: {
    id: "Feel_Ideal",
    type: QuestionType.Slider,
    question:
      "The current value on the slider bar is your previous response about how you currently feel. Please use the slider bar to indicate how you WOULD LIKE to feel.",
    slider: ["extremely negative", "extremely positive"],
    next: "Stressor",
  },
};

const FEEL_CURRENT = SLIDER_QUESTIONS["Feel_Current"];

test("drag once", () => {
  const originalError = console.error;
  jest.spyOn(console, "error").mockImplementation((error: string) => {
    if (
      error.includes("Warning: Slider has been extracted from react-native")
    ) {
      // Slience error about Slider.
      return;
    }
    originalError(error);
  });

  const mockOnDataChangeFn = jest.fn();
  const mockPipeInExtraMetaData = jest.fn();
  const mockSetDataValidationFunction = jest.fn();

  const { getAllByA11yLabel, getByText } = render(
    <SliderQuestionScreen
      key={FEEL_CURRENT.id}
      question={FEEL_CURRENT}
      onDataChange={mockOnDataChangeFn}
      allAnswers={{}}
      allQuestions={SLIDER_QUESTIONS}
      pipeInExtraMetaData={mockPipeInExtraMetaData}
      setDataValidationFunction={mockSetDataValidationFunction}
    />,
  );

  const sliderInputs = getAllByA11yLabel("slider input");
  expect(sliderInputs).toHaveLength(1);
  const sliderInput = sliderInputs[0];

  const NEW_VALUE = 75;
  fireEvent(sliderInput, "onSlidingComplete", {
    nativeEvent: { value: NEW_VALUE },
  });
  expect(mockOnDataChangeFn).toHaveBeenCalledWith({
    value: NEW_VALUE,
  } as SliderAnswerData);
});
