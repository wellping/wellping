import { getInstallationIDAsync } from "../debug";
import { getStudyInfoAsync } from "../studyFile";

export async function getSSKeyAsync(key: string = ""): Promise<string> {
  const studyInfo = await getStudyInfoAsync();
  // Keys provided to SecureStore must not be empty and contain only
  // alphanumeric characters, ".", "-", and "_".
  // Note: We include an "installation ID" so that the data will NOT be accessible
  // across different installations (as SecureStore will be accessible across
  // different installations by default on iOS).
  return `WELLPING-${await getInstallationIDAsync()}-Study_${
    studyInfo.id
  }.${key}`;
}
