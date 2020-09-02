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
  getBaseProps,
  setUpSurveyScreenTestAsync,
  tearDownSurveyScreenTestAsync,
  testQuestionsSequenceAsync,
} from "./helper";

let currentPropsBase!: SurveyScreenProps;
beforeEach(async () => {
  const currentTestPing = await setUpSurveyScreenTestAsync();
  currentPropsBase = {
    ...getBaseProps(),
    questions: {},
    startingQuestionId: "q1",
    ping: currentTestPing,
  };
});

afterEach(async () => {
  await tearDownSurveyScreenTestAsync();
});

async function clickOptionAsync(
  yesNo: "Yes" | "No",
  { findByA11yLabel }: RenderAPI,
) {
  // `findBy` does the `waitFor` for us.
  fireEvent.press(await findByA11yLabel(`select ${yesNo}`));
}

describe("with both branchStartId", () => {
  // See `MARK: SURVEY_TEST_WHY_GET_PROPS`.
  const getProps = (): SurveyScreenProps => ({
    ...currentPropsBase,
    questions: {
      q1: {
        id: "q1",
        type: QuestionType.YesNo,
        question: "Question 1",
        branchStartId: {
          yes: "q1.yes",
          no: "q1.no",
        },
        next: "q2",
      },
      "q1.yes": {
        id: "q1.yes",
        type: QuestionType.YesNo,
        question: "Question 1 - yes branch",
        next: null,
      },
      "q1.no": {
        id: "q1.no",
        type: QuestionType.YesNo,
        question: "Question 1 - no branch",
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
    startingQuestionId: "q1",
  });

  test("click yes", async () => {
    const onFinishFn = jest.fn();

    const renderResults = render(
      <SurveyScreen {...getProps()} onFinish={onFinishFn} />,
    );

    await testQuestionsSequenceAsync({
      renderResults,
      onFinishFn,
      sequence: [
        {
          expectCurrentQuestionAsync: async (getCurrentQuestionTitle) => {
            await clickOptionAsync("Yes", renderResults);

            expect(getCurrentQuestionTitle()).toBe("Question 1");
          },
        },
        {
          expectCurrentQuestionAsync: async (getCurrentQuestionTitle) => {
            expect(getCurrentQuestionTitle()).toBe("Question 1 - yes branch");
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

  test("click no", async () => {
    const onFinishFn = jest.fn();

    const renderResults = render(
      <SurveyScreen {...getProps()} onFinish={onFinishFn} />,
    );

    await testQuestionsSequenceAsync({
      renderResults,
      onFinishFn,
      sequence: [
        {
          expectCurrentQuestionAsync: async (getCurrentQuestionTitle) => {
            await clickOptionAsync("No", renderResults);

            expect(getCurrentQuestionTitle()).toBe("Question 1");
          },
        },
        {
          expectCurrentQuestionAsync: async (getCurrentQuestionTitle) => {
            expect(getCurrentQuestionTitle()).toBe("Question 1 - no branch");
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
      <SurveyScreen {...getProps()} onFinish={onFinishFn} />,
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
      <SurveyScreen {...getProps()} onFinish={onFinishFn} />,
    );

    await testQuestionsSequenceAsync({
      renderResults,
      onFinishFn,
      sequence: [
        {
          expectCurrentQuestionAsync: async (getCurrentQuestionTitle) => {
            // Clicking "Yes" shouldn't matter here if we click prefer not
            // to answer.
            await clickOptionAsync("Yes", renderResults);

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

describe("with only `yes` branchStartId", () => {
  const getProps = (): SurveyScreenProps => ({
    ...currentPropsBase,
    questions: {
      q1: {
        id: "q1",
        type: QuestionType.YesNo,
        question: "Question 1",
        branchStartId: {
          yes: "q1.yes",
        },
        next: "q2",
      },
      "q1.yes": {
        id: "q1.yes",
        type: QuestionType.YesNo,
        question: "Question 1 - yes branch",
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
    startingQuestionId: "q1",
  });

  test("click yes", async () => {
    const onFinishFn = jest.fn();

    const renderResults = render(
      <SurveyScreen {...getProps()} onFinish={onFinishFn} />,
    );

    await testQuestionsSequenceAsync({
      renderResults,
      onFinishFn,
      sequence: [
        {
          expectCurrentQuestionAsync: async (getCurrentQuestionTitle) => {
            await clickOptionAsync("Yes", renderResults);

            expect(getCurrentQuestionTitle()).toBe("Question 1");
          },
        },
        {
          expectCurrentQuestionAsync: async (getCurrentQuestionTitle) => {
            expect(getCurrentQuestionTitle()).toBe("Question 1 - yes branch");
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

  test("click no", async () => {
    const onFinishFn = jest.fn();

    const renderResults = render(
      <SurveyScreen {...getProps()} onFinish={onFinishFn} />,
    );

    await testQuestionsSequenceAsync({
      renderResults,
      onFinishFn,
      sequence: [
        {
          expectCurrentQuestionAsync: async (getCurrentQuestionTitle) => {
            await clickOptionAsync("No", renderResults);

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
      <SurveyScreen {...getProps()} onFinish={onFinishFn} />,
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
      <SurveyScreen {...getProps()} onFinish={onFinishFn} />,
    );

    await testQuestionsSequenceAsync({
      renderResults,
      onFinishFn,
      sequence: [
        {
          expectCurrentQuestionAsync: async (getCurrentQuestionTitle) => {
            // Clicking "Yes" shouldn't matter here if we click prefer not
            // to answer.
            await clickOptionAsync("Yes", renderResults);

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

describe("with only `no` branchStartId", () => {
  const getProps = (): SurveyScreenProps => ({
    ...currentPropsBase,
    questions: {
      q1: {
        id: "q1",
        type: QuestionType.YesNo,
        question: "Question 1",
        branchStartId: {
          no: "q1.no",
        },
        next: "q2",
      },
      "q1.no": {
        id: "q1.no",
        type: QuestionType.YesNo,
        question: "Question 1 - no branch",
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
    startingQuestionId: "q1",
  });

  test("click yes", async () => {
    const onFinishFn = jest.fn();

    const renderResults = render(
      <SurveyScreen {...getProps()} onFinish={onFinishFn} />,
    );

    await testQuestionsSequenceAsync({
      renderResults,
      onFinishFn,
      sequence: [
        {
          expectCurrentQuestionAsync: async (getCurrentQuestionTitle) => {
            await clickOptionAsync("Yes", renderResults);

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

  test("click no", async () => {
    const onFinishFn = jest.fn();

    const renderResults = render(
      <SurveyScreen {...getProps()} onFinish={onFinishFn} />,
    );

    await testQuestionsSequenceAsync({
      renderResults,
      onFinishFn,
      sequence: [
        {
          expectCurrentQuestionAsync: async (getCurrentQuestionTitle) => {
            await clickOptionAsync("No", renderResults);

            expect(getCurrentQuestionTitle()).toBe("Question 1");
          },
        },
        {
          expectCurrentQuestionAsync: async (getCurrentQuestionTitle) => {
            expect(getCurrentQuestionTitle()).toBe("Question 1 - no branch");
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
      <SurveyScreen {...getProps()} onFinish={onFinishFn} />,
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
      <SurveyScreen {...getProps()} onFinish={onFinishFn} />,
    );

    await testQuestionsSequenceAsync({
      renderResults,
      onFinishFn,
      sequence: [
        {
          expectCurrentQuestionAsync: async (getCurrentQuestionTitle) => {
            // Clicking "No" shouldn't matter here if we click prefer not
            // to answer.
            await clickOptionAsync("No", renderResults);

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

describe("with only `yes` and `no` being `null` branchStartId", () => {
  const getProps = (): SurveyScreenProps => ({
    ...currentPropsBase,
    questions: {
      q1: {
        id: "q1",
        type: QuestionType.YesNo,
        question: "Question 1",
        branchStartId: {
          yes: null,
          no: null,
        },
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
  });

  test("click yes", async () => {
    const onFinishFn = jest.fn();

    const renderResults = render(
      <SurveyScreen {...getProps()} onFinish={onFinishFn} />,
    );

    await testQuestionsSequenceAsync({
      renderResults,
      onFinishFn,
      sequence: [
        {
          expectCurrentQuestionAsync: async (getCurrentQuestionTitle) => {
            await clickOptionAsync("Yes", renderResults);

            expect(getCurrentQuestionTitle()).toBe("Question 1");
          },
        },
      ],
    });
  });

  test("click no", async () => {
    const onFinishFn = jest.fn();

    const renderResults = render(
      <SurveyScreen {...getProps()} onFinish={onFinishFn} />,
    );

    await testQuestionsSequenceAsync({
      renderResults,
      onFinishFn,
      sequence: [
        {
          expectCurrentQuestionAsync: async (getCurrentQuestionTitle) => {
            await clickOptionAsync("No", renderResults);

            expect(getCurrentQuestionTitle()).toBe("Question 1");
          },
        },
      ],
    });
  });

  test("click next without answering", async () => {
    const onFinishFn = jest.fn();

    const renderResults = render(
      <SurveyScreen {...getProps()} onFinish={onFinishFn} />,
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
      <SurveyScreen {...getProps()} onFinish={onFinishFn} />,
    );

    await testQuestionsSequenceAsync({
      renderResults,
      onFinishFn,
      sequence: [
        {
          expectCurrentQuestionAsync: async (getCurrentQuestionTitle) => {
            // Clicking "No" shouldn't matter here if we click prefer not
            // to answer.
            await clickOptionAsync("No", renderResults);

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

describe("with undefined branchStartId", () => {
  const getProps = (): SurveyScreenProps => ({
    ...currentPropsBase,
    questions: {
      q1: {
        id: "q1",
        type: QuestionType.YesNo,
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
  });

  test("click yes", async () => {
    const onFinishFn = jest.fn();

    const renderResults = render(
      <SurveyScreen {...getProps()} onFinish={onFinishFn} />,
    );

    await testQuestionsSequenceAsync({
      renderResults,
      onFinishFn,
      sequence: [
        {
          expectCurrentQuestionAsync: async (getCurrentQuestionTitle) => {
            await clickOptionAsync("Yes", renderResults);

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

  test("click no", async () => {
    const onFinishFn = jest.fn();

    const renderResults = render(
      <SurveyScreen {...getProps()} onFinish={onFinishFn} />,
    );

    await testQuestionsSequenceAsync({
      renderResults,
      onFinishFn,
      sequence: [
        {
          expectCurrentQuestionAsync: async (getCurrentQuestionTitle) => {
            await clickOptionAsync("No", renderResults);

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
      <SurveyScreen {...getProps()} onFinish={onFinishFn} />,
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
      <SurveyScreen {...getProps()} onFinish={onFinishFn} />,
    );

    await testQuestionsSequenceAsync({
      renderResults,
      onFinishFn,
      sequence: [
        {
          expectCurrentQuestionAsync: async (getCurrentQuestionTitle) => {
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
