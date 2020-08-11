import {
  fireEvent,
  waitFor,
  waitForElementToBeRemoved,
  RenderAPI,
} from "react-native-testing-library";
import { BaseEntity } from "typeorm";
import waitForExpect from "wait-for-expect";

import { PingEntity } from "../../entities/PingEntity";
import * as HelperPings from "../../helpers/pings";

export const getPingEntity = ({
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

export const TEST_PING_RAW = {
  id: "testPing",
  notificationTime: new Date(),
  startTime: new Date(),
  tzOffset: 0,
  streamName: "testStream",
};
export const TEST_PING = getPingEntity(TEST_PING_RAW);

export const QUESTION_TITLE_TESTID = "questionTitle";
export const NEXT_BUTTON_A11YLABEL = "Next question";
export const PNA_BUTTON_A11YLABEL = "Prefer not to answer the current question";

/**
 * If we are not testing database here, we can mock all database-related
 * function.
 * If we don't do so, the code will be stuck on these functions.
 */
export function mockDatabaseRelatedFunction() {
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
export async function testCurrentQuestionAsync({
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

export async function testQuestionsSequenceAsync({
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
