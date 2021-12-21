import {
  AnswersList,
  MultipleTextAnswerData,
  MultipleTextAnswer,
} from "@wellping/study-file/lib/answerTypes";
import {
  MultipleTextQuestion,
  ChoicesList,
} from "@wellping/study-file/lib/types";
import React from "react";
import { Alert } from "react-native";
import {
  render,
  fireEvent,
  act,
  waitFor,
  RenderAPI,
} from "react-native-testing-library";
import waitForExpect from "wait-for-expect";

import { QuestionType } from "../../helpers/helpers";
import * as studyFileHelper from "../../helpers/studyFile";
import MultipleTextQuestionScreen from "../../questionScreens/MultipleTextQuestionScreen";
import { simplePipeInExtraMetaData, mockCurrentExtraData } from "../helper";
import { changeTextAndWaitForUpdateAsync } from "../reactNativeTestingLibraryHelper";

const A11Y_HINT = "Enter your answer here";
const getTextInputA11YLabel = (index: number) => `text input ${index}`;
const findTextInputAsync = async (
  index: number,
  { findAllByA11yLabel }: RenderAPI,
) => {
  const textInputs = await findAllByA11yLabel(getTextInputA11YLabel(index));
  expect(textInputs).toHaveLength(1);
  const textInput = textInputs[0];
  return textInput;
};

