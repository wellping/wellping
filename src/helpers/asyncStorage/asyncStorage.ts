import { getStudyFileAsync } from "../configFiles";

export async function getASKeyAsync(key: string = ""): Promise<string> {
  const studyInfo = (await getStudyFileAsync()).studyInfo;
  return `@WELLPING:Study_${studyInfo.id}/${key}`; //TODO: ADD ENCODED URL HERE
}
