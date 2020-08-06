import React from "react";
import { Alert } from "react-native";
import {
  render,
  fireEvent,
  A11yAPI,
  FireEventAPI,
  waitFor,
  RenderAPI,
} from "react-native-testing-library";
import { ReactTestInstance } from "react-test-renderer";

import {
  YesNoAnswerData,
  ChoicesWithSingleAnswerAnswerData,
  ChoicesWithMultipleAnswersAnswerData,
  ChoicesWithMultipleAnswersAnswerChoices,
} from "../../helpers/answerTypes";
import { QuestionType } from "../../helpers/helpers";
import {
  YesNoQuestion,
  ChoicesWithSingleAnswerQuestion,
  ChoicesWithMultipleAnswersQuestion,
  ChoicesList,
} from "../../helpers/types";
import ChoicesQuestionScreen from "../../questionScreens/ChoicesQuestionScreen";
import { simplePipeInExtraMetaData, mockCurrentExtraData } from "../helper";

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

test.each([true, false])("YesNo question with input %p", async (inputValue) => {
  const question = {
    id: "YesNo",
    type: QuestionType.YesNo,
    question: "Are you happy?",
    next: null,
  } as YesNoQuestion;

  const {
    renderResults: { getAllByA11yLabel },
    mockOnDataChangeFn,
  } = await basicTestForChoicesQuestionScreenAsync(question);

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
});

const MOCK_EMOJI_CHOICES_KEY = "emojis";
const MOCK_EMOJI_CHOICES_LIST = ["😀", "🤪", "🧐", "😎"] as [
  string,
  ...string[]
];
const basicTestForChoicesQuestionScreenAsync = async (
  question:
    | YesNoQuestion
    | ChoicesWithSingleAnswerQuestion
    | ChoicesWithMultipleAnswersQuestion,
) => {
  let choices: ChoicesList;
  if (question.type === QuestionType.YesNo) {
    choices = ["Yes", "No"];
  } else {
    if (typeof question.choices === "string") {
      if (question.choices === MOCK_EMOJI_CHOICES_KEY) {
        choices = MOCK_EMOJI_CHOICES_LIST;
      } else {
        choices = [
          `ERROR: reusable choices with key "${question.choices}" is not found.`,
        ];
      }
    } else {
      choices = question.choices;
    }
  }

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
  const { findAllByA11yLabel, getAllByA11yLabel } = renderResults;

  // Wait for the selections to be loaded.
  await waitFor(() => {
    return getAllByA11yLabel(/^select /).length > 0;
  });

  expect(mockPipeInExtraMetaData).toHaveBeenCalledTimes(choices.length); // For each choices

  // There shouldn't need to be any validation
  expect(mockSetDataValidationFunction).not.toHaveBeenCalled();

  const selections = await findAllByA11yLabel(/select (.*?)/);
  expect(selections).toHaveLength(choices.length);

  const displayedList: string[] = selections.map((selection) =>
    selection.props.accessibilityLabel.replace(/^(select )/, ""),
  );
  if (question.type !== QuestionType.YesNo) {
    if (question.randomizeChoicesOrder) {
      expect(displayedList).not.toStrictEqual(choices);
      if (question.randomizeExceptForChoiceIds) {
        // Sort the `randomizeExceptForChoiceIds` by the order of `choices`.
        const sortedRandomizeExceptForChoiceIds = [];
        for (const choice of choices) {
          if (question.randomizeExceptForChoiceIds.includes(choice)) {
            sortedRandomizeExceptForChoiceIds.push(choice);
          }
        }
        // Just a sanity check to make sure the items are the same.
        expect(sortedRandomizeExceptForChoiceIds).toHaveLength(
          question.randomizeExceptForChoiceIds.length,
        );

        for (let i = sortedRandomizeExceptForChoiceIds.length; i > 0; i--) {
          const value =
            sortedRandomizeExceptForChoiceIds[
              sortedRandomizeExceptForChoiceIds.length - i
            ];
          expect(displayedList[displayedList.length - i]).toBe(value);
        }
      }
    } else {
      expect(displayedList).toStrictEqual(choices);
    }
  }

  expect(displayedList).toMatchSnapshot("displayed list");

  return { displayedList, renderResults, mockOnDataChangeFn };
};

