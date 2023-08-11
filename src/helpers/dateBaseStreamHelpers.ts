import { StudyInfo } from "@wellping/study-schemas/lib/types";
import { max } from "date-fns";

export function isStudyDateBased(studyInfo: StudyInfo) {
    if (studyInfo && studyInfo.streamsOrder && Array.isArray(studyInfo.streamsOrder) && 
      studyInfo.streamsOrder.length > 0 && studyInfo.streamsOrder[0].date) {
        return true;
    }
    return false;
  }
  
export function getStartDate(studyInfo: StudyInfo, today: Date) {
    if (isStudyDateBased(studyInfo)) {
      let startDate = today;
      for (let i = 0; Array.isArray(studyInfo.streamsOrder) && i < studyInfo.streamsOrder.length; i++){
        const current = new Date(studyInfo.streamsOrder[i].date);
        startDate = max([current, today]);
        //if max is current, then study should start from that date
        if (startDate.getTime() === current.getTime()) {
          return startDate;
        }
      }
    }
    return null;
  }
  
export function getNextDate(studyInfo: StudyInfo, startFrom: Date) {
    return getStartDate(studyInfo, startFrom);
  }
  
export function getEndDate(studyInfo: StudyInfo) {
    if (isStudyDateBased(studyInfo) && Array.isArray(studyInfo.streamsOrder)) {
      return new Date(studyInfo.streamsOrder[studyInfo.streamsOrder.length - 1].date);
    }
    return null;
}

export function formatDateInShort(d: Date) {
    let month = '' + (d.getMonth() + 1),
    day = '' + d.getDate(),
    year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
}
  
export function getNextStreamForDateBasedStudy(studyInfo: StudyInfo, date: string, startIndex: number, userId: string) {
    return null;
}