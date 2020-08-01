import * as z from "zod";

import { Streams } from "../types";
import { QuestionsListSchema } from "./Question";
import { QuestionIdSchema } from "./common";

export const StreamsSchema = z.record(QuestionsListSchema);

export const StreamsStartingQuestionIdsSchema = z.record(QuestionIdSchema);

export function parseJsonToStreams(rawJson: any): Streams {
  return StreamsSchema.parse(rawJson);
}
