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

test("non-existent startingQuestionId", async () => {
  const onFinishFn = jest.fn();

  const props: SurveyScreenProps = {
    questions: {},
    startingQuestionId: "na",
    ping: getPingEntity({
      id: "testPing",
      notificationTime: new Date(),
      startTime: new Date(),
      tzOffset: 0,
      streamName: "testStream",
    }),
    previousState: null,
    onFinish: onFinishFn,
  };
  const { toJSON } = render(<SurveyScreen {...props} />);

  expect(JSON.stringify(toJSON())).toContain("CRITICAL ERROR");

  expect(toJSON()).toMatchSnapshot();
});

test("single question", async () => {
  const onFinishFn = jest.fn();

  const ping = getPingEntity({
    id: "testPing",
    notificationTime: new Date(),
    startTime: new Date(),
    tzOffset: 0,
    streamName: "testStream",
  });

  // https://stackoverflow.com/a/56565849/2603230
  jest
    .spyOn(SurveyScreen.prototype, "addAnswerToAnswersListAsync")
    .mockImplementation(async (question, options) => {});

  jest
    .spyOn(HelperPings, "addEndTimeToPingAsync")
    .mockImplementation(async () => {
      ping.endTime = new Date();
      return ping;
    });

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
    ping,
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
