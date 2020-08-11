import React from "react";
import {
  render,
  fireEvent,
  waitFor,
  waitForElementToBeRemoved,
  RenderAPI,
} from "react-native-testing-library";
import { BaseEntity } from "typeorm";
import waitForExpect from "wait-for-expect";

import SurveyScreen, { SurveyScreenProps } from "../SurveyScreen";
import { PingEntity } from "../entities/PingEntity";
import { QuestionType } from "../helpers/helpers";
import * as HelperPings from "../helpers/pings";
import { QuestionsList } from "../helpers/types";

const getPingEntity = ({
  id,
  notificationTime,
  startTime,
  tzOffset,
  streamName,
}: {
  id: string;
  notificationTime: Date;
  startTime: Date;
  tzOffset: number;
  streamName: string;
}): PingEntity => {
  const ping = new PingEntity();
  ping.id = id;
  ping.notificationTime = notificationTime;
  ping.startTime = startTime;
  ping.streamName = streamName;
  ping.tzOffset = tzOffset;
  return ping;
};

const TEST_PING_RAW = {
  id: "testPing",
  notificationTime: new Date(),
  startTime: new Date(),
  tzOffset: 0,
  streamName: "testStream",
};
const TEST_PING = getPingEntity(TEST_PING_RAW);

const QUESTION_TITLE_TESTID = "questionTitle";
const NEXT_BUTTON_A11YLABEL = "Next question";
const PNA_BUTTON_A11YLABEL = "Prefer not to answer the current question";

/**
 * If we are not testing database here, we can mock all database-related
 * function.
 * If we don't do so, the code will be stuck on these functions.
 */
function mockDatabaseRelatedFunction() {
  // https://stackoverflow.com/a/56565849/2603230
  jest.spyOn(BaseEntity.prototype, "save").mockReturnThis();
  jest.spyOn(BaseEntity.prototype, "reload").mockReturnThis();

  // `addEndTimeToPingAsync` is tested in `pings.parttest.ts`.
  jest
    .spyOn(HelperPings, "addEndTimeToPingAsync")
    .mockImplementation(async () => {
      const newPing = {
        ...TEST_PING_RAW,
        endDate: new Date(),
      };
      return getPingEntity(newPing);
    });
}

/**
 * Tests the current question.
 *
 * If `waitForAndTestEndPage` is true, we will wait for the question title to
 * be removed and test if it is indeed the end page (onFinishFn should be
 * passed to the function). Otherwise, we will wait for the next question title
 * to be loaded.
 */
async function testCurrentQuestionAsync({
  renderResults: { getByA11yLabel, queryByTestId, getByTestId, toJSON },
  expectCurrentQuestionAsync,
  nextButton = "next",
  waitForAndTestEndPage = false,
  onFinishFn,
}: {
  renderResults: RenderAPI;
  expectCurrentQuestionAsync: (
    getCurrentQuestionTitle: () => string,
  ) => Promise<void>;
  nextButton?: "next" | "pna";
  waitForAndTestEndPage?: boolean;
  onFinishFn?: jest.Mock;
}): Promise<void> {
  // Wait for the question to be loaded.
  await waitFor(() => getByTestId(QUESTION_TITLE_TESTID));
  expect(queryByTestId(QUESTION_TITLE_TESTID)).not.toBeNull();

  const getCurrentQuestionTitle = () =>
    getByTestId(QUESTION_TITLE_TESTID).props.children;

  await expectCurrentQuestionAsync(getCurrentQuestionTitle);

  // For some reason we have to do this to ensure `fireEvent` works in
  // `expectCurrentQuestionAsync`.
  await new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, 0);
  });

  const currentQuestionTitle = getCurrentQuestionTitle();

  if (nextButton === "next") {
    fireEvent.press(getByA11yLabel(NEXT_BUTTON_A11YLABEL));
  } else if (nextButton === "pna") {
    fireEvent.press(getByA11yLabel(PNA_BUTTON_A11YLABEL));
  }

  if (waitForAndTestEndPage) {
    if (queryByTestId(QUESTION_TITLE_TESTID)) {
      await waitForElementToBeRemoved(() =>
        queryByTestId(QUESTION_TITLE_TESTID),
      );
    }

    expect(toJSON()).toBe(null);

    await waitForExpect(() => {
      expect(onFinishFn).toHaveBeenCalledTimes(1);
    });
  } else {
    await waitForExpect(() => {
      expect(getCurrentQuestionTitle()).not.toEqual(currentQuestionTitle);
    });
  }
}

