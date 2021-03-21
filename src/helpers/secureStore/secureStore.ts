import { INSTALLATION_ID } from "../debug";
import { getStudyInfoAsync } from "../studyFile";

export async function getSSKeyAsync(key: string = ""): Promise<string> {
  const studyInfo = await getStudyInfoAsync();
  // Keys provided to SecureStore must not be empty and contain only
  // alphanumeric characters, ".", "-", and "_".
  // Note: We include `INSTALLATION_ID` so that the data will NOT be accessible
  // across different installations (as SecureStore will be accessible across
  // different installations by default on iOS).
  // TODO: `INSTALLATION_ID` will be deprecated. So need to find a better way
  // of doing this (probably use app first launch date?).
  return `WELLPING-${INSTALLATION_ID}-Study_${studyInfo.id}.${key}`;
}
