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
  ChoicesQuestion,
  QuestionTypeType,
  PlaceholderReplacementValueTreatmentOptions,
} from "../../helpers/types";
import {
  setUpSurveyScreenTestAsync,
  tearDownSurveyScreenTestAsync,
  testQuestionsSequenceAsync,
  TestQuestionsSequence,
  getBaseProps,
  PART_OF_NON_CRITICAL_ERROR_STRING,
} from "./helper";

let currentPropsBase!: SurveyScreenProps;
beforeEach(async () => {
  const currentTestPing = await setUpSurveyScreenTestAsync();
  currentPropsBase = {
    ...getBaseProps(),
    questions: {}, // Will be extended by each test.
    startingQuestionId: "q1",
    ping: currentTestPing,
  };
});

afterEach(async () => {
  await tearDownSurveyScreenTestAsync();
});

async function clickOptionAsync(
  option: string,
  { findByA11yLabel }: RenderAPI,
) {
  // `findBy` does the `waitFor` for us.
  fireEvent.press(await findByA11yLabel(`select ${option}`));
}

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
      // See `MARK: SURVEY_TEST_WHY_GET_PROPS`.
      const getProps = (): SurveyScreenProps => ({
        ...currentPropsBase,
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
      });

      test("click a choice", async () => {
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
  const getProps = (): SurveyScreenProps => ({
    ...currentPropsBase,
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
  });

  test("click special-case choice", async () => {
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
      <SurveyScreen {...getProps()} onFinish={onFinishFn} />,
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
      <SurveyScreen {...getProps()} onFinish={onFinishFn} />,
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
    const getProps = (): SurveyScreenProps => ({
      ...currentPropsBase,
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
    });

    test("click special-case choice without null", async () => {
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
        <SurveyScreen {...getProps()} onFinish={onFinishFn} />,
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
        <SurveyScreen {...getProps()} onFinish={onFinishFn} />,
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
        <SurveyScreen {...getProps()} onFinish={onFinishFn} />,
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

const PREV_QUESTONS_CHOICES_FOR_PLACEHOLDERS_TEST: [
  QuestionTypeType,
  PlaceholderReplacementValueTreatmentOptions | undefined,
  ChoicesQuestion,
  string,
  string,
][] = [
  [
    QuestionType.ChoicesWithSingleAnswer,
    undefined,
    {
      id: "q1",
      type: QuestionType.ChoicesWithSingleAnswer,
      question: "Question 1",
      choices: ["Wolf", "Coyote", "Lynx"],
      next: "q2",
    },
    "Coyote",
    "Coyote",
  ],
  [
    QuestionType.ChoicesWithSingleAnswer,
    {
      decapitalizeFirstCharacter: {
        enabled: true,
      },
    },
    {
      id: "q1",
      type: QuestionType.ChoicesWithSingleAnswer,
      question: "Question 1",
      choices: ["Wolf", "Coyote", "Lynx"],
      next: "q2",
    },
    "Coyote",
    "coyote",
  ],
];
describe.each(PREV_QUESTONS_CHOICES_FOR_PLACEHOLDERS_TEST)(
  "%s: replace placeholder with previous question's answer (treatment options: %o)",
  (type, treatments, q1, answerToChoose, expectedReplacement) => {
    describe("single answer replacement", () => {
      const getProps = (): SurveyScreenProps => {
        const props: SurveyScreenProps = {
          ...currentPropsBase,
          questions: {
            q1,
            q2: {
              id: "q2",
              type: QuestionType.Slider,
              question: "Question 2: previous answer is {PREV:q1}!",
              slider: ["left", "right"],
              next: null,
            },
          },
          startingQuestionId: "q1",
        };
        if (treatments !== undefined) {
          props.studyInfo.specialVariablePlaceholderTreatments = {
            q1: treatments,
          };
        }
        return props;
      };

      test("choose and next", async () => {
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
                await clickOptionAsync(answerToChoose, renderResults);

                expect(getCurrentQuestionTitle()).toBe("Question 1");
              },
            },
            {
              expectCurrentQuestionAsync: async (getCurrentQuestionTitle) => {
                const title = getCurrentQuestionTitle();
                expect(title).toBe(
                  `Question 2: previous answer is ${expectedReplacement}!`,
                );
                expect(title).toMatchSnapshot("Question 2 title");
              },
            },
          ],
        });
      });

      test("choose and prefer not to answer", async () => {
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
                await clickOptionAsync(answerToChoose, renderResults);

                expect(getCurrentQuestionTitle()).toBe("Question 1");
              },
              nextButton: "pna",
            },
            {
              expectCurrentQuestionAsync: async (getCurrentQuestionTitle) => {
                const title = getCurrentQuestionTitle();
                expect(
                  title.includes(
                    `Question 2: previous answer is ${PART_OF_NON_CRITICAL_ERROR_STRING}`,
                  ),
                ).toBeTruthy();
                expect(title).toMatchSnapshot("Question 2 title");
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
                const title = getCurrentQuestionTitle();
                expect(
                  title.includes(
                    `Question 2: previous answer is ${PART_OF_NON_CRITICAL_ERROR_STRING}`,
                  ),
                ).toBeTruthy();
                expect(title).toMatchSnapshot("Question 2 title");
              },
            },
          ],
        });
      });
    });
  },
);
