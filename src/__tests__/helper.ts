import * as studyFileAsyncStorage from "../helpers/asyncStorage/studyFile";
import { StudyInfo, ExtraData } from "../helpers/types";
import { FunctionSpyInstance } from "./jestHelper";

export const simplePipeInExtraMetaData = (id: string) => id;

/**
 * Notice that it is possible to e.g. `mockStudyInfo` in an outer `beforeEach`,
 * and then `mockStudyInfo` again in an inner `beforeEach`.
 * The `mockStudyInfo` in the inner `beforeEach` will override the outer one.
 *
 * Reference:
 * - https://stackoverflow.com/a/54166834/2603230
 * - https://jestjs.io/docs/en/setup-teardown#scoping
 * - https://stackoverflow.com/a/52994828/2603230
 */
export function mockCurrentStudyInfo(
  mockStudyInfo: StudyInfo,
): FunctionSpyInstance<typeof studyFileAsyncStorage.getCurrentStudyInfoAsync> {
  return jest
    .spyOn(studyFileAsyncStorage, "getCurrentStudyInfoAsync")
    .mockImplementation(async () => {
      return mockStudyInfo;
    });
}

export function mockCurrentExtraData(
  mockExtraData: ExtraData,
): FunctionSpyInstance<typeof studyFileAsyncStorage.getCurrentExtraDataAsync> {
  return jest
    .spyOn(studyFileAsyncStorage, "getCurrentExtraDataAsync")
    .mockImplementation(async () => {
      return mockExtraData;
    });
}
