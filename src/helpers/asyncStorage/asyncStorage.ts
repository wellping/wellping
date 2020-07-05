import { getSurveyFileAsync } from "../configFiles";

export async function getASKeyAsync(key: string = ""): Promise<string> {
  const studyId = (await getSurveyFileAsync()).studyInfo.id;
  return `@WELLPING:Study_${studyId}/${key}`; //TODO: ADD ENCODED URL HERE
}
