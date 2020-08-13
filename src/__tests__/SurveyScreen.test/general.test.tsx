import React from "react";
import { render } from "react-native-testing-library";

import SurveyScreen, { SurveyScreenProps } from "../../SurveyScreen";
import { QuestionType } from "../../helpers/helpers";
import {
  QuestionsList,
  Question,
  QuestionTypeType,
  SliderQuestion,
  ChoicesWithSingleAnswerQuestion,
  ChoicesWithMultipleAnswersQuestion,
  YesNoQuestion,
  MultipleTextQuestion,
  HowLongAgoQuestion,
} from "../../helpers/types";
import {
  TEST_PING,
  mockNecessaryFunctionsToTestSurveyScreen,
  testQuestionsSequenceAsync,
} from "./helper";

beforeEach(() => {
  mockNecessaryFunctionsToTestSurveyScreen();
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

const DIFFERENT_TYPES_OF_QUESTIONS = [
  [
    QuestionType.Slider,
    {
      id: "q1",
      type: QuestionType.Slider,
      question: "Question 1",
      slider: ["left", "right"],
      next: "q2",
    } as SliderQuestion,
  ],
  [
    QuestionType.ChoicesWithSingleAnswer,
    {
      id: "q1",
      type: QuestionType.ChoicesWithSingleAnswer,
      question: "Question 1",
      choices: ["choice A", "choice B", "choice C", "choice D"],
      next: "q2",
    } as ChoicesWithSingleAnswerQuestion,
  ],
  [
    QuestionType.ChoicesWithMultipleAnswers,
    {
      id: "q1",
      type: QuestionType.ChoicesWithMultipleAnswers,
      question: "Question 1",
      choices: ["choice A", "choice B", "choice C", "choice D"],
      next: "q2",
    } as ChoicesWithMultipleAnswersQuestion,
  ],
  [
    QuestionType.YesNo,
    {
      id: "q1",
      type: QuestionType.YesNo,
      question: "Question 1",
      next: "q2",
    } as YesNoQuestion,
  ],
  [
    QuestionType.MultipleText,
    {
      id: "q1",
      type: QuestionType.MultipleText,
      max: 3,
      question: "Question 1",
      next: "q2",
    } as MultipleTextQuestion,
  ],
  [
    QuestionType.HowLongAgo,
    {
      id: "q1",
      type: QuestionType.HowLongAgo,
      question: "Question 1",
      next: "q2",
    } as HowLongAgoQuestion,
  ],
] as [QuestionTypeType, Question][];
describe.each(DIFFERENT_TYPES_OF_QUESTIONS)(
  "%s: prefer not to answer or next without answering",
  (type, q1) => {
    describe("without fallback", () => {
      const props: SurveyScreenProps = {
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
        ping: TEST_PING,
        previousState: null,
        onFinish: async () => {},
      };

      test("prefer not to answer", async () => {
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
    });

    describe("prefer not to answer fallback", () => {
      describe("a question", () => {
        const props: SurveyScreenProps = {
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
          ping: TEST_PING,
          previousState: null,
          onFinish: async () => {},
        };

        test("click next", async () => {
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

        test("click PNA", async () => {
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
        const props: SurveyScreenProps = {
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
          ping: TEST_PING,
          previousState: null,
          onFinish: async () => {},
        };

        test("click next", async () => {
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

        test("click PNA", async () => {
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
                nextButton: "pna",
              },
            ],
          });
        });
      });
    });

    describe("next without answering fallback", () => {
      describe("a question", () => {
        const props: SurveyScreenProps = {
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
          ping: TEST_PING,
          previousState: null,
          onFinish: async () => {},
        };

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
        const props: SurveyScreenProps = {
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
          ping: TEST_PING,
          previousState: null,
          onFinish: async () => {},
        };

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
            ],
          });
        });

        test("click PNA", async () => {
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
