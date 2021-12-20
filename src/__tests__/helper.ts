import { StudyInfo, ExtraData } from "wellping-study-file/lib/types";

import * as studyFileAsyncStorage from "../helpers/asyncStorage/studyFile";
import { FunctionSpyInstance } from "./jestHelper";

export const simplePipeInExtraMetaData = (id: string) => id;

/**
 * Some tests might produce "Consider adding an error boundary to your tree to
 * customize error handling behavior." console error. We can safely ignore those
 * error. But to make our tests output clearer, we should wrap those tests (`fnAsync`)
 * inside this function so that this error boundary error will be silenced.
 *
 * See also https://github.com/facebook/react/issues/11098.
 */
export const expectErrorBoundaryConsoleErrorAsync = async (
  fnAsync: () => Promise<void>,
) => {
  const oriConsoleError = console.error;
  const spy = jest.spyOn(console, "error");
  spy.mockImplementation((...error: any[]) => {
    if (
      (error[0] as string).includes(
        "Consider adding an error boundary to your tree to customize error handling behavior",
      )
    ) {
      // Do nothing.
    } else {
      // This means that any other error will still be visible to us.
      oriConsoleError(...error);
    }
  });

  await fnAsync();

  spy.mockRestore();
};

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
