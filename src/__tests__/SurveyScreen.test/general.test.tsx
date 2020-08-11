import React from "react";
import { render } from "react-native-testing-library";

import SurveyScreen, { SurveyScreenProps } from "../../SurveyScreen";
import { QuestionType } from "../../helpers/helpers";
import { QuestionsList } from "../../helpers/types";
import {
  TEST_PING,
  mockDatabaseRelatedFunction,
  testQuestionsSequenceAsync,
} from "./helper";

beforeEach(() => {
  mockDatabaseRelatedFunction();
});

test("non-existent startingQuestionId", async () => {
  const onFinishFn = jest.fn();

  const props: SurveyScreenProps = {
    questions: {},
    startingQuestionId: "na",
    ping: TEST_PING,
    previousState: null,
    onFinish: onFinishFn,
  };
  const { toJSON } = render(<SurveyScreen {...props} />);

  expect(JSON.stringify(toJSON())).toContain("CRITICAL ERROR");

  expect(toJSON()).toMatchSnapshot();

  expect(onFinishFn).toHaveBeenCalledTimes(0);
});

test("single question", async () => {
  const onFinishFn = jest.fn();

  const props: SurveyScreenProps = {
    questions: {
      howLongAgoQuestion: {
        id: "howLongAgoQuestion",
        type: QuestionType.HowLongAgo,
        question: "How long ago is it?",
        next: null,
      },
    },
    startingQuestionId: "howLongAgoQuestion",
    ping: TEST_PING,
    previousState: null,
    onFinish: onFinishFn,
  };
  const renderResults = render(<SurveyScreen {...props} />);

  await testQuestionsSequenceAsync({
    renderResults,
    onFinishFn,
    sequence: [
      {
        expectCurrentQuestionAsync: async (getCurrentQuestionTitle) => {
          expect(getCurrentQuestionTitle()).toBe("How long ago is it?");
        },
      },
    ],
  });
});

test("2 questions", async () => {
  const onFinishFn = jest.fn();

  const props: SurveyScreenProps = {
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
    ping: TEST_PING,
    previousState: null,
    onFinish: onFinishFn,
  };
  const renderResults = render(<SurveyScreen {...props} />);

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

test("50 questions", async () => {
  const onFinishFn = jest.fn();

  const questions: QuestionsList = {};
  for (let i = 1; i <= 50; i++) {
    questions[`question_${i}`] = {
      id: `question_${i}`,
      type: QuestionType.HowLongAgo,
      question: `This is the ${i}th question.`,
      next: i === 50 ? null : `question_${i + 1}`,
    };
  }

  const props: SurveyScreenProps = {
    questions,
    startingQuestionId: "question_1",
    ping: TEST_PING,
    previousState: null,
    onFinish: onFinishFn,
  };
  const renderResults = render(<SurveyScreen {...props} />);

  const sequence = [];

  for (let i = 1; i <= 50; i++) {
    sequence.push({
      expectCurrentQuestionAsync: async (
        getCurrentQuestionTitle: () => string,
      ) => {
        expect(getCurrentQuestionTitle()).toBe(`This is the ${i}th question.`);
      },
    });
  }

  await testQuestionsSequenceAsync({
    renderResults,
    onFinishFn,
    sequence,
  });
});
