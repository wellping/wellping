import * as studyFileAsyncStorage from "../helpers/asyncStorage/studyFile";
import { StudyInfo } from "../helpers/types";
import { FunctionSpyInstance } from "./jestHelper";

export const simplePipeInExtraMetaData = (id: string) => id;

export function mockCurrentStudyInfo(
  mockStudyInfo: StudyInfo,
): FunctionSpyInstance<typeof studyFileAsyncStorage.getCurrentStudyInfoAsync> {
  return jest
    .spyOn(studyFileAsyncStorage, "getCurrentStudyInfoAsync")
    .mockImplementation(async () => {
      return mockStudyInfo;
    });
}
