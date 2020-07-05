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

import { MultipleTextAnswerEntity } from "../../entities/AnswerEntity";
import { AnswersList, MultipleTextAnswerData } from "../../helpers/answerTypes";
import { QuestionType, withVariable } from "../../helpers/helpers";
import { MultipleTextQuestion } from "../../helpers/types";
import MultipleTextQuestionScreen from "../../questionScreens/MultipleTextQuestionScreen";
import { simplePipeInExtraMetaData } from "../helper";

const A11Y_HINT = "Enter your answer here";
const getTextInputA11YLabel = (index: number) => `text input ${index}`;
const getTextInput = (
  index: number,
  getAllByA11yLabel: A11yAPI["getAllByA11yLabel"],
) => {
  const textInputs = getAllByA11yLabel(getTextInputA11YLabel(index));
  expect(textInputs).toHaveLength(1);
  const textInput = textInputs[0];
  return textInput;
};

const basicTestForQuestionAsync = async (
  question: MultipleTextQuestion,
  allAnswers: AnswersList,
  inputValues: string[],
) => {
  const mockOnDataChangeFn = jest.fn();
  const mockPipeInExtraMetaData = jest.fn(simplePipeInExtraMetaData);
  const mockSetDataValidationFunction = jest.fn();

  const renderResults = render(
    <MultipleTextQuestionScreen
      key={question.id}
      question={question}
      onDataChange={mockOnDataChangeFn}
      allAnswers={allAnswers}
      allQuestions={{ [question.id]: question }}
      pipeInExtraMetaData={mockPipeInExtraMetaData}
      setDataValidationFunction={mockSetDataValidationFunction}
    />,
  );
  const { getAllByA11yLabel, getAllByA11yHint } = renderResults;

  // Because there isn't a need to pipe in any data.
  expect(mockPipeInExtraMetaData).not.toHaveBeenCalled();

  // TODO: VERIFY SET DATA VALIDATION FUNCTION TOO
  expect(mockSetDataValidationFunction).toHaveBeenCalledTimes(1);

  // This also helps test the placeholder property.
  const textInputs = getAllByA11yHint(A11Y_HINT);
  let textInputsLength = question.max;
  if (question.maxMinus) {
    if (allAnswers[question.maxMinus]) {
      textInputsLength -= Object.keys(
        (allAnswers[question.maxMinus] as MultipleTextAnswerEntity).data
          ?.value || {},
      ).length;
    }
  }
  expect(textInputs).toHaveLength(textInputsLength);

  const expectedAnswerData: MultipleTextAnswerData = { value: {} };
  let callCount = 0;
  for (let i = 0; i < textInputsLength; i++) {
    const textInput = getTextInput(i, getAllByA11yLabel);
    const inputValue = inputValues[i] || "";

    expect(textInput.props.placeholder).toBe(question.placeholder);

    fireEvent.changeText(textInput, inputValue);
    await waitFor(() => {
      const newTextInput = getTextInput(i, getAllByA11yLabel);
      return inputValue === newTextInput.props.value;
    });

    const currentKey = question.eachId.replace(
      withVariable(question.indexName),
      // Because we always start at 1 no matter which text field it is.
      `${Object.keys(expectedAnswerData.value).length + 1}`,
    );
    if (inputValue.length > 0) {
      expectedAnswerData.value[currentKey] = inputValue;
    }

    callCount += 1;
    expect(mockOnDataChangeFn).toHaveBeenNthCalledWith(
      callCount,
      expectedAnswerData,
    );
    expect(mockOnDataChangeFn).toHaveBeenCalledTimes(callCount);

    if (question.choices && question.forceChoice && inputValue.length > 0) {
      let isInputInChoice = false;
      if (typeof question.choices === "string") {
        // TODO: DO THIS
      } else {
        isInputInChoice =
          question.choices?.some((e) => e.value === inputValue) || false;
      }

      if (!isInputInChoice) {
        let buttonPressed = false;

        const alertSpy = jest
          .spyOn(Alert, "alert")
          .mockImplementation((title, message, buttons) => {
            expect(message).toContain("You must select an item from the list");

            // Press "OK"
            buttons![0].onPress!();

            buttonPressed = true;
          });
        fireEvent(textInput, "onEndEditing", {});
        expect(alertSpy).toHaveBeenCalledTimes(1);

        await waitFor(() => buttonPressed);

        delete expectedAnswerData.value[currentKey];
        callCount += 1;
        expect(mockOnDataChangeFn).toHaveBeenNthCalledWith(
          callCount,
          expectedAnswerData,
        );

        alertSpy.mockRestore();
      }
    }

    // TODO: it doesn't seems to be testing whether the text field (UI) is cleared.
  }

  // Store the expected data object.
  expect(expectedAnswerData).toMatchSnapshot();

  return renderResults;
};

