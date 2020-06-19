import { QuestionType } from "./helpers";

export type StreamName = string;

export type QuestionId = string;

export interface Question {
  id: QuestionId;
  type: QuestionType;
  question: string;
  next?: QuestionId | null;
}

export interface SliderQuestion extends Question {
  type: QuestionType.Slider;
  slider: [string, string]; // [left, right]
  defaultValue?: number;
  defaultValueFromQuestionId?: QuestionId;
}

export type Choice = {
  key: string;
  value: string;
};

export interface ChoicesQuestion extends Question {
  choices: Choice[];
  specialCasesStartId?: {
    [questionId: string /* actually QuestionId */]: QuestionId;
    _pna?: QuestionId;
  };
  randomizeChoicesOrder?: boolean;
  randomizeExceptForChoiceIds?: string[];
}

export interface ChoicesWithSingleAnswerQuestion extends ChoicesQuestion {
  type: QuestionType.ChoicesWithSingleAnswer;
}

export interface ChoicesWithMultipleAnswersQuestion extends ChoicesQuestion {
  type: QuestionType.ChoicesWithMultipleAnswers;
}

export interface YesNoQuestion extends Question {
  type: QuestionType.YesNo;
  branchStartId?: {
    yes?: QuestionId;
    no?: QuestionId;
  };
  // Currently only `yes` is supported and also can only followup after 3 days and 7 days with the same stream.
  addFollowupStream?: {
    yes?: StreamName;
    // TODO: no?: StreamName;
  };
}

export interface MultipleTextQuestion extends Question {
  // `id` will store the number of text fields answered.
  type: QuestionType.MultipleText;
  eachId: QuestionId;
  placeholder?: string;
  choices?: "NAMES" | Choice[];
  forceChoice?: boolean;
  max: number;
  maxMinus?: QuestionId; // The max number of text field will be `max` minus the number of text the participant entered in `maxMinus` question.
  repeatedItemStartId?: QuestionId;
  fallbackItemStartId?: QuestionId; // This is used when the user does not enter any name or select prefer not to answer. Note that this has to exists somewhere else. If it is `null`, we will go to `next` directly.
  indexName: string;
  variableName: string;
}

export interface HowLongAgoQuestion extends Question {
  type: QuestionType.HowLongAgo;
}

export interface BranchQuestion extends Question {
  // This is not actually a question (it will not be displayed to the user)
  type: QuestionType.Branch;
  condition: {
    questionId: QuestionId;
    questionType:
      | QuestionType.MultipleText
      | QuestionType.ChoicesWithSingleAnswer;
    compare: "equal";
    target: number | string;
  };
  branchStartId: {
    true?: QuestionId;
    false?: QuestionId;
  };
}

export interface BranchWithRelativeComparisonQuestion extends Question {
  // This is not actually a question (it will not be displayed to the user)
  type: QuestionType.BranchWithRelativeComparison;
  branchStartId: {
    [questionId: string /* actually QuestionId */]: QuestionId;
  };
}

export interface QuestionsList {
  [id: string]: Question;
}

export type Streams = {
  [stream: string /* actually StreamName */]: QuestionsList;
};

export type StreamStartingQuestionIds = {
  [stream: string /* actually StreamName */]: QuestionId;
};

export type StudyID = string;

export type StudyInfo = {
  id: StudyID;
  consentFormUrl: string;
  contactEmail?: string;
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 is Sunday
  startDate: Date; // First survey will be sent after this time.
  endDate: Date; // Last survey will be sent before this time.
  frequency: {
    hoursEveryday: number[];

    // Randomly add a number of minutes between `min` to `max` minutes (inclusive) to the notification time.
    randomMinuteAddition: {
      min: number;
      max: number;
    };
  };
  streamsOrder: {
    // Notice the numbering here is not affected by the `weekStartsOn` option above.
    // The number of elements each day should be equal to the number of elements in `frequency.hoursEveryday` above.
    0: StreamName[]; // Sunday
    1: StreamName[]; // Monday
    2: StreamName[]; // Tuesday
    3: StreamName[]; // Wednesday
    4: StreamName[]; // Thursday
    5: StreamName[]; // Friday
    6: StreamName[]; // Saturday
  };

  // A stream that the user will see by default if there is any error in `streamsOrder`.
  streamInCaseOfError: StreamName;

  // A list of streams that will not be replaced by followup streams
  // (when a YesNo question's `addFollowupStream` is set).
  streamsNotReplacedByFollowupStream?: StreamName[];

  notificationContent: {
    default: {
      title: string;
      body: string;
    };
    // We will use `bonus` content for the notification until the number of survey completed that week is greater than `bonus.numberOfCompletionEachWeek - 1`.
    // `#n_ping#` will turn into "5 pings" or "1 ping".
    bonus: {
      title: string;
      body: string;
      numberOfCompletionEachWeek: number;
    };
  };
  serverURL: string;
};

export type SurveyFile = {
  studyInfo: StudyInfo;
  meta: {
    startingQuestionIds: StreamStartingQuestionIds;
  };
  streams: Streams;
};

export type Names = string[];
