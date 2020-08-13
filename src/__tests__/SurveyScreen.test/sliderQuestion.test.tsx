import React from "react";
import { render } from "react-native-testing-library";

import SurveyScreen, { SurveyScreenProps } from "../../SurveyScreen";
import { QuestionType } from "../../helpers/helpers";
import {
  moveSlider,
  findSliderAsync,
} from "../reactNativeTestingLibraryHelper";
import {
  TEST_PING,
  mockNecessaryFunctionsToTestSurveyScreen,
  testQuestionsSequenceAsync,
} from "./helper";

beforeEach(() => {
  mockNecessaryFunctionsToTestSurveyScreen();
});

const props: SurveyScreenProps = {
  questions: {
    q1: {
      id: "q1",
      type: QuestionType.Slider,
      question: "Question 1",
      slider: ["left", "right"],
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
  ping: TEST_PING,
  previousState: null,
  onFinish: async () => {},
};

test("move slider", async () => {
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
          moveSlider(await findSliderAsync(renderResults), 88);

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
          moveSlider(await findSliderAsync(renderResults), 66);

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
