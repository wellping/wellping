import React from "react";
import {
  render,
  fireEvent,
  A11yAPI,
  FireEventAPI,
  waitFor,
  RenderAPI,
} from "react-native-testing-library";

import SurveyScreen, { SurveyScreenProps } from "../SurveyScreen";
import { PingEntity } from "../entities/PingEntity";

const renderSurveyScreen = async (props: SurveyScreenProps) => {
  const renderResults = render(<SurveyScreen {...props} />);
  return renderResults;
};

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

  const { toJSON } = await renderSurveyScreen({
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
  });

  expect(JSON.stringify(toJSON())).toContain("CRITICAL ERROR");

  expect(toJSON()).toMatchSnapshot();
});
