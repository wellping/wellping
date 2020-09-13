import React from "react";
import { render } from "react-native-testing-library";

import SurveyScreen, { SurveyScreenProps } from "../../SurveyScreen";
import { QuestionType } from "../../helpers/helpers";
import { QuestionsList, Question, QuestionTypeType } from "../../helpers/types";
import {
  getBaseProps,
  testQuestionsSequenceAsync,
  tearDownSurveyScreenTestAsync,
  setUpSurveyScreenTestAsync,
  TearDownSurveyScreenTestOptions,
} from "./helper";

let currentTearDownOptions!: Partial<TearDownSurveyScreenTestOptions>;

let currentPropsBase!: SurveyScreenProps;
beforeEach(async () => {
  const currentTestPing = await setUpSurveyScreenTestAsync();
  currentPropsBase = {
    ...getBaseProps(),
    questions: {}, // Will be extended by each test.
    startingQuestionId: "q1",
    ping: currentTestPing,
  };

  currentTearDownOptions = {};
});

afterEach(async () => {
  await tearDownSurveyScreenTestAsync(currentTearDownOptions);
});

test("non-existent startingQuestionId", async () => {
  const onFinishFn = jest.fn();

  currentTearDownOptions = {
    shouldHaveEndTime: false,
    shouldCheckAnswers: false,
  };
  const props: SurveyScreenProps = {
    ...currentPropsBase,
    questions: {},
    startingQuestionId: "na",
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
    ...currentPropsBase,
    questions: {
      howLongAgoQuestion: {
        id: "howLongAgoQuestion",
        type: QuestionType.HowLongAgo,
        question: "How long ago is it?",
        next: null,
      },
    },
    startingQuestionId: "howLongAgoQuestion",
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
    ...currentPropsBase,
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
    ...currentPropsBase,
    questions,
    startingQuestionId: "question_1",
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
}, 30000); // https://github.com/facebook/jest/issues/5055

const DIFFERENT_TYPES_OF_QUESTIONS: [QuestionTypeType, Question][] = [
  [
    QuestionType.Slider,
    {
      id: "q1",
      type: QuestionType.Slider,
      question: "Question 1",
      slider: ["left", "right"],
      next: "q2",
    },
  ],
  [
    QuestionType.ChoicesWithSingleAnswer,
    {
      id: "q1",
      type: QuestionType.ChoicesWithSingleAnswer,
      question: "Question 1",
      choices: ["choice A", "choice B", "choice C", "choice D"],
      next: "q2",
    },
  ],
  [
    QuestionType.ChoicesWithMultipleAnswers,
    {
      id: "q1",
      type: QuestionType.ChoicesWithMultipleAnswers,
      question: "Question 1",
      choices: ["choice A", "choice B", "choice C", "choice D"],
      next: "q2",
    },
  ],
  [
    QuestionType.YesNo,
    {
      id: "q1",
      type: QuestionType.YesNo,
      question: "Question 1",
      next: "q2",
    },
  ],
  [
    QuestionType.MultipleText,
    {
      id: "q1",
      type: QuestionType.MultipleText,
      max: 3,
      variableName: "varname",
      indexName: "idx",
      question: "Question 1",
      next: "q2",
    },
  ],
  [
    QuestionType.HowLongAgo,
    {
      id: "q1",
      type: QuestionType.HowLongAgo,
      question: "Question 1",
      next: "q2",
    },
  ],
];
describe.each(DIFFERENT_TYPES_OF_QUESTIONS)(
  "%s: prefer not to answer or next without answering",
  (type, q1) => {
    describe("without fallback", () => {
      // MARK: SURVEY_TEST_WHY_GET_PROPS
      // For instances like this where we define a prop in `describe` instead of
      // `test`, we have to use a function because `currentPropsBase` will change
      // for each test.
      const getProps = (): SurveyScreenProps => ({
        ...currentPropsBase,
        questions: {
          q1,
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

      test("prefer not to answer", async () => {
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

      test("next without answering", async () => {
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
    });

    describe("prefer not to answer fallback", () => {
      describe("a question", () => {
        const getProps = (): SurveyScreenProps => ({
          ...currentPropsBase,
          questions: {
            q1: {
              ...q1,
              fallbackNext: {
                preferNotToAnswer: "q1_pna_fallback",
              },
            },
            q1_pna_fallback: {
              id: "q1_pna_fallback",
              type: QuestionType.Slider,
              question: "Question 1 - Prefer not to answer fallback",
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
          startingQuestionId: "q1",
        });

        test("click next", async () => {
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

        test("click PNA", async () => {
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
                  expect(getCurrentQuestionTitle()).toBe(
                    "Question 1 - Prefer not to answer fallback",
                  );
                },
              },
            ],
          });
        });
      });

      describe("null", () => {
        const getProps = (): SurveyScreenProps => ({
          ...currentPropsBase,
          questions: {
            q1: {
              ...q1,
              fallbackNext: {
                preferNotToAnswer: null,
              },
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

        test("click next", async () => {
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

        test("click PNA", async () => {
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
            ],
          });
        });
      });
    });

    describe("next without answering fallback", () => {
      describe("a question", () => {
        const getProps = (): SurveyScreenProps => ({
          ...currentPropsBase,
          questions: {
            q1: {
              ...q1,
              fallbackNext: {
                nextWithoutAnswering: "q1_nwa_fallback",
              },
            },
            q1_nwa_fallback: {
              id: "q1_nwa_fallback",
              type: QuestionType.Slider,
              question: "Question 1 - Next without answering fallback",
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
          startingQuestionId: "q1",
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
                  expect(getCurrentQuestionTitle()).toBe(
                    "Question 1 - Next without answering fallback",
                  );
                },
              },
            ],
          });
        });

        test("click PNA", async () => {
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

      describe("null", () => {
        const getProps = (): SurveyScreenProps => ({
          ...currentPropsBase,
          questions: {
            q1: {
              ...q1,
              fallbackNext: {
                nextWithoutAnswering: null,
              },
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
            ],
          });
        });

        test("click PNA", async () => {
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
    });
  },
);
