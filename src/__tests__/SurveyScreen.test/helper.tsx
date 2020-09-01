import {
  fireEvent,
  waitFor,
  waitForElementToBeRemoved,
  RenderAPI,
} from "react-native-testing-library";
import waitForExpect from "wait-for-expect";

import { clearAllPingsAndAnswersAsync } from "../../helpers/cleanup";
import { insertPingAsync } from "../../helpers/pings";
import { Ping } from "../../helpers/types";
import { PINGS_STUDY_INFO } from "../data/pings";
import { mockCurrentStudyInfo } from "../helper";

export const MAIN_SURVEY_SCREEN_VIEW = "mainSurveyScreenView";
export const QUESTION_TITLE_TESTID = "questionTitle";
export const NEXT_BUTTON_A11YLABEL = "Next question";
export const PNA_BUTTON_A11YLABEL = "Prefer not to answer the current question";

// Just use a study info - it's not important.
export const STUDY_INFO = PINGS_STUDY_INFO;

export function getBaseProps() {
  return {
    studyInfo: STUDY_INFO,
    previousState: null,
    onFinish: () => {},
    setUploadStatusSymbol: () => {}, // TODO: TEST THIS.
  };
}

export async function setUpSurveyScreenTestAsync(): Promise<Ping> {
  mockCurrentStudyInfo(STUDY_INFO);

  // Just to make sure.
  await clearAllPingsAndAnswersAsync();

  return await insertPingAsync({
    notificationTime: new Date(Date.now() - 20000),
    startTime: new Date(Date.now() - 10000),
    streamName: `myTest${Date.now()}Stream`, // We use `Date.now()` so that it will not conflict with other data.
  });
}

export async function tearDownSurveyScreenTestAsync(): Promise<void> {
  await clearAllPingsAndAnswersAsync();
}

/**
 * Tests the current question.
 *
 * If `waitForAndTestEndPage` is true, we will wait for the question title to
 * be removed and test if it is indeed the end page (onFinishFn should be
 * passed to the function). Otherwise, we will wait for the next question title
 * to be loaded.
 */
export async function testCurrentQuestionAsync({
  renderResults: {
    getByA11yLabel,
    queryByTestId,
    findByTestId,
    getByTestId,
    toJSON,
  },
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

  await waitForExpect(async () => {
    // Expect the screen to return to non-blank after the transition between
    // question finishes.
    expect(
      (await findByTestId(MAIN_SURVEY_SCREEN_VIEW)).props.style.opacity,
    ).toBe(1);
  });

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

export type TestQuestionsSequence = {
  expectCurrentQuestionAsync: (
    getCurrentQuestionTitle: () => string,
  ) => Promise<void>;
  nextButton?: "next" | "pna";
}[];

export async function testQuestionsSequenceAsync({
  renderResults,
  onFinishFn,
  sequence,
}: {
  renderResults: RenderAPI;
  onFinishFn: jest.Mock;
  sequence: TestQuestionsSequence;
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
