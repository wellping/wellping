import * as z from "zod";

export const LoginSchema = z.object({
  username: z.string().nonempty(),
  password: z.string().nonempty(),
  studyFileURL: z.string().url().nonempty(),
});
