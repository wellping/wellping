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
  mockNecessaryFunctionsToTestSurveyScreen,
  testQuestionsSequenceAsync,
  TestQuestionsSequence,
} from "./helper";

beforeEach(() => {
  mockNecessaryFunctionsToTestSurveyScreen();
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

describe.each(TWO_TYPES)(
  "without meaningful specialCasesStartId - %s: ",
  (type) => {
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
  },
);

describe.each(TWO_TYPES)("with non-null specialCasesStartId - %s: ", (type) => {
  const props: SurveyScreenProps = {
    ...propsBase,
    questions: {
      q1: {
        id: "q1",
        type,
        specialCasesStartId: [
          ["Choice 1", "q1_c1"],
          ["Choice 3", "q1_c3"],
        ],
        question: "Question 1",
        choices: ["Choice 1", "Choice 2", "Choice 3"],
        next: "q2",
      },
      q1_c1: {
        id: "q1_c1",
        type: QuestionType.YesNo,
        question: "Question 1 - branch Choice 1",
        next: null,
      },
      q1_c2: {
        id: "q1_c2",
        type: QuestionType.YesNo,
        question: "Question 1 - branch Choice 2",
        next: null,
      },
      q1_c3: {
        id: "q1_c3",
        type: QuestionType.YesNo,
        question: "Question 1 - branch Choice 3",
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

  test("click special-case choice", async () => {
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
            await clickOptionAsync("Choice 1", renderResults);

            expect(getCurrentQuestionTitle()).toBe("Question 1");
          },
        },
        {
          expectCurrentQuestionAsync: async (getCurrentQuestionTitle) => {
            expect(getCurrentQuestionTitle()).toBe(
              "Question 1 - branch Choice 1",
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

  test("click no-special-case choice", async () => {
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

  test("click two special-case choices", async () => {
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
            await clickOptionAsync("Choice 1", renderResults);
            await clickOptionAsync("Choice 3", renderResults);

            expect(getCurrentQuestionTitle()).toBe("Question 1");
          },
        },
        {
          expectCurrentQuestionAsync: async (getCurrentQuestionTitle) => {
            expect(getCurrentQuestionTitle()).toBe(
              type === QuestionType.ChoicesWithSingleAnswer
                ? "Question 1 - branch Choice 3"
                : // Because choices with multiple answers checks the first match.
                  "Question 1 - branch Choice 1",
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

describe.each(TWO_TYPES)(
  "with some null specialCasesStartId - %s: ",
  (type) => {
    const props: SurveyScreenProps = {
      ...propsBase,
      questions: {
        q1: {
          id: "q1",
          type,
          specialCasesStartId: [
            ["Choice 1", "q1_c1"],
            ["Choice 3", null],
          ],
          question: "Question 1",
          choices: ["Choice 1", "Choice 2", "Choice 3"],
          next: "q2",
        },
        q1_c1: {
          id: "q1_c1",
          type: QuestionType.YesNo,
          question: "Question 1 - branch Choice 1",
          next: null,
        },
        q1_c3: {
          id: "q1_c3",
          type: QuestionType.YesNo,
          question: "Question 1 - branch Choice 3",
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

    test("click special-case choice without null", async () => {
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
              await clickOptionAsync("Choice 1", renderResults);

              expect(getCurrentQuestionTitle()).toBe("Question 1");
            },
          },
          {
            expectCurrentQuestionAsync: async (getCurrentQuestionTitle) => {
              expect(getCurrentQuestionTitle()).toBe(
                "Question 1 - branch Choice 1",
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

    test("click special-case choice with null", async () => {
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
              await clickOptionAsync("Choice 3", renderResults);

              expect(getCurrentQuestionTitle()).toBe("Question 1");
            },
          },
        ],
      });
    });

    test("click no-special-case choice", async () => {
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

    test("click two special-case choices (with the latter one being null)", async () => {
      const onFinishFn = jest.fn();

      const renderResults = render(
        <SurveyScreen {...props} onFinish={onFinishFn} />,
      );

      const sequence: TestQuestionsSequence = [
        {
          expectCurrentQuestionAsync: async (getCurrentQuestionTitle) => {
            await clickOptionAsync("Choice 1", renderResults);
            await clickOptionAsync("Choice 3", renderResults);

            expect(getCurrentQuestionTitle()).toBe("Question 1");
          },
        },
      ];
      if (type === QuestionType.ChoicesWithMultipleAnswers) {
        sequence.push(
          {
            expectCurrentQuestionAsync: async (getCurrentQuestionTitle) => {
              expect(getCurrentQuestionTitle()).toBe(
                "Question 1 - branch Choice 1",
              );
            },
          },
          {
            expectCurrentQuestionAsync: async (getCurrentQuestionTitle) => {
              expect(getCurrentQuestionTitle()).toBe("Question 2");
            },
          },
        );
      } else {
        // Do nothing because for choices with single answer, the next is `null`.
      }

      await testQuestionsSequenceAsync({
        renderResults,
        onFinishFn,
        sequence,
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
  },
);
