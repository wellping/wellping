import * as z from "zod";

import { QuestionsListSchema } from "./Question";
import { QuestionIdSchema } from "./common";

export const StreamsSchema = z.record(QuestionsListSchema);

export const StreamsMetaSchema = z.object({
  startingQuestionIds: z.record(QuestionIdSchema),
});
