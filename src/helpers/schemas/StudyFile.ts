import { differenceInSeconds, isValid, parse, parseJSON } from "date-fns";
import * as z from "zod";

import { StudyFile, StudyInfo, ExtraData } from "../types";
import { StreamsSchema, StreamsStartingQuestionIdsSchema } from "./Stream";
import { StudyIdSchema, StreamNameSchema, ChoicesListSchema } from "./common";

export const WeekStartsOnSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
]);

export const FirebaseConfigSchema = z.record(z.string());
export const FirebaseServerConfigSchema = z.object({
  /**
   * The Firebase config object for the study.
   *
   * See https://firebase.google.com/docs/web/setup#config-object
   */
  config: FirebaseConfigSchema,
});

export const BeiweServerConfigSchema = z.object({
  /**
   * The server URL of Beiwe backend for the study.
   *
   * Example: `"https://beiwe.example.com/"`
   */
  serverUrl: z.string(),
});

export const PlaceholderReplacementValueTreatmentOptionsSchema = z.object({
  decapitalizeFirstCharacter: z
    .object({
      /**
       * If `true`, the first character of the answer data replacing the
       * placeholder will be decapitalized.
       *
       * For example, if the answer is `"Friends"` and variable is `"CONTACT"`
       * and `decapitalizeFirstCharacter` is `true`, `"Why [__CONTACT__]?"`
       * will be replaced by `"Why friends?"`.
       */
      enabled: z.boolean(),

      /**
       * If set, answer data included in it will not be decapitalize.
       */
      excludes: z.array(z.string()).optional(),

      /**
       * If set, only answer data included in it will be decapitalize.
       *
       * If both `excludes` and `includes` are set, `excludes` is ignored.
       */
      includes: z.array(z.string()).optional(),
    })
    .optional(),
});

/**
 * Parse an hour-minute-second string to number of seconds since 00:00:00.
 */
