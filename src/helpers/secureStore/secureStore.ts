import { getStudyInfoAsync } from "../studyFile";

export async function getSSKeyAsync(key: string = ""): Promise<string> {
  const studyInfo = await getStudyInfoAsync();
  // Keys provided to SecureStore must not be empty and contain only
  // alphanumeric characters, ".", "-", and "_".
  return `WELLPING-Study_${studyInfo.id}.${key}`;
}