const inputTestForChoicesWithSingleAnswerQuestionAsync = async (
  renderResults: RenderAPI,
  mockOnDataChangeFn: jest.Mock<any, any>,
  question: ChoicesWithSingleAnswerQuestion,
  inputValueSequence: string[],
) => {
  const { getAllByA11yLabel } = renderResults;

  let expectedResults: string | null = null;

  let calledTimes = 0;
  for (let i = 0; i < inputValueSequence.length; i++) {
    const inputValue = inputValueSequence[i];
    const selection = getSelection(inputValue, getAllByA11yLabel);
    fireEvent.press(selection);

    expectedResults = inputValue;

    calledTimes += 1;
    expect(mockOnDataChangeFn).toHaveBeenNthCalledWith(calledTimes, {
      value: expectedResults,
    } as ChoicesWithSingleAnswerAnswerData);
    expect(mockOnDataChangeFn).toHaveBeenCalledTimes(calledTimes);
  }

  expect(expectedResults).toMatchSnapshot("data");

  return renderResults;
};

const inputTestForChoicesWithMultipleAnswersQuestionAsync = async (
  displayedList: string[],
  renderResults: RenderAPI,
  mockOnDataChangeFn: jest.Mock<any, any>,
  question: ChoicesWithMultipleAnswersQuestion,
  inputValueSequence: string[],
) => {
  const { getAllByA11yLabel } = renderResults;

  const expectedResults = displayedList.map((choice) => [
    choice,
    false,
  ]) as ChoicesWithMultipleAnswersAnswerChoices;

  let calledTimes = 0;
  for (let i = 0; i < inputValueSequence.length; i++) {
    const inputValue = inputValueSequence[i];
    const selection = getSelection(inputValue, getAllByA11yLabel);
    fireEvent.press(selection);

    const key = expectedResults.findIndex((value) => value[0] === inputValue);
    expectedResults[key][1] = !expectedResults[key][1];

    calledTimes += 1;
    expect(mockOnDataChangeFn).toHaveBeenNthCalledWith(calledTimes, {
      value: expectedResults,
    } as ChoicesWithMultipleAnswersAnswerData);
    expect(mockOnDataChangeFn).toHaveBeenCalledTimes(calledTimes);
  }

  expect(expectedResults).toMatchSnapshot("data");

  return renderResults;
};

const CHOICES = [
  "Wolf",
  "Fox",
  "Coyote",
  "Lynx",
  "Panda",
  "Other",
  "I don't know",
];
const CHOICES_TEST_TABLE = [
  [["Wolf", "Coyote"], false, undefined],
  [["Lynx", "Panda", "Other"], true, ["Other"]],
  [["Fox"], true, ["Other", "I don't know"]],
  [
    ["Coyote", "Lynx", "Wolf", "Fox", "Coyote", "I don't know"],
    true,
    ["Wolf", "Fox", "Other", "I don't know"],
  ],
  [
    ["Coyote", "Coyote", "Wolf", "Wolf", "Coyote"],
    true,
    ["I don't know", "Other"], // The order should follow `choices`, not here.
  ],
  [
    [
      "Coyote",
      "Wolf",
      "Fox",
      "Lynx",
      "Panda",
      "Other",
      "Coyote",
      "Wolf",
      "Fox",
      "Lynx",
      "Panda",
      "Other",
      "I don't know",
    ],
    true,
    undefined,
  ],
  [[], false, undefined],
] as [string[], boolean, string[] | undefined][];
test.each(CHOICES_TEST_TABLE)(
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

    const {
      renderResults,
      mockOnDataChangeFn,
    } = await basicTestForChoicesQuestionScreenAsync(question);

    await inputTestForChoicesWithSingleAnswerQuestionAsync(
      renderResults,
      mockOnDataChangeFn,
      question,
      inputValueSequence,
    );
  },
);

test.each(CHOICES_TEST_TABLE)(
  "ChoicesWithMultipleAnswers question with input sequence %p (randomize order %p except for %p)",
  async (
    inputValueSequence,
    randomizeChoicesOrder,
    randomizeExceptForChoiceIds,
  ) => {
    const question = {
      id: "AnimalTest",
      type: QuestionType.ChoicesWithMultipleAnswers,
      question: "What animals do you love?",
      randomizeChoicesOrder,
      randomizeExceptForChoiceIds,
      choices: CHOICES,
      next: null,
    } as ChoicesWithMultipleAnswersQuestion;

    const {
      displayedList,
      renderResults,
      mockOnDataChangeFn,
    } = await basicTestForChoicesQuestionScreenAsync(question);

    await inputTestForChoicesWithMultipleAnswersQuestionAsync(
      displayedList,
      renderResults,
      mockOnDataChangeFn,
      question,
      inputValueSequence,
    );
  },
);

const EMOJI_CHOICES_TEST_TABLE = [
  [true, ["😎"]],
  [true, ["😀", "🤪"]],
  [
    true,
    ["🧐", "😀"], // The order should follow `choices`, not here.
  ],
  [true, ["😀", "🤪", "🧐"]],
  [true, undefined],
  [false, undefined],
] as [boolean, string[] | undefined][];
test.each(EMOJI_CHOICES_TEST_TABLE)(
  "ChoicesWithSingleAnswer question (choices string) (randomize order %p except for %p)",
  async (randomizeChoicesOrder, randomizeExceptForChoiceIds) => {
    mockCurrentExtraData({
      reusableChoices: {
        [MOCK_EMOJI_CHOICES_KEY]: MOCK_EMOJI_CHOICES_LIST,
      },
    });

    const question = {
      id: "AnimalTest",
      type: QuestionType.ChoicesWithSingleAnswer,
      question: "What emoji are you?",
      randomizeChoicesOrder,
      randomizeExceptForChoiceIds,
      choices: MOCK_EMOJI_CHOICES_KEY,
      next: null,
    } as ChoicesWithSingleAnswerQuestion;

    await basicTestForChoicesQuestionScreenAsync(question);
  },
);

test.each(EMOJI_CHOICES_TEST_TABLE)(
  "ChoicesWithMultipleAnswers (choices string) (randomize order %p except for %p)",
  async (randomizeChoicesOrder, randomizeExceptForChoiceIds) => {
    mockCurrentExtraData({
      reusableChoices: {
        [MOCK_EMOJI_CHOICES_KEY]: MOCK_EMOJI_CHOICES_LIST,
      },
    });

    const question = {
      id: "AnimalTest",
      type: QuestionType.ChoicesWithMultipleAnswers,
      question: "What emojis do you love?",
      randomizeChoicesOrder,
      randomizeExceptForChoiceIds,
      choices: MOCK_EMOJI_CHOICES_KEY,
      next: null,
    } as ChoicesWithMultipleAnswersQuestion;

    await basicTestForChoicesQuestionScreenAsync(question);
  },
);

test("ChoicesWithSingleAnswer (invalid choices string)", async () => {
  mockCurrentExtraData({
    reusableChoices: {
      [MOCK_EMOJI_CHOICES_KEY]: MOCK_EMOJI_CHOICES_LIST,
    },
  });

  const question = {
    id: "AnimalTest",
    type: QuestionType.ChoicesWithSingleAnswer,
    question: "Which emojis do you love?",
    choices: "non-existent",
    next: null,
  } as ChoicesWithSingleAnswerQuestion;

  await basicTestForChoicesQuestionScreenAsync(question);
});

test("ChoicesWithMultipleAnswers (invalid choices string)", async () => {
  mockCurrentExtraData({
    reusableChoices: {
      [MOCK_EMOJI_CHOICES_KEY]: MOCK_EMOJI_CHOICES_LIST,
    },
  });

  const question = {
    id: "AnimalTest",
    type: QuestionType.ChoicesWithMultipleAnswers,
    question: "What emojis do you love?",
    choices: "non-existent",
    next: null,
  } as ChoicesWithMultipleAnswersQuestion;

  await basicTestForChoicesQuestionScreenAsync(question);
});

test("wrong QuestionType", async () => {
  const question = {
    id: "AnimalTest",
    type: QuestionType.Slider,
    question: "This is not a choice question!",
    next: null,
  } as any;

  expect(() => {
    render(
      <ChoicesQuestionScreen
        key={question.id}
        question={question}
        onDataChange={jest.fn()}
        allAnswers={{}}
        allQuestions={{ [question.id]: question }}
        pipeInExtraMetaData={jest.fn()}
        setDataValidationFunction={jest.fn()}
      />,
    );
  }).toThrowErrorMatchingInlineSnapshot(
    `"Wrong QuestionType in ChoicesQuestionScreen"`,
  );
});