const MOCK_EMOJI_CHOICES_KEY = "emojis";
const MOCK_EMOJI_CHOICES_LIST = ["😀", "🤪", "🧐", "😎"] as ChoicesList;
const basicTestForQuestionAsync = async (
  question: MultipleTextQuestion,
  allAnswers: AnswersList,
  inputValues: string[],
) => {
  let codeDataValidationFunction: (() => boolean) | null = null;

  const mockLoadingCompleted = jest.fn();
  const mockOnDataChangeFn = jest.fn();
  const mockPipeInExtraMetaData = jest.fn(simplePipeInExtraMetaData);
  const mockSetDataValidationFunction = jest.fn((func) => {
    codeDataValidationFunction = func;
  });

  const renderResults = render(
    <MultipleTextQuestionScreen
      key={question.id}
      question={question}
      loadingCompleted={mockLoadingCompleted}
      onDataChange={mockOnDataChangeFn}
      allAnswers={allAnswers}
      allQuestions={{ [question.id]: question }}
      pipeInExtraMetaData={mockPipeInExtraMetaData}
      setDataValidationFunction={mockSetDataValidationFunction}
    />,
  );
  const { getAllByA11yLabel, getAllByA11yHint, toJSON } = renderResults;

  let textInputsLength = question.max;
  if (question.maxMinus) {
    if (allAnswers[question.maxMinus]) {
      const data = (allAnswers[question.maxMinus] as MultipleTextAnswer).data;
      textInputsLength -= (data ? data.value : []).length;
    }
  }

  if (textInputsLength > 0) {
    // Wait for the text fields to be loaded.
    await waitFor(() => getAllByA11yLabel(/^text input /));
  }

  expect(mockLoadingCompleted).toHaveBeenCalledTimes(1);

  if (textInputsLength === 0) {
    expect(toJSON()).toMatchSnapshot("textInputsLength === 0");
    return;
  }

  let choices!: ChoicesList | undefined;
  if (typeof question.choices === "string") {
    if (question.choices === MOCK_EMOJI_CHOICES_KEY) {
      choices = MOCK_EMOJI_CHOICES_LIST;
    } else {
      choices = [
        `ERROR: reusable choices with key "${question.choices}" is not found.`,
      ]; // For that error string
    }
  } else {
    choices = question.choices;
  }

  // For each choices
  expect(mockPipeInExtraMetaData).toHaveBeenCalledTimes(choices?.length || 0);

  // Called when the dropdown items are changed.
  const mockSetDataValidationFunctionInitTimes = choices ? 2 : 1;
  expect(mockSetDataValidationFunction).toHaveBeenCalledTimes(
    mockSetDataValidationFunctionInitTimes,
  );
  expect(typeof codeDataValidationFunction).toBe("function");

  // This also helps test the placeholder property.
  const textInputs = getAllByA11yHint(A11Y_HINT);
  expect(textInputs).toHaveLength(textInputsLength);
  expect(textInputs.length).toMatchSnapshot("text inputs length");

  const expectedAnswerData: MultipleTextAnswerData = { value: [] };
  let callCount = 0;
  for (let i = 0; i < textInputsLength; i++) {
    const findIthTextInputAsync = async () =>
      // `findBy` does the `waitFor` for us.
      await findTextInputAsync(i, renderResults);

    expect((await findIthTextInputAsync()).props.placeholder).toBe(
      question.placeholder,
    );

    const inputValue = inputValues[i] || "";
    await changeTextAndWaitForUpdateAsync(
      async () => await findIthTextInputAsync(),
      inputValue,
    );

    if (inputValue.length > 0) {
      expectedAnswerData.value[expectedAnswerData.value.length] = inputValue;
    }

    callCount += 1;
    expect(mockOnDataChangeFn).toHaveBeenNthCalledWith(
      callCount,
      expectedAnswerData,
    );
    expect(mockOnDataChangeFn).toHaveBeenCalledTimes(callCount);

    // `setDataValidationFunction` is called each time the data is changed.
    expect(mockSetDataValidationFunction).toHaveBeenCalledTimes(
      mockSetDataValidationFunctionInitTimes + callCount,
    );

    let isInputValid = true;
    if (question.choices && question.forceChoice && inputValue.length > 0) {
      const isInputInChoice = choices?.includes(inputValue);

      if (!isInputInChoice) {
        let buttonPressed = false;

        const alertSpy = jest
          .spyOn(Alert, "alert")
          .mockImplementation(async (title, message, buttons) => {
            expect(message).toContain("You must select an item from the list");

            // TODO: do we need act here?
            act(() => {
              // Press "OK"
              buttons![0].onPress!();
            });

            buttonPressed = true;
          });
        fireEvent(await findIthTextInputAsync(), "onEndEditing", {});
        isInputValid = false;

        await waitForExpect(async () => {
          expect(alertSpy).toHaveBeenCalledTimes(1);
        });

        await waitForExpect(() => {
          expect(buttonPressed).toBe(true);
        });

        // Note that we cannot test whether the text field (UI) is cleared, as
        // we use `ref`s in the app.
        // See
        // - https://github.com/facebook/react/issues/7740
        // - https://github.com/callstack/react-native-testing-library/issues/227

        expectedAnswerData.value.pop();
        callCount += 1;
        expect(mockOnDataChangeFn).toHaveBeenNthCalledWith(
          callCount,
          expectedAnswerData,
        );

        alertSpy.mockRestore();
      }
    }
    if (isInputValid) {
      fireEvent(await findIthTextInputAsync(), "onEndEditing", {});
      // There should be no extra call.
      expect(mockOnDataChangeFn).toHaveBeenNthCalledWith(
        callCount,
        expectedAnswerData,
      );
    }

    // TODO: test codeDataValidationFunction
  }

  // Store the expected data object.
  expect(expectedAnswerData).toMatchSnapshot();

  return renderResults;
};

const generateTypingInput = (length: number) => {
  return Array.from(Array(length), (_, i) => `I am typing ${i + 1}`);
};

