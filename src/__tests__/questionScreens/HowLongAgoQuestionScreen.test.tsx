import {
  HowLongAgoAnswerDataType,
  HowLongAgoAnswerData,
} from "@wellping/study-file/lib/answerTypes";
import { HowLongAgoQuestion } from "@wellping/study-file/lib/types";
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

import { QuestionType } from "../../helpers/helpers";
import HowLongAgoQuestionScreen from "../../questionScreens/HowLongAgoQuestion";
import { simplePipeInExtraMetaData } from "../helper";

const getSelectionA11YLabel = (option: string) => `select ${option}`;
const getSelection = (
  option: string,
  getAllByA11yLabel: A11yAPI["getAllByA11yLabel"],
) => {
  const selections = getAllByA11yLabel(getSelectionA11YLabel(option));
  expect(selections).toHaveLength(1);
  const selection = selections[0];
  return selection;
};

const basicTestForQuestionAsync = async (
  question: HowLongAgoQuestion,
  inputValues: HowLongAgoAnswerDataType,
) => {
  const mockLoadingCompleted = jest.fn();
  const mockOnDataChangeFn = jest.fn();
  const mockPipeInExtraMetaData = jest.fn(simplePipeInExtraMetaData);
  const mockSetDataValidationFunction = jest.fn();

  const renderResults = render(
    <HowLongAgoQuestionScreen
      key={question.id}
      question={question}
      loadingCompleted={mockLoadingCompleted}
      onDataChange={mockOnDataChangeFn}
      allAnswers={{}}
      allQuestions={{ [question.id]: question }}
      pipeInExtraMetaData={mockPipeInExtraMetaData}
      setDataValidationFunction={mockSetDataValidationFunction}
    />,
  );
  const { getAllByA11yLabel, toJSON } = renderResults;

  expect(mockLoadingCompleted).toHaveBeenCalledTimes(1);

  // Because there isn't a need to pipe in any data.
  expect(mockPipeInExtraMetaData).not.toHaveBeenCalled();

  // There shouldn't need to be any validation
  expect(mockSetDataValidationFunction).not.toHaveBeenCalled();

  const selections = getAllByA11yLabel(/select (.*?)/);
  expect(selections).toHaveLength(10 + 4);

  let calledTimes = 0;
  if (inputValues[0]) {
    const leftSelection = getSelection(`${inputValues[0]}`, getAllByA11yLabel);
    fireEvent.press(leftSelection);

    calledTimes += 1;
    expect(mockOnDataChangeFn).toHaveBeenNthCalledWith(calledTimes, {
      value: [inputValues[0], null],
    } as HowLongAgoAnswerData);
    expect(mockOnDataChangeFn).toHaveBeenCalledTimes(calledTimes);
  }
  if (inputValues[1]) {
    const rightSelection = getSelection(`${inputValues[1]}`, getAllByA11yLabel);
    fireEvent.press(rightSelection);

    calledTimes += 1;
    expect(mockOnDataChangeFn).toHaveBeenNthCalledWith(calledTimes, {
      value: inputValues,
    } as HowLongAgoAnswerData);
    expect(mockOnDataChangeFn).toHaveBeenCalledTimes(calledTimes);
  }
  expect(mockOnDataChangeFn).toHaveBeenCalledTimes(calledTimes);

  return renderResults;
};

test.each([
  [null, null],
  [6, "days"],
  [2, "weeks"],
  [1, "months"],
  [null, "hours"],
])("input [%p, %p]", async (left, right) => {
  const question = {
    id: "HowLongAgoQuestion",
    type: QuestionType.HowLongAgo,
    question: "How long ago?",
    next: null,
  } as HowLongAgoQuestion;

  await basicTestForQuestionAsync(question, [left, right]);
});
