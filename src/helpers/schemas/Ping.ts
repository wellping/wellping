import * as z from "zod";

import { PingIdSchema, StreamNameSchema } from "./common";

export const PingSchema = z.object({
  /**
   * The notification ID.
   *
   * Currently, it is just the concatenation `streamName` and the index of (the
   * number of) this particular stream type. For example, the second `"wellbeing"`
   * stream the user received has ID `wellbeing2`.
   */
  id: PingIdSchema,

  /**
   * The time this ping was sent to the user's phone (through system notification).
   */
  notificationTime: z.date(),

  /**
   * The time the user clicked the button (in the app) to start the ping.
   */
  startTime: z.date(),

  /**
   * The time the user finished the ping. If the user did not finish the ping
   * (i.e., they leave the app in the middle of a ping and never come back
   * before the ping expired), `endTime` will be `null`.
   */
  endTime: z.date().nullable(),

  /**
   * The timezone offset for the `notificationTime`, `startTime`, and `endTime`.
   *
   * Learn more about this value here:
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getTimezoneOffset.
   */
  tzOffset: z.number(),

  /**
   * The name of the stream type of this ping.
   */
  streamName: StreamNameSchema,
});
