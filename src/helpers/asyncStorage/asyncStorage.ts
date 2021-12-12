import { getStudyInfoAsync } from "../studyFile";
import { ASYNC_STORAGE_WELLPING_PREFIX } from "./asyncStorageConfig";

export async function getASKeyAsync(key: string = ""): Promise<string> {
  const studyInfo = await getStudyInfoAsync();
  return `${ASYNC_STORAGE_WELLPING_PREFIX}Study_${studyInfo.id}/${key}`;
}