function parseHourMinuteSecondStringToSeconds(
  hourMinuteSecondString: string,
): number {
  const referenceDate = new Date(2010, 0, 1, 0, 0, 0, 0);
  const userDate = parse(hourMinuteSecondString, "HH:mm:ss", referenceDate);

  if (!isValid(userDate)) {
    throw new Error(`parse produces ${userDate}`);
  }
  return differenceInSeconds(userDate, referenceDate);
}
const HourMinuteSecondSchema = z.union([
  z
    .string()
    .superRefine((val, ctx) => {
      try {
        parseHourMinuteSecondStringToSeconds(val);
      } catch (error) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Hour-minute-second string parse error: ${error}.\nPlease format your time in the format "HH:mm:ss".`,
        });
      }
    })
    .transform((val) => parseHourMinuteSecondStringToSeconds(val)),

  // Notice that this could also just be a number.
  // This is mainly added so that we could correctly load the stored study file
  // which is already parsed (transformed) before.
  z.number().int().nonnegative(),
]);

const _StudyInfoSchema = z.object({
  /**
   * The ID of the study.
   *
   * It can only include letters, numbers, and "_".
   */
  id: StudyIdSchema,

  /**
   * The version of the study.
   *
   * https://github.com/wellping/wellping/issues/94
   */
  version: z.string().optional(),

  /**
   * The URL that host this study file (which could be a JSON or a YAML file).
   *
   * The app fetches this URL in the background at every start and loads the
   * downloaded new file at the next start.
   */
  studyFileURL: z.string().url(),

  /**
   * The URL of the dashboard that will be shown to the user on the home page.
   *
   * ---
   *
   * The placeholder `__USERNAME__` will be replaced by the user's username.
   * Notice that you should not return any sensitive data based on this field
   * as it can be changed by anyone.
   * In order to verify the user securely:
   * - If you are using Firebase, you should use the `__FIREBASE_ID_TOKEN__`
   *   placeholder as explained below.
   * - If you are using Beiwe, (A TODO: ITEM).
   *
   * If Firebase is used, the placeholder `__FIREBASE_ID_TOKEN__` will be
   * replaced by the user's Firebase Auth ID token if the user is signed in
   * to Firebase, and "N/A" otherwise.
   *
   * ---
   *
   * The following Placeholders are also provided for your convenience so that
   * you don't have to set up a full back-end server (with Firebase Admin SDK)
   * just to display the user's progress:
   *
   * The placeholder `__PINGS_COMPLETED_OVERALL__` will be replaced by the
   * number of pings the user has completed overall.
   *
   * The placeholder `__PINGS_COMPLETED_THIS_WEEK__` will be replaced by the
   * number of pings the user has completed this week (defined by
   * `weekStartsOn`).
   *
   * The placeholder `__PINGS_COMPLETED_TODAY__` will be replaced by the
   * number of pings the user has completed today.
   */
  dashboardURL: z.string().url().optional(),

  /**
   * The backend server info for the study. Well Ping supports uploading to
   * Firebase or uploading to Beiwe.
   *
   * If Firebase backend is used, `server.firebase` should be defined.
   *
   * If Beiwe backend is used, `server.beiwe` should be defined.
   *
   * If this object is empty (i.e., `server: {}`), you will be able to log in
   * using any username password combination, and no data will be uploaded.
   * This is only intended for testing or demo purposes and should not be used
   * in production. (MARK: NO_SERVER_NOTE)
   *
   * Notice that in theory, both `server.firebase` and `server.beiwe` could be
   * set (meaning that the data will be uploaded to both Beiwe and Firebase).
   * However, such pratice is not thoroughly tested and is not guaranteed to
   * work correctly.
   */
  server: z.object({
    firebase: FirebaseServerConfigSchema.optional(),
    beiwe: BeiweServerConfigSchema.optional(),
  }),

  /**
   * The URL of the study consent form (or any web page you would want the
   * user to see before they begin).
   *
   * This web page will be displayed after the user successfully logs in.
   */
  consentFormUrl: z.string().url(),

  /**
   * The email address that the user could contact for questions regarding the
   * study or the app.
   *
   * If this field is set, a "Contact Staff" button will appear at the top of
   * the screen.
   */
  contactEmail: z.string().email().optional(),

  /**
   * The first day of the week.
   *
   * 0 is Sunday.
   */
  weekStartsOn: WeekStartsOnSchema,

  /**
   * The start date (time) of the study.
   *
   * The first ping will be sent after this time.
   *
   * Timezone in this date string is ignored.
   */
  startDate: z.date(),

  /**
   * The end date (time) of the study.
   *
   * The last ping will be sent before this time.
   *
   * Timezone in this date string is ignored.
   */
  endDate: z.date(),

  /**
   * The time every day that ping notifications will be sent.
   *
   * Notice that the duration between every
   * `pingsFrequency[i].latestPingNotificationTime` and
   * `pingsFrequency[i+1].earliestPingNotificationTime`
   * should be greater than
   * `pingsFrequency[i].expireAfterTime`
   * so that the user will always have enough time to complete the ping no matter
   * what time they receive the ping.
   */
  pingsFrequency: z
    .array(
      z
        .object({
          /**
           * The earliest time that the ping will be sent (inclusive).
           */
          earliestPingNotificationTime: HourMinuteSecondSchema,

          /**
           * The latest time that the ping will be sent (inclusive).
           * If this is not specified, the ping will be sent exactly at
           * `earliestPingNotificationTime`.
           * If this is specified, the ping will be sent at a random time between
           * `earliestPingNotificationTime` and `latestPingNotificationTime`.
           */
          latestPingNotificationTime: HourMinuteSecondSchema.optional(),

          /**
           * A ping will expire after this amount of time (after the notification
           * time).
           *
           * For example, if the user receives a ping notification on 10:00:00AM,
           * and `expireAfterTime` is set to `00:45:00`, the user will no longer
           * be able to complete this ping after 10:45:00AM.
           */
          expireAfterTime: HourMinuteSecondSchema,
        })
        .superRefine((val, ctx) => {
          if (
            val.latestPingNotificationTime === undefined ||
            val.latestPingNotificationTime > val.earliestPingNotificationTime
          ) {
            // All good.
          } else {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message:
                `\`latestPingNotificationTime\` (${val.latestPingNotificationTime}) needs to be greater than ` +
                `\`earliestPingNotificationTime\` (${val.earliestPingNotificationTime}) ` +
                `(or undefined if the notification should be sent at an exact time).`,
            });
          }
        }),
    )
    .min(1),

  /**
   * The question ID of the first question of each stream.
   */
  streamsStartingQuestionIds: StreamsStartingQuestionIdsSchema,

  /**
   * The streams that the user will fill (in this order) every day.
   *
   * For example, if `streamsOrder[0]` is `["dog", "cat", "wolf", "lynx"]`,
   * then on Sunday, if the user opens all four pings they received, they
   * will fill the "dog", "cat", "wolf", and "lynx" stream (in this order).
   * If the user only opens two pings, they will fill the "dog" and "cat"
   * stream (in this order).
   *
   * Notice the numbering here is not affected by the `weekStartsOn` option
   * above (i.e., `0` here is always Sunday).
   *
   * The number of elements each day should be equal to the number of elements
   * in `frequency.hoursEveryday` above.
   */
  streamsOrder: z.object({
    0: z.array(StreamNameSchema), // Sunday
    1: z.array(StreamNameSchema), // Monday
    2: z.array(StreamNameSchema), // Tuesday
    3: z.array(StreamNameSchema), // Wednesday
    4: z.array(StreamNameSchema), // Thursday
    5: z.array(StreamNameSchema), // Friday
    6: z.array(StreamNameSchema), // Saturday
  }),

  /**
   * The stream type(s) for n-th ping(s). The key is the "n" in "n-th ping".
   * This will **replace** the originally sceduled stream type for that ping.
   *
   * For example,
   * ```{json}
   * "streamsForNthPings": {
   *   "1": "demographic",
   *   "10": "interests"
   * }
   * ```
   * means that the user's first ping will be `"demographic"` stream and the
   * user's 10th ping will be `"interests"` stream.
   */
  streamsForNthPings: z
    .record(StreamNameSchema)
    .optional()
    .refine(
      (value) => {
        if (value === undefined) {
          return true;
        }
        for (const nth of Object.keys(value)) {
          // https://stackoverflow.com/a/10834843/2603230
          if (!/^\+?[1-9]\d*$/.test(nth)) {
            // If it is not a positive integer.
            return false;
          }
        }
        return true;
      },
      {
        message:
          "The key in `streamsForNthPings` must be a positive integer as it " +
          'represents the "n" in "n-th ping".',
      },
    ),

  /**
   * The stream that the user will see if there is any error in `streamsOrder`.
   */
  streamInCaseOfError: StreamNameSchema,

  /**
   * The streams that will not be replaced by followup streams
   * (when a YesNo question's `addFollowupStream` is set).
   */
  streamsNotReplacedByFollowupStream: z.array(StreamNameSchema),

  notificationContent: z.object({
    /**
     * The default notification title and body.
     */
    default: z.object({
      title: z.string(),
      body: z.string(),
    }),

    /**
     * If set, the `bonus` content for the notification will be used until
     * the number of survey completed that week is greater than
     * `bonus.numberOfCompletionEachWeek - 1`.
     *
     * "#n_ping#" in `title` and `body` will be replaced by "5 pings" or
     * "1 ping".
     *
     * Example:
     * ```
     * bonus: {
     *    title: "You can earn bonus!",
     *    body: "You are #n_ping# away from the weekly bonus.",
     *    numberOfCompletionEachWeek: 5,
     * },
     * ```
     */
    bonus: z
      .object({
        title: z.string(),
        body: z.string(),
        numberOfCompletionEachWeek: z.number().int().positive(),
      })
      .optional(),
  }),

  /**
   * If `true`, the "Next" button will always be enabled.
   * If `false` or undefined, the "Next" button will only be enabled after the
   * user has interacted with the question.
   */
  alwaysEnableNextButton: z.boolean().optional(),

  /**
   * Special treatments for variable placeholders. The key of each record is
   * the variable name as defined by supported question's `variableName`, or a
   * question ID (if you want to replace the placeholder with a previous
   * question's answer).
   */
  specialVariablePlaceholderTreatments: z
    .record(PlaceholderReplacementValueTreatmentOptionsSchema)
    .optional(),

  /**
   * Show an alert each time the app launches.
   */
  specialAlertOnLaunch: z
    .object({
      title: z.string().default(""),
      message: z.string(),
      buttonText: z.string().default("Close"),
    })
    .optional(),
});
export const StudyInfoSchema = (__DEV__
  ? _StudyInfoSchema.strict()
  : _StudyInfoSchema
)
  .refine((data) => data.endDate > data.startDate, {
    message: "`endDate` needs to be later than `startDate`.",
  })
  .refine(
    (data) => {
      for (const dayStreams of Object.values(data.streamsOrder)) {
        if (dayStreams.length !== data.pingsFrequency.length) {
          return false;
        }
      }
      return true;
    },
    {
      message:
        "The number of each day's streams in `streamsOrder` needs to be equal " +
        "to the length of `pingsFrequency`.",
    },
  );
