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

  test("enter some text and then remove them", async () => {
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
            await enterTextAsync(0, "", renderResults);
            await enterTextAsync(1, "", renderResults);

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

describe("with repeatedItemStartId", () => {
  const props: SurveyScreenProps = {
    ...propsBase,
    questions: {
      q1: {
        id: "q1",
        type: QuestionType.MultipleText,
        question: "Question 1",
        indexName: "INDEX",
        variableName: "MY_VARNAME",
        repeatedItemStartId: "q1_n[__INDEX__]_1",
        max: 3,
        next: "q2",
      },
      "q1_n[__INDEX__]_1": {
        id: "q1_n[__INDEX__]_1",
        type: QuestionType.Slider,
        question: "Question 1-1: [__MY_VARNAME__] (index [__INDEX__])",
        slider: ["left", "right"],
        next: "q1_n[__INDEX__]_2",
      },
      "q1_n[__INDEX__]_2": {
        id: "q1_n[__INDEX__]_2",
        type: QuestionType.Slider,
        question: "Question 1-2: [__MY_VARNAME__] (index is [__INDEX__])",
        slider: ["left", "right"],
        next: null,
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
            await enterTextAsync(0, "hello world!", renderResults);
            await enterTextAsync(1, "yes?", renderResults);

            expect(getCurrentQuestionTitle()).toBe("Question 1");
          },
        },
        {
          expectCurrentQuestionAsync: async (getCurrentQuestionTitle) => {
            expect(getCurrentQuestionTitle()).toBe(
              "Question 1-1: hello world! (index 1)",
            );
          },
        },
        {
          expectCurrentQuestionAsync: async (getCurrentQuestionTitle) => {
            expect(getCurrentQuestionTitle()).toBe(
              "Question 1-2: hello world! (index is 1)",
            );
          },
        },
        {
          expectCurrentQuestionAsync: async (getCurrentQuestionTitle) => {
            expect(getCurrentQuestionTitle()).toBe(
              "Question 1-1: yes? (index 2)",
            );
          },
        },
        {
          expectCurrentQuestionAsync: async (getCurrentQuestionTitle) => {
            expect(getCurrentQuestionTitle()).toBe(
              "Question 1-2: yes? (index is 2)",
            );
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

  test("enter some text and then remove them", async () => {
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
            await enterTextAsync(0, "", renderResults);
            await enterTextAsync(1, "", renderResults);

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

  test("enter some text and then remove one of them", async () => {
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
            await enterTextAsync(0, "後之視今", renderResults);
            await enterTextAsync(1, "亦猶今之視昔", renderResults);
            await enterTextAsync(2, "悲夫", renderResults);
            await enterTextAsync(0, "", renderResults);
            await enterTextAsync(1, "", renderResults);

            expect(getCurrentQuestionTitle()).toBe("Question 1");
          },
        },
        {
          expectCurrentQuestionAsync: async (getCurrentQuestionTitle) => {
            expect(getCurrentQuestionTitle()).toBe(
              "Question 1-1: 悲夫 (index 1)",
            );
          },
        },
        {
          expectCurrentQuestionAsync: async (getCurrentQuestionTitle) => {
            expect(getCurrentQuestionTitle()).toBe(
              "Question 1-2: 悲夫 (index is 1)",
            );
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
