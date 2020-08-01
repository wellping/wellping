import { getStudyInfoAsync } from "../configFiles";

export async function getASKeyAsync(key: string = ""): Promise<string> {
  const studyInfo = await getStudyInfoAsync();
  return `@WELLPING:Study_${studyInfo.id}/${key}`; //TODO: ADD ENCODED URL HERE
}
