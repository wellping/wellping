import * as z from "zod";

export const LoginSchema = z.object({
  username: z.string().nonempty(),
  password: z.string().nonempty(),
  studyFileJsonUrl: z.string().url().nonempty(),
});
