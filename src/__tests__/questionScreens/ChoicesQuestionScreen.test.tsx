import React from "react";
import { Alert } from "react-native";
import {
  render,
  fireEvent,
  A11yAPI,
  FireEventAPI,
  waitFor,
} from "react-native-testing-library";
import { ReactTestInstance } from "react-test-renderer";

import {
  YesNoAnswerData,
  ChoicesWithSingleAnswerAnswerData,
} from "../../helpers/answerTypes";
import { QuestionType } from "../../helpers/helpers";
import {
  YesNoQuestion,
  ChoicesWithSingleAnswerQuestion,
} from "../../helpers/types";
import ChoicesQuestionScreen from "../../questionScreens/ChoicesQuestionScreen";
import { simplePipeInExtraMetaData } from "../helper";

export const getSelectionA11YLabel = (option: string) => `select ${option}`;
export const getSelection = (
  option: string,
  getAllByA11yLabel: A11yAPI["getAllByA11yLabel"],
) => {
  const selections = getAllByA11yLabel(getSelectionA11YLabel(option));
  expect(selections).toHaveLength(1);
  const selection = selections[0];
  return selection;
};

const basicTestForYesNoQuestionAsync = async (
  question: YesNoQuestion,
  inputValue: boolean | null,
) => {
  const mockOnDataChangeFn = jest.fn();
  const mockPipeInExtraMetaData = jest.fn(simplePipeInExtraMetaData);
  const mockSetDataValidationFunction = jest.fn();

  const renderResults = render(
    <ChoicesQuestionScreen
      key={question.id}
      question={question}
      onDataChange={mockOnDataChangeFn}
      allAnswers={{}}
      allQuestions={{ [question.id]: question }}
      pipeInExtraMetaData={mockPipeInExtraMetaData}
      setDataValidationFunction={mockSetDataValidationFunction}
    />,
  );
  const { getAllByA11yLabel } = renderResults;

  expect(mockPipeInExtraMetaData).toHaveBeenCalledTimes(2); // For "Yes, No" two options

  // There shouldn't need to be any validation
  expect(mockSetDataValidationFunction).not.toHaveBeenCalled();

  const selections = getAllByA11yLabel(/select (.*?)/);
  expect(selections).toHaveLength(2);

  if (inputValue === true) {
    const yesSelection = getSelection(`Yes`, getAllByA11yLabel);
    fireEvent.press(yesSelection);

    expect(mockOnDataChangeFn).toHaveBeenNthCalledWith(1, {
      value: true,
    } as YesNoAnswerData);
    expect(mockOnDataChangeFn).toHaveBeenCalledTimes(1);
  } else if (inputValue === false) {
    const noSelection = getSelection(`No`, getAllByA11yLabel);
    fireEvent.press(noSelection);

    expect(mockOnDataChangeFn).toHaveBeenNthCalledWith(1, {
      value: false,
    } as YesNoAnswerData);
  }

  return renderResults;
};

test.each([true, false])("YesNo question with input %p", async (value) => {
  const question = {
    id: "YesNo",
    type: QuestionType.YesNo,
    question: "Are you happy?",
    next: null,
  } as YesNoQuestion;

  await basicTestForYesNoQuestionAsync(question, value);
});

const basicTestForChoicesWithSingleAnswerQuestionAsync = async (
  question: ChoicesWithSingleAnswerQuestion,
  inputValueSequence: string[],
) => {
  // To make sure we can deterministically confirm the randomness.
  // https://stackoverflow.com/a/57730344/2603230
  const mathRandomSpy = jest
    .spyOn(global.Math, "random")
    .mockReturnValue(0.3141592653589793);

  const mockOnDataChangeFn = jest.fn();
  const mockPipeInExtraMetaData = jest.fn(simplePipeInExtraMetaData);
  const mockSetDataValidationFunction = jest.fn();

  const renderResults = render(
    <ChoicesQuestionScreen
      key={question.id}
      question={question}
      onDataChange={mockOnDataChangeFn}
      allAnswers={{}}
      allQuestions={{ [question.id]: question }}
      pipeInExtraMetaData={mockPipeInExtraMetaData}
      setDataValidationFunction={mockSetDataValidationFunction}
    />,
  );
  const { getAllByA11yLabel } = renderResults;

  expect(mockPipeInExtraMetaData).toHaveBeenCalledTimes(
    question.choices.length,
  ); // For each choices

  // There shouldn't need to be any validation
  expect(mockSetDataValidationFunction).not.toHaveBeenCalled();

  const selections = getAllByA11yLabel(/select (.*?)/);
  expect(selections).toHaveLength(question.choices.length);

  const displayedList: string[] = selections.map((selection) =>
    selection.props.accessibilityLabel.replace(/^(select )/, ""),
  );
  if (question.randomizeChoicesOrder) {
    expect(displayedList).not.toStrictEqual(FLATTENED_CHOICES_VALUES);
    if (question.randomizeExceptForChoiceIds) {
      for (let i = question.randomizeExceptForChoiceIds.length; i > 0; i--) {
        const key =
          question.randomizeExceptForChoiceIds[
            question.randomizeExceptForChoiceIds.length - i
          ];
        const value = question.choices.find((choice) => choice.key === key)
          ?.value;
        expect(displayedList[displayedList.length - i]).toBe(value);
      }
    }
  } else {
    expect(displayedList).toStrictEqual(FLATTENED_CHOICES_VALUES);
  }

  let calledTimes = 0;
  for (let i = 0; i < inputValueSequence.length; i++) {
    const inputValue = inputValueSequence[i];
    const selection = getSelection(inputValue, getAllByA11yLabel);
    fireEvent.press(selection);

    const storedValue = question.choices.find(
      (choice) => choice.value === inputValue,
    )?.key;

    calledTimes += 1;
    expect(mockOnDataChangeFn).toHaveBeenNthCalledWith(calledTimes, {
      value: storedValue,
    } as ChoicesWithSingleAnswerAnswerData);
    expect(mockOnDataChangeFn).toHaveBeenCalledTimes(calledTimes);
  }

  mathRandomSpy.mockRestore();

  return renderResults;
};

const CHOICES = [
  { key: "wolf", value: "Wolf" },
  { key: "fox", value: "Fox" },
  { key: "coyote", value: "Coyote" },
  { key: "lynx", value: "Lynx" },
  { key: "panda", value: "Panda" },
  { key: "other", value: "Other" },
  { key: "idk", value: "I don't know" },
];
const FLATTENED_CHOICES_VALUES = CHOICES.map((choice) => choice.value);
test.each([
  [["Wolf", "Coyote"], false, undefined],
  [["Lynx", "Panda", "Other"], true, ["other"]],
  [["Fox"], true, ["other", "idk"]],
])(
  "ChoicesWithSingleAnswer question with input sequence %p (randomize order %p except for %p)",
  async (
    inputValueSequence,
    randomizeChoicesOrder,
    randomizeExceptForChoiceIds,
  ) => {
    const question = {
      id: "AnimalTest",
      type: QuestionType.ChoicesWithSingleAnswer,
      question: "What are you?",
      randomizeChoicesOrder,
      randomizeExceptForChoiceIds,
      choices: CHOICES,
      next: null,
    } as ChoicesWithSingleAnswerQuestion;

    await basicTestForChoicesWithSingleAnswerQuestionAsync(
      question,
      inputValueSequence,
    );
  },
);
