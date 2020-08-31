import * as z from "zod";

import { PingIdSchema, StreamNameSchema } from "./common";

export const PingSchema = z.object({
  id: PingIdSchema,

  notificationTime: z.date(),

  startTime: z.date(),

  endTime: z.date().nullable(),

  tzOffset: z.number(),

  streamName: StreamNameSchema,
});
