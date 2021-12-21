import {
  QuestionId,
  PlaceholderReplacementValueTreatmentOptions,
  StudyInfo,
} from "@wellping/study-file/lib/types";
import { addMinutes } from "date-fns";
import * as Crypto from "expo-crypto";

export {
  QuestionType,
  QUESTION_TYPES,
  NON_USER_QUESTION_TYPES,
} from "@wellping/study-file/lib/helpers";

// This is mostly for Beiwe.
export async function getHashedPasswordAsync(
  password: string,
): Promise<string> {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    password,
    {
      encoding: Crypto.CryptoEncoding.BASE64,
    },
  );
}

// This is mostly for Beiwe.
export function base64ToBase64URL(input: string): string {
  return input.replace(/\+/g, "-").replace(/\//g, "_");
}

export const decapitalizeFirstCharacter = (s: string): string => {
  return s.charAt(0).toLowerCase() + s.slice(1);
};

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
    m = re.exec(s)!;
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

const _treatPlaceholderReplacementValue = (
  value: string,
  treatment?: PlaceholderReplacementValueTreatmentOptions,
): string => {
  if (treatment === undefined) {
    return value;
  }

  let treatedValue = value;

  let shouldDecap = false;
  const decapOptions = treatment.decapitalizeFirstCharacter;
  if (decapOptions && decapOptions.enabled) {
    if (decapOptions.includes) {
      if (decapOptions.includes.includes(value)) {
        shouldDecap = true;
      }
    } else if (decapOptions.excludes) {
      if (!decapOptions.excludes.includes(value)) {
        shouldDecap = true;
      }
    } else {
      shouldDecap = true;
    }
  }

  if (shouldDecap) {
    treatedValue = decapitalizeFirstCharacter(treatedValue);
  }

  return treatedValue;
};

export const treatPlaceholderReplacementValue = (
  key: string,
  value: string,
  studyInfo: StudyInfo,
): string => {
  return _treatPlaceholderReplacementValue(
    value,
    // https://stackoverflow.com/a/58780897/2603230
    studyInfo.specialVariablePlaceholderTreatments?.[key],
  );
};

// https://stackoverflow.com/a/2450976/2603230
export function shuffle(array: any[]): any[] {
  let currentIndex = array.length,
    temporaryValue: any,
    randomIndex: number;

  // While there remain elements to shuffle...
  while (currentIndex !== 0) {
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

/**
 * Use local time zone for date. In other words, ignore the timezone suffix of
 * the date.
 */
export function ignoreTimeObjectTimezone(date: Date): Date {
  return addMinutes(date, new Date().getTimezoneOffset());
}
