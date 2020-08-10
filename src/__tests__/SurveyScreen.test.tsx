import React from "react";
import {
  render,
  fireEvent,
  waitFor,
  waitForElementToBeRemoved,
} from "react-native-testing-library";
import waitForExpect from "wait-for-expect";

import SurveyScreen, { SurveyScreenProps } from "../SurveyScreen";
import { PingEntity } from "../entities/PingEntity";
import { QuestionType } from "../helpers/helpers";
import * as HelperPings from "../helpers/pings";

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

/**
 * If we are not testing database here, we can mock all database-related
 * function.
 * If we don't do so, the code will be stuck on these functions.
 */
function mockDatabaseRelatedFunction() {
  // https://stackoverflow.com/a/56565849/2603230
  jest
    .spyOn(SurveyScreen.prototype, "addAnswerToAnswersListAsync")
    .mockImplementation(async () => {});

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
    const { getAllByTestId, getByTestId, getByA11yLabel, toJSON } = render(
      <SurveyScreen {...props} />,
    );

    // Wait for the question to be loaded.
    await waitFor(() => {
      return getAllByTestId("questionTitle").length > 0;
    });

    expect(getByTestId("questionTitle").props.children).toMatchSnapshot(
      "screen 1",
    );

    const nextButton = getByA11yLabel("Next question");
    fireEvent.press(nextButton);

    await waitForElementToBeRemoved(() => getByTestId("questionTitle"));

    expect(toJSON()).toMatchSnapshot("screen 2");

    await waitForExpect(() => {
      expect(onFinishFn).toHaveBeenCalledTimes(1);
    });
  });
});