// TODO: REFINE IF streams in e.g. streamsOrder, etc. is found in `streamsStartingQuestionIds`'s key

export const ExtraDataSchema = z.object({
  reusableChoices: z.record(ChoicesListSchema).optional(),
});

export const StudyFileSchema = z.object({
  studyInfo: StudyInfoSchema,
  streams: StreamsSchema,
  extraData: ExtraDataSchema,
});
// TODO: REFINE IF `streams` matches `streamsStartingQuestionIds`'s key

// https://stackoverflow.com/a/13104500/2603230
const convertSpecialTypesInStudyInfo = (studyInfoRawJson: any) => {
  // We have to parse the dates as JSON stores dates as strings.
  if (studyInfoRawJson?.startDate) {
    studyInfoRawJson.startDate = parseJSON(studyInfoRawJson.startDate);
  }
  if (studyInfoRawJson?.endDate) {
    studyInfoRawJson.endDate = parseJSON(studyInfoRawJson.endDate);
  }
};

export function parseJsonToStudyInfo(rawJson: any): StudyInfo {
  convertSpecialTypesInStudyInfo(rawJson);
  return StudyInfoSchema.parse(rawJson);
}

export function parseJsonToExtraData(rawJson: any): ExtraData {
  return ExtraDataSchema.parse(rawJson);
}

export function parseJsonToStudyFile(rawJson: any): StudyFile {
  convertSpecialTypesInStudyInfo(rawJson?.studyInfo);
  return StudyFileSchema.parse(rawJson);
}
