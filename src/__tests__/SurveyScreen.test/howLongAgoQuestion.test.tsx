import React from "react";
import { render, fireEvent, RenderAPI } from "react-native-testing-library";

import SurveyScreen, { SurveyScreenProps } from "../../SurveyScreen";
import { QuestionType } from "../../helpers/helpers";
import {
  setUpSurveyScreenTestAsync,
  tearDownSurveyScreenTestAsync,
  testQuestionsSequenceAsync,
  getBaseProps,
} from "./helper";

let currentProps!: SurveyScreenProps;
beforeEach(async () => {
  const currentTestPing = await setUpSurveyScreenTestAsync();
  currentProps = {
    ...getBaseProps(),
    questions: {
      q1: {
        id: "q1",
        type: QuestionType.HowLongAgo,
        question: "Question 1",
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
    startingQuestionId: "q1",
    ping: currentTestPing,
  };
});

afterEach(async () => {
  await tearDownSurveyScreenTestAsync();
});

async function pressSelectionAsync(
  name: string,
  { findByA11yLabel }: RenderAPI,
) {
  // `findBy` does the `waitFor` for us.
  fireEvent.press(await findByA11yLabel(`select ${name}`));
}

test("click both columns", async () => {
  const onFinishFn = jest.fn();

  const renderResults = render(
    <SurveyScreen {...currentProps} onFinish={onFinishFn} />,
  );

  await testQuestionsSequenceAsync({
    renderResults,
    onFinishFn,
    sequence: [
      {
        expectCurrentQuestionAsync: async (getCurrentQuestionTitle) => {
          await pressSelectionAsync("7", renderResults);
          await pressSelectionAsync("hours", renderResults);

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

test("click left column", async () => {
  const onFinishFn = jest.fn();

  const renderResults = render(
    <SurveyScreen {...currentProps} onFinish={onFinishFn} />,
  );

  await testQuestionsSequenceAsync({
    renderResults,
    onFinishFn,
    sequence: [
      {
        expectCurrentQuestionAsync: async (getCurrentQuestionTitle) => {
          await pressSelectionAsync("7", renderResults);

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

test("click right column", async () => {
  const onFinishFn = jest.fn();

  const renderResults = render(
    <SurveyScreen {...currentProps} onFinish={onFinishFn} />,
  );

  await testQuestionsSequenceAsync({
    renderResults,
    onFinishFn,
    sequence: [
      {
        expectCurrentQuestionAsync: async (getCurrentQuestionTitle) => {
          await pressSelectionAsync("days", renderResults);

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
    <SurveyScreen {...currentProps} onFinish={onFinishFn} />,
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
    <SurveyScreen {...currentProps} onFinish={onFinishFn} />,
  );

  await testQuestionsSequenceAsync({
    renderResults,
    onFinishFn,
    sequence: [
      {
        expectCurrentQuestionAsync: async (getCurrentQuestionTitle) => {
          await pressSelectionAsync("2", renderResults);
          await pressSelectionAsync("weeks", renderResults);

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