const generateTypingInput = (length: number) => {
  return Array.from(Array(length), (_, i) => `I am typing ${i + 1}`);
};
test.each([
  [
    generateTypingInput(1),
    3,
    "Enter something...",
    "Typing_[__INDEX__]",
    "INDEX",
  ],
  [generateTypingInput(4), 4, "", "[__ITEM__]", "ITEM"],
  [
    ["John Doe", "王小明"],
    5,
    "Enter a name...",
    "Name_[__NAMEINDEX__]",
    "NAMEINDEX",
  ],
  [
    ["Mr. Fox", "Felicity Fox", "Ash Fox", "Kristofferson Silverfox"],
    4,
    undefined,
    "Fox[__FOX_INDEX__]",
    "FOX_INDEX",
  ],
])(
  "input `%p` with max %d without choices",
  async (inputValues, max, placeholder, eachId, indexName) => {
    const question = {
      id: "WithoutChoicesDict",
      eachId,
      type: QuestionType.MultipleText,
      question: "A question",
      placeholder,
      max,
      variableName: "TARGET_CATEGORY",
      indexName,
      next: null,
    } as MultipleTextQuestion;

    await basicTestForQuestionAsync(question, {}, inputValues);
  },
);

const CHOICES = [
  { key: "friend", value: "Friend" },
  { key: "coworker", value: "Co-worker" },
  { key: "parent", value: "Parent" },
  { key: "relative", value: "Sibling / other relative" },
  { key: "partner", value: "Significant other" },
  { key: "stranger", value: "Stranger" },
  { key: "other", value: "Other" },
];
test.each([
  [generateTypingInput(2), 2, true, "Enter a relation..."],
  [
    [
      ...generateTypingInput(1),
      "Sibling / other relative",
      ...generateTypingInput(2),
      "Parent",
    ],
    5,
    true,
    "Enter a relation...",
  ],
  [generateTypingInput(4), 4, false, undefined],
  [["Friend", "RANDOM INPUT", "Other"], 5, true, "Enter a relation..."],
  [
    ["Stranger", "Stranger", "Stranger", "Stranger", "RANDOM"],
    5,
    false,
    undefined,
  ],
  [["Co-worker", "", "Co-worker", ":)", "Co-worker"], 5, true, "Relation..."],
])(
  "input `%p` with max %d and forceChoice %p with a choices object",
  async (inputValues, max, forceChoice, placeholder) => {
    const question = {
      id: "WithChoicesDict",
      eachId: "Input_[__INDEX__]",
      type: QuestionType.MultipleText,
      question: "A question",
      placeholder,
      choices: CHOICES,
      forceChoice,
      max,
      variableName: "TARGET_CATEGORY",
      indexName: "INDEX",
      next: null,
    } as MultipleTextQuestion;

    await basicTestForQuestionAsync(question, {}, inputValues);
  },
);

// TODO: TEST CHOICES WITH EXTERNAL JSON

// TODO: TEST
