export const idRegex = /^\w+$/;

/**
 * Notice that `.regex(idRegex)` for `z.string()` is preferred if possible.
 */
export const idRegexCheck = (val: string) => idRegex.test(val);

export const idRegexErrorMessage = (name: string) =>
  `${name} can only include letters, numbers, and "_".`;
