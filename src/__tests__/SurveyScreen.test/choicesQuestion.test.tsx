/**
 * Notice that `randomizeChoicesOrder` and `randomizeExceptForChoiceIds` are not
 * tested here as they are tested in ChoicesQuestionScreen.test.tsx.
 */
import React from "react";
import {
  render,
  fireEvent,
  waitFor,
  RenderAPI,
} from "react-native-testing-library";

import SurveyScreen, { SurveyScreenProps } from "../../SurveyScreen";
import { QuestionType } from "../../helpers/helpers";
import {
  TEST_PING,
  mockDatabaseRelatedFunction,
  testQuestionsSequenceAsync,
} from "./helper";

beforeEach(() => {
  mockDatabaseRelatedFunction();
});

async function clickOptionAsync(
  option: string,
  { findByA11yLabel }: RenderAPI,
) {
  // `findBy` does the `waitFor` for us.
  fireEvent.press(await findByA11yLabel(`select ${option}`));
}

const propsBase: SurveyScreenProps = {
  questions: {},
  startingQuestionId: "q1",
  ping: TEST_PING,
  previousState: null,
  onFinish: async () => {},
};

const TWO_TYPES: (
  | "ChoicesWithSingleAnswer"
  | "ChoicesWithMultipleAnswers"
)[] = [
  QuestionType.ChoicesWithSingleAnswer,
  QuestionType.ChoicesWithMultipleAnswers,
];

describe.each(TWO_TYPES)("simple test - %s: ", (type) => {
  // All these should not change the next question.
  describe.each([
    undefined,
    [],
    [["Non Existent Choice", "newId"]] as [string, string][],
  ])("specialCasesStartId: %p", (specialCasesStartId) => {
    const props: SurveyScreenProps = {
      ...propsBase,
      questions: {
        q1: {
          id: "q1",
          type,
          specialCasesStartId,
          question: "Question 1",
          choices: ["Choice 1", "Choice 2", "Choice 3"],
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

    test("click a choice", async () => {
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
              await clickOptionAsync("Choice 2", renderResults);

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
              // Clicking a choice shouldn't matter here if we click prefer not
              // to answer.
              await clickOptionAsync("Choice 1", renderResults);

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
});
