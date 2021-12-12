import { Answer } from "./answerTypes";
import { UserInstallationInfo } from "./debug";
import { Ping } from "./types";

export type UserData = {
  username: string;
  loginSessionId: string;
  installation: UserInstallationInfo;
};

export interface UploadData {
  user: UserData;
}
export interface AllData extends UploadData {
  pings: Ping[];
  answers: Answer[];
}
export interface UnuploadedData extends UploadData {
  unuploadedPings: Ping[];
  unuploadedAnswers: Answer[];
}

export enum UploadDataType {
  ALL_DATA,
  UNUPLOADED_DATA,
}
export function getUploadDataType(uploadData: UploadData): UploadDataType {
  if ("unuploadedAnswers" in uploadData) {
    return UploadDataType.UNUPLOADED_DATA;
  } else {
    return UploadDataType.ALL_DATA;
  }
}
