/**
 * These are common schemas that are used by other schemas.
 * It is moved here to avoid circular dependency.
 */
import * as z from "zod";

import { idRegexCheck, idRegexErrorMessage } from "./helper";

export const StudyIdSchema = z
  .string()
  .nonempty()
  .refine(idRegexCheck, {
    message: idRegexErrorMessage("Study ID"),
  });

export const StreamNameSchema = z
  .string()
  .nonempty()
  .refine(idRegexCheck, {
    message: idRegexErrorMessage("Stream name"),
  });

export const QuestionIdSchema = z
  .string()
  .nonempty()
  .refine(idRegexCheck, {
    message: idRegexErrorMessage("Question ID"),
  });