async function testQuestionsSequenceAsync({
  renderResults,
  onFinishFn,
  sequence,
}: {
  renderResults: RenderAPI;
  onFinishFn: jest.Mock;
  sequence: {
    expectCurrentQuestionAsync: (
      getCurrentQuestionTitle: () => string,
    ) => Promise<void>;
    nextButton?: "next" | "pna";
  }[];
}) {
  for (let i = 0; i < sequence.length - 1; i++) {
    const currentQuestion = sequence[i];
    await testCurrentQuestionAsync({
      renderResults,
      expectCurrentQuestionAsync: currentQuestion.expectCurrentQuestionAsync,
      nextButton: currentQuestion.nextButton,
    });
  }

  const lastQuestion = sequence[sequence.length - 1];
  await testCurrentQuestionAsync({
    renderResults,
    expectCurrentQuestionAsync: lastQuestion.expectCurrentQuestionAsync,
    nextButton: lastQuestion.nextButton,
    waitForAndTestEndPage: true,
    onFinishFn,
  });
}

describe("questions flow", () => {
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
          expect(getCurrentQuestionTitle()).toBe(
            `This is the ${i}th question.`,
          );
        },
      });
    }

    await testQuestionsSequenceAsync({
      renderResults,
      onFinishFn,
      sequence,
    });
  });

  describe("yes no question", () => {
    async function clickOptionAsync(
      yesNo: "Yes" | "No",
      { getByA11yLabel }: RenderAPI,
    ) {
      // Wait for the choices to be loaded.
      await waitFor(() => getByA11yLabel(`select ${yesNo}`));

      fireEvent.press(getByA11yLabel(`select ${yesNo}`));
    }

    describe("with both branchStartId", () => {
      const props: SurveyScreenProps = {
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
        ping: TEST_PING,
        previousState: null,
        onFinish: async () => {},
      };

      test("click yes", async () => {
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
                await clickOptionAsync("Yes", renderResults);

                expect(getCurrentQuestionTitle()).toBe("Question 1");
              },
            },
            {
              expectCurrentQuestionAsync: async (getCurrentQuestionTitle) => {
                expect(getCurrentQuestionTitle()).toBe(
                  "Question 1 - yes branch",
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

      test("click no", async () => {
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
                await clickOptionAsync("No", renderResults);

                expect(getCurrentQuestionTitle()).toBe("Question 1");
              },
            },
            {
              expectCurrentQuestionAsync: async (getCurrentQuestionTitle) => {
                expect(getCurrentQuestionTitle()).toBe(
                  "Question 1 - no branch",
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
      const props: SurveyScreenProps = {
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
        ping: TEST_PING,
        previousState: null,
        onFinish: async () => {},
      };

      test("click yes", async () => {
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
                await clickOptionAsync("Yes", renderResults);

                expect(getCurrentQuestionTitle()).toBe("Question 1");
              },
            },
            {
              expectCurrentQuestionAsync: async (getCurrentQuestionTitle) => {
                expect(getCurrentQuestionTitle()).toBe(
                  "Question 1 - yes branch",
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

      test("click no", async () => {
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
      const props: SurveyScreenProps = {
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
        ping: TEST_PING,
        previousState: null,
        onFinish: async () => {},
      };

      test("click yes", async () => {
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
          <SurveyScreen {...props} onFinish={onFinishFn} />,
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
                expect(getCurrentQuestionTitle()).toBe(
                  "Question 1 - no branch",
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
      const props: SurveyScreenProps = {
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
        ping: TEST_PING,
        previousState: null,
        onFinish: async () => {},
      };

      test("click yes", async () => {
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
          <SurveyScreen {...props} onFinish={onFinishFn} />,
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
});
