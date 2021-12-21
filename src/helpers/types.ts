import {
  AnswerData,
  AnswersList,
} from "@wellping/study-schemas/lib/answerTypes";
import { Question, QuestionsList } from "@wellping/study-schemas/lib/types";

export type DataValidationFunction = () => boolean;

export interface QuestionScreenProps {
  question: Question;
  loadingCompleted: () => void;
  onDataChange: (data: AnswerData) => void;
  allAnswers: AnswersList;
  allQuestions: QuestionsList;
  pipeInExtraMetaData: (input: string) => string;
  setDataValidationFunction: (func: DataValidationFunction) => void;
}
