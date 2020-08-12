/**
 * Notice that UI elements are not tested here as they are tested in
 * MultipleTextQuestionScreen.test.tsx.
 */
import React from "react";
import { render, RenderAPI } from "react-native-testing-library";

import SurveyScreen, { SurveyScreenProps } from "../../SurveyScreen";
import { QuestionType } from "../../helpers/helpers";
import { changeTextAndWaitForUpdateAsync } from "../reactNativeTestingLibraryHelper";
import {
  TEST_PING,
  mockNecessaryFunctionsToTestSurveyScreen,
  testQuestionsSequenceAsync,
} from "./helper";

beforeEach(() => {
  mockNecessaryFunctionsToTestSurveyScreen();
});

async function enterTextAsync(
  textFieldIndex: number,
  text: string,
  { findByA11yLabel }: RenderAPI,
) {
  await changeTextAndWaitForUpdateAsync(
    // `findBy` does the `waitFor` for us.
    async () => await findByA11yLabel(`text input ${textFieldIndex}`),
    text,
  );
}

const propsBase: SurveyScreenProps = {
  questions: {},
  startingQuestionId: "q1",
  ping: TEST_PING,
  previousState: null,
  onFinish: async () => {},
};

describe("without repeatedItemStartId", () => {
  const props: SurveyScreenProps = {
    ...propsBase,
    questions: {
      q1: {
        id: "q1",
        type: QuestionType.MultipleText,
        question: "Question 1",
        indexName: "INDEX",
        variableName: "VARNAME",
        max: 3,
        next: "q2",
      },
      q2: {
        id: "q2",
        type: QuestionType.Slider,
        question: "Question 2",
        slider: ["left", "right"],
        next: null,
      },
    },
  };

  test("enter some text", async () => {
    const onFinishFn = jest.fn();

    const renderResults = render(
      <SurveyScreen {...props} onFinish={onFinishFn} />,
    );

    await testQuestionsSequenceAsync({
      renderResults,
      onFinishFn,
      sequence: [
        {
          expectCurrentQuestionAsync: async (getCurrentQuestionTitle) => {
            await enterTextAsync(0, "hello world", renderResults);
            await enterTextAsync(1, "yes?", renderResults);

            expect(getCurrentQuestionTitle()).toBe("Question 1");
          },
        },
        {
          expectCurrentQuestionAsync: async (getCurrentQuestionTitle) => {
            expect(getCurrentQuestionTitle()).toBe("Question 2");
          },
        },
      ],
    });
  });

  test("click next without answering", async () => {
    const onFinishFn = jest.fn();

    const renderResults = render(
      <SurveyScreen {...props} onFinish={onFinishFn} />,
    );

    await testQuestionsSequenceAsync({
      renderResults,
      onFinishFn,
      sequence: [
        {
          expectCurrentQuestionAsync: async (getCurrentQuestionTitle) => {
            expect(getCurrentQuestionTitle()).toBe("Question 1");
          },
        },
        {
          expectCurrentQuestionAsync: async (getCurrentQuestionTitle) => {
            expect(getCurrentQuestionTitle()).toBe("Question 2");
          },
        },
      ],
    });
  });

  test("click prefer not to answer", async () => {
    const onFinishFn = jest.fn();

    const renderResults = render(
      <SurveyScreen {...props} onFinish={onFinishFn} />,
    );

    await testQuestionsSequenceAsync({
      renderResults,
      onFinishFn,
      sequence: [
        {
          expectCurrentQuestionAsync: async (getCurrentQuestionTitle) => {
            // Entering a text shouldn't matter here if we click prefer not
            // to answer.
            await enterTextAsync(0, "hello!", renderResults);

            expect(getCurrentQuestionTitle()).toBe("Question 1");
          },
          nextButton: "pna",
        },
        {
          expectCurrentQuestionAsync: async (getCurrentQuestionTitle) => {
            expect(getCurrentQuestionTitle()).toBe("Question 2");
          },
        },
      ],
    });
  });
});
