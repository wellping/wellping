export const idRegexCheck = (val: string) => /^\w+$/.test(val);
export const idRegexErrorMessage = (name: string) =>
  `${name} can only include letters, numbers, and "_".`;
