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

/**
 * This is a workaround such that the error message for missing it will be
 * > Issue #0: invalid_type at
 * > Required
 * instead of the more confusing
 * > Issue #0: invalid_union at
 * > Invalid input
 */
export const CustomNullable = (Schema: z.ZodType<any, any>, path: string[]) =>
  Schema.nullable().refine((val) => {
    if (val === undefined) {
      z.null().parse(val, { path });
    }
    return true;
  });

export const QuestionIdSchemaNullable = (path: string[]) =>
  CustomNullable(QuestionIdSchema, path);
