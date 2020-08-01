import { getStudyFileAsync } from "../configFiles";

export const WELLPING_PREFIX = "@WELLPING:";

export async function getASKeyAsync(key: string = ""): Promise<string> {
  const studyInfo = (await getStudyFileAsync()).studyInfo;
  return `${WELLPING_PREFIX}Study_${studyInfo.id}/${key}`; //TODO: ADD ENCODED URL HERE
}