test.each([
  [generateTypingInput(1), 3, "Enter something...", "INDEX"],
  [generateTypingInput(4), 4, "", "ITEM"],
  [["John Doe", "王小明"], 5, "Enter a name...", "NAMEINDEX"],
  [
    ["Mr. Fox", "Felicity Fox", "Ash Fox", "Kristofferson Silverfox"],
    4,
    undefined,
    "FOX_INDEX",
  ],
])(
  "input `%p` with max %d without choices",
  async (inputValues, max, placeholder, indexName) => {
    const question = {
      id: "WithoutChoicesDict",
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

test.each([
  [
    generateTypingInput(1),
    3,
    "PrevQuestionId",
    "Enter something...",
    "INDEX",
    {},
  ],
  [
    [],
    4,
    "PrevQuestionId",
    "Enter something...",
    "INDEX",
    {
      PrevQuestionId: {
        questionId: "PrevQuestionId",
        data: {
          value: [],
        },
      },
    },
  ],
  [
    ["John Doe", "王小明"],
    4,
    "FamilyNames",
    "Enter a name...",
    "NAMEINDEX",
    {
      FamilyNames: {
        questionId: "FamilyNames",
        data: {
          value: ["Father", "Mother"],
        },
      },
    },
  ],
  [
    ["Kristofferson Silverfox"],
    4,
    "ZootopiaCharacters",
    undefined,
    "FOX_INDEX",
    {
      ZootopiaCharacters: {
        questionId: "ZootopiaCharacters",
        data: {
          value: ["Judy Hopps", "Nick Wilde", "Flash"],
        },
      },
    },
  ],
])(
  "input `%p` with max %d and maxMinus %p without choices",
  async (inputValues, max, maxMinus, placeholder, indexName, allAnswers) => {
    const question = {
      id: "WithoutChoicesWithMaxMinusDict",
      type: QuestionType.MultipleText,
      question: "A question",
      placeholder,
      max,
      maxMinus,
      variableName: "TARGET_CATEGORY",
      indexName,
      next: null,
    } as MultipleTextQuestion;

    await basicTestForQuestionAsync(question, allAnswers as any, inputValues);
  },
);

const CHOICES = [
  "Friend",
  "Co-worker",
  "Parent",
  "Sibling / other relative",
  "Significant other",
  "Stranger",
  "Other",
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

test.each([
  [generateTypingInput(2), 2, true, "Enter a emoji..."],
  [
    [...generateTypingInput(1), "😀", ...generateTypingInput(2), "🤪"],
    5,
    true,
    "Enter a emoji...",
  ],
  [generateTypingInput(4), 4, false, undefined],
  [["🧐", "RANDOM INPUT", "😎"], 5, true, "Enter a relation..."],
  [["🧐", "🧐", "🧐", "🧐", "RANDOM"], 5, false, undefined],
  [["🤪", "", "🤪", ":)", "🤪"], 5, true, "Emoji..."],
])(
  "input `%p` with max %d and forceChoice %p with a choices string",
  async (inputValues, max, forceChoice, placeholder) => {
    mockCurrentExtraData({
      reusableChoices: {
        [MOCK_EMOJI_CHOICES_KEY]: MOCK_EMOJI_CHOICES_LIST,
      },
    });

    const question = {
      id: "WithChoicesDict",
      type: QuestionType.MultipleText,
      question: "A question",
      placeholder,
      choices: MOCK_EMOJI_CHOICES_KEY,
      forceChoice,
      max,
      variableName: "TARGET_CATEGORY",
      indexName: "INDEX",
      next: null,
    } as MultipleTextQuestion;

    await basicTestForQuestionAsync(question, {}, inputValues);
  },
);

test("max - maxMinus = 0", async () => {
  const question = {
    id: "NoTextField",
    type: QuestionType.MultipleText,
    question: "A question",
    max: 3,
    maxMinus: "AnotherMultipleTextQuestionWithThreeAnswers",
    variableName: "TARGET_CATEGORY",
    indexName: "INDEX",
    next: null,
  } as MultipleTextQuestion;

  await basicTestForQuestionAsync(
    question,
    {
      AnotherMultipleTextQuestionWithThreeAnswers: {
        questionId: "AnotherMultipleTextQuestionWithThreeAnswers",
        data: {
          value: ["there", "are", "three answers"],
        },
      } as any,
    },
    [],
  );
});

// Should not have been able enter anything except "ERROR: ...".
test.each([
  [[]],
  [["hello world"]],
  [["yep", "yep", "yep"]],
  [
    [
      `ERROR: reusable choices with key "invalid-reusable-choice" is not found.`,
    ],
  ],
])("input `%p` with invalid string choices", async (inputValues) => {
  mockCurrentExtraData({
    reusableChoices: {
      [MOCK_EMOJI_CHOICES_KEY]: MOCK_EMOJI_CHOICES_LIST,
    },
  });

  const question = {
    id: "WithChoicesDict",
    type: QuestionType.MultipleText,
    question: "A question",
    choices: "invalid-reusable-choice",
    forceChoice: true,
    max: 3,
    variableName: "TARGET_CATEGORY",
    indexName: "INDEX",
    next: null,
  } as MultipleTextQuestion;

  await basicTestForQuestionAsync(question, {}, inputValues);
});
