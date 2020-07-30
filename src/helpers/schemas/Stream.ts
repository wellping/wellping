import * as z from "zod";

import { QuestionsListSchema } from "./Question";
import { idRegexCheck, idRegexErrorMessage } from "./helper";

export const StreamNameSchema = z.string().refine(idRegexCheck, {
  message: idRegexErrorMessage("Stream name"),
});

export const StreamsSchema = z.record(QuestionsListSchema);
