import { QuestionId } from "./types";

export enum QuestionType {
  Slider = "slider",
  ChoicesWithSingleAnswer = "choicesWithSingleAnswer",
  ChoicesWithMultipleAnswers = "choicesWithMultipleAnswers",
  YesNo = "yesNo",
  MultipleText = "multipleText",
  HowLongAgo = "howLongAgo",
  Branch = "branch",
  BranchWithRelativeComparison = "branchWithRelativeComparison",
}

export const decapitalizeFirstCharacter = (s: string): string => {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

export const withVariable = (varName: string) => `[__${varName}__]`;

export const withPreviousAnswer = (questionId: QuestionId) =>
  `{PREV:${questionId}}`;

export const replacePreviousAnswerPlaceholdersWithActualContent = (
  s: string,
  getAnswerFromQuestionId: (questionId: QuestionId) => string | null,
) => {
  let output = s;

  // https://stackoverflow.com/a/6323598/2603230
  const re = /\{PREV:(.*?)\}/g;
  let m: RegExpExecArray;

  do {
    m = re.exec(s);
    if (m) {
      const prevAnswer = getAnswerFromQuestionId(m[1]);
      if (prevAnswer) {
        // https://stackoverflow.com/a/56136657/2603230
        output = output.split(m[0]).join(prevAnswer);
      }
    }
  } while (m);

  return output;
};

// https://stackoverflow.com/a/2450976/2603230
export function shuffle(array: any[]): any[] {
  var currentIndex = array.length,
    temporaryValue: any,
    randomIndex: number;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}
