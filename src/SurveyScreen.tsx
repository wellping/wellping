import { addDays } from "date-fns";
import React from "react";
import { Button, Text, View, ScrollView, Dimensions } from "react-native";

import { _DEBUG_CONFIGS } from "../config/debug";
import {
  ChoicesWithSingleAnswerAnswerEntity,
  MultipleTextAnswerEntity,
  SliderAnswerEntity,
  AnswerEntity,
} from "./entities/AnswerEntity";
import { PingEntity } from "./entities/PingEntity";
import {
  AnswersList,
  QuestionScreenProps,
  AnswerData,
  YesNoAnswerData,
  MultipleTextAnswerData,
  ChoicesWithSingleAnswerAnswerData,
  ChoicesWithMultipleAnswersAnswerData,
} from "./helpers/answerTypes";
import { insertAnswerAsync } from "./helpers/answers";
import { uploadDataAsync } from "./helpers/apiManager";
import {
  getFuturePingsQueue,
  enqueueToFuturePingQueue,
} from "./helpers/asyncStorage/futurePings";
import { storePingStateAsync } from "./helpers/asyncStorage/pingState";
import {
  getNonCriticalProblemTextForUser,
  getCriticalProblemTextForUser,
} from "./helpers/debug";
import {
  QuestionType,
  withVariable,
  replacePreviousAnswerPlaceholdersWithActualContent,
  decapitalizeFirstCharacter,
  NON_USER_QUESTION_TYPES,
} from "./helpers/helpers";
import { addEndTimeToPingAsync } from "./helpers/pings";
import {
  Question,
  ChoicesWithSingleAnswerQuestion,
  YesNoQuestion,
  MultipleTextQuestion,
  QuestionsList,
  QuestionId,
  BranchQuestion,
  BranchWithRelativeComparisonQuestion,
  ChoicesQuestion,
  StreamName,
} from "./helpers/types";
import ChoicesQuestionScreen from "./questionScreens/ChoicesQuestionScreen";
import HowLongAgoQuestionScreen from "./questionScreens/HowLongAgoQuestion";
import MultipleTextQuestionScreen from "./questionScreens/MultipleTextQuestionScreen";
import SliderQuestionScreen from "./questionScreens/SliderQuestionScreen";

/**
 * Any data that is associated with the question.
 * It is used by `pipeInExtraMetaData`.
 */
type ExtraData = { [key: string]: any };

type CurrentQuestionData = {
  /**
   * The question ID.
   * If `null`, it means that there is no current question.
   */
  questionId: QuestionId | null;

  /**
   * The extra data associated with this question.
   */
  extraData: ExtraData;
};

type NextQuestionData = CurrentQuestionData & {
  /**
   * Unlike `CurrentData`, it cannot be `null` because in that case this
   * `NextData` should not exist at all.
   */
  questionId: QuestionId;
};

export interface SurveyScreenProps {
  /**
   * The questions in this ping.
   */
  questions: QuestionsList;

  /**
   * The question ID of the first question in `questions`.
   */
  startingQuestionId: QuestionId;

  /**
   * The current ping.
   */
  ping: PingEntity;

  /**
   * The previously stored state.
   * It is used to automatically put the user back to where they left when they
   * leave the app in the middle of the ping and come back later.
   */
  previousState: SurveyScreenState | null;

  /**
   * The function to call when the current ping is completed.
   */
  onFinish: (finishedPing: PingEntity) => Promise<void>;
}

export interface SurveyScreenState {
  /**
   * The question data of the current question that the user is answering.
   */
  currentQuestionData: CurrentQuestionData;

  /**
   * A stack of questions (and extra data for each of those questions) that
   * will be popped once the current question's next is `null`.
   *
   * When `nextQuestionsDataStack` is empty and the current question's `next`
   * is `null`, the current ping ends.
   *
   * For example, if `[a, b, c]` is in `nextStack` and the current question's
   * `next` is `null`, then the next question will be `c`.
   * If `[]` is in `nextStack` and the current question's `next` is `null`,
   * then the current ping ends.
   */
  nextQuestionsDataStack: NextQuestionData[];

  /**
   * All current answers.
   */
  answers: AnswersList;

  /**
   * The last upload time.
   */
  lastUploadDate: Date | null;
}

export default class SurveyScreen extends React.Component<
  SurveyScreenProps,
  SurveyScreenState
> {
  constructor(props: SurveyScreenProps) {
    super(props);

    if (props.previousState) {
      this.state = props.previousState;
    } else {
      this.state = {
        currentQuestionData: {
          questionId: props.startingQuestionId,
          extraData: {},
        },
        nextQuestionsDataStack: [],
        answers: {},
        lastUploadDate: null,
      };
    }
  }

  componentDidMount() {
    storePingStateAsync(this.props.ping.id, this.state);
  }

  /**
   * Returns a string where all placeholders in `input` are replaced with
   * actual data.
   * A warning text will replace a placeholder if that piece of data does
   * not exists.
   *
   * Supports:
   * - Replacing variable placeholders with variables in `extraData`.
   * - Replacing answer placeholders with actual answers.
   */
  replacePlaceholders(
    input: string,
    state: SurveyScreenState = this.state,
  ): string {
    const { questions } = this.props;
    const { currentQuestionData, answers } = state;

    let output = input;
    for (const [key, value] of Object.entries(currentQuestionData.extraData)) {
      let newValue = value;

      // TODO: MAKE THIS CUSTOMIZABLE
      if (key === "TARGET_CATEGORY") {
        let capValue = value;
        if (capValue !== "PHE") {
          capValue = decapitalizeFirstCharacter(capValue);
        }
        newValue = `your ${capValue}`;
      }

      // https://stackoverflow.com/a/56136657/2603230
      output = output.split(withVariable(key)).join(newValue);
    }

    output = replacePreviousAnswerPlaceholdersWithActualContent(
      output,
      (questionId) => {
        const question = questions[questionId];
        const answer = answers[questionId];
        if (!question) {
          return null;
        }
        switch (question.type) {
          case QuestionType.ChoicesWithSingleAnswer: {
            const csaQuestion = questions[
              questionId
            ] as ChoicesWithSingleAnswerQuestion;

            const csaAnswer = answer as ChoicesWithSingleAnswerAnswerEntity;
            if (csaAnswer == null) {
              return getNonCriticalProblemTextForUser(
                `csaAnswer.data (from ${question.id}) == null`,
              );
            }

            const csaAnswerChoiceValue = csaAnswer.data?.value;
            if (csaAnswerChoiceValue == null) {
              return getNonCriticalProblemTextForUser(
                `csaAnswerChoiceValue (from ${csaQuestion.id}) == null`,
              );
            }

            return decapitalizeFirstCharacter(csaAnswerChoiceValue);
          }

          default:
            return null;
        }
      },
    );

    return output;
  }

  /**
   * Returns a new stack of questions based on the previous question, its answer,
   * its extra data, and all current answers.
   *
   * The last element (i.e. `pop()`) of the returned array is the immediate next
   * question, while the rest should be added to the `nextQuestionsDataStack`.
   *
   * If the returned array is empty, it means that no question directly follows
   * this question, and we should pop a question from `nextQuestionsDataStack`.
   */
  getNewNextQuestionsDataStack({
    prevQuestion,
    prevAnswer,
    prevExtraData,
    answers,
    prevState,
  }: {
    prevQuestion: Question;
    // When the question is a branching question, `prevAnswer` can be undefined.
    prevAnswer?: AnswerEntity;
    prevExtraData: ExtraData;
    answers: AnswersList;
    prevState: SurveyScreenState;
  }): NextQuestionData[] {
    /**
     * The question(s) that cuts in line and shows before the actual `next`.
     * The user will "jump" to (and follow through until a question's `next`
     * is null) before going to `nextQuestionData`.
     *
     * If it is non-empty, the user will go to the first element. The rest of
     * the elements as well as `nextQuestionData` will be pushed to the
     * original `nextQuestionsDataStack`.
     */
    const jumpQuestionsDataStack: NextQuestionData[] = [];

    /**
     * The next question that the user will go to after the `jumpQuestionData`
     * sequence is done.
     *
     * If `questionId` is `null`, `nextQuestionsDataStack` will be popped and
     * we will go to that question. If `nextQuestionsDataStack` is empty, the
     * ping has ended.
     */
    const nextQuestionData: CurrentQuestionData = {
      questionId: prevQuestion.next,
      extraData: prevExtraData,
    };

    /**
     * Does appropriate actions when facing a conditional question ID.
     * See inline comments for more explanations.
     */
    const considerConditionalQuestionId = (
      conditionalQuestionId: QuestionId | null | undefined,
    ) => {
      if (conditionalQuestionId === undefined) {
        // Do nothing, because we will continue to this question's `next`
        // as before.
      } else if (conditionalQuestionId === null) {
        // If a question ID in any fields besides the `next` field is
        // intentionally set to (and is allowed to set to) `null`, it means
        // that we should treat it as if `next` is set to `null` when that
        // field is used. In other words, the original `next` is ignored.
        nextQuestionData.questionId = null;
      } else {
        jumpQuestionsDataStack.push({
          questionId: conditionalQuestionId,
          extraData: prevExtraData,
        });
      }
    };

    const handleYesNoQuestion = (ynQ: YesNoQuestion, ynD: YesNoAnswerData) => {
      if (ynQ.branchStartId) {
        const jumpQuestionId = ynD.value
          ? ynQ.branchStartId.yes
          : ynQ.branchStartId.no;
        considerConditionalQuestionId(jumpQuestionId);
      }

      // Set up follow-up streams.
      if (
        ynD.value === true &&
        ynQ.addFollowupStream &&
        ynQ.addFollowupStream.yes
      ) {
        const futureStreamName: StreamName = ynQ.addFollowupStream.yes;

        // TODO: ADD SUPPORT TO CUSTOMIZE DATE AFTER
        getFuturePingsQueue().then((futurePings) => {
          if (futurePings.length === 0) {
            enqueueToFuturePingQueue({
              afterDate: addDays(new Date(), 3),
              streamName: futureStreamName,
            }).then(() => {
              enqueueToFuturePingQueue({
                afterDate: addDays(new Date(), 7),
                streamName: futureStreamName,
              });
            });
          }
        });
      }
    };

    const handleMultipleTextQuestion = (
      mtQ: MultipleTextQuestion,
      mtD: MultipleTextAnswerData,
    ) => {
      const valuesLength = mtD.value.length;

      if (valuesLength === 0 || mtQ.repeatedItemStartId === undefined) {
        return;
      }

      // Reversed for because we want to go to the `0`th first, then `1`st,
      // etc.
      for (let i = valuesLength - 1; i >= 0; i--) {
        jumpQuestionsDataStack.push({
          questionId: mtQ.repeatedItemStartId,
          extraData: {
            [mtQ.variableName]: mtD.value[i],
            [mtQ.indexName]: i + 1,
          },
        });
      }
    };

    const handleChoicesQuestions = (
      cQ: ChoicesQuestion,
      cD:
        | ChoicesWithSingleAnswerAnswerData
        | ChoicesWithMultipleAnswersAnswerData,
    ) => {
      const specialCasesStartId = cQ.specialCasesStartId;
      if (!specialCasesStartId) {
        return;
      }

      const specialCase = specialCasesStartId.find((eachSpecialCase) => {
        if (cQ.type === QuestionType.ChoicesWithSingleAnswer) {
          const csaAnswerData = cD as ChoicesWithSingleAnswerAnswerData;
          return eachSpecialCase[0] === csaAnswerData.value;
        } else if (cQ.type === QuestionType.ChoicesWithMultipleAnswers) {
          const cmaAnswerData = cD as ChoicesWithMultipleAnswersAnswerData;
          // If this special choice key is selected.
          return cmaAnswerData.value.includes([eachSpecialCase[0], true]);
        }
      });

      const specialNextQuestionId = specialCase ? specialCase[1] : undefined;
      considerConditionalQuestionId(specialNextQuestionId);
    };

    const handleBranchQuestion = (bQ: BranchQuestion) => {
      let selectedBranchId = bQ.branchStartId.false;

      switch (bQ.condition.questionType) {
        case QuestionType.MultipleText: {
          const targetQuestionAnswer = answers[
            this.replacePlaceholders(bQ.condition.questionId, prevState)
          ] as MultipleTextAnswerEntity;
          if (targetQuestionAnswer && targetQuestionAnswer.data) {
            if (
              targetQuestionAnswer.data.value.length === bQ.condition.target
            ) {
              selectedBranchId = bQ.branchStartId.true;
            }
          }
          break;
        }

        case QuestionType.ChoicesWithSingleAnswer: {
          const csaQuestionAnswer = answers[
            this.replacePlaceholders(bQ.condition.questionId, prevState)
          ] as ChoicesWithSingleAnswerAnswerEntity;
          if (csaQuestionAnswer && csaQuestionAnswer.data) {
            if (csaQuestionAnswer.data?.value === bQ.condition.target) {
              selectedBranchId = bQ.branchStartId.true;
            }
          }
          break;
        }
      }

      considerConditionalQuestionId(selectedBranchId);
    };

    const handleBranchWithRelativeComparison = (
      bwrcQuestion: BranchWithRelativeComparisonQuestion,
    ) => {
      let nextQuestionId = null;
      let curMaxValue = -999;
      for (const comparingQuestionId of Object.keys(
        bwrcQuestion.branchStartId,
      )) {
        // TODO: SUPPORT OTHER QUSTION TYPES.
        const comparingQuestionAnswer =
          (answers[comparingQuestionId] as SliderAnswerEntity).data?.value ||
          -1;
        if (comparingQuestionAnswer > curMaxValue) {
          nextQuestionId = bwrcQuestion.branchStartId[comparingQuestionId];
          curMaxValue = comparingQuestionAnswer;
        }
      }

      considerConditionalQuestionId(nextQuestionId);
    };

    if (NON_USER_QUESTION_TYPES.includes(prevQuestion.type)) {
      // Handle branching questions.
      switch (prevQuestion.type) {
        case QuestionType.Branch:
          handleBranchQuestion(prevQuestion as BranchQuestion);
          break;

        case QuestionType.BranchWithRelativeComparison:
          handleBranchWithRelativeComparison(
            prevQuestion as BranchWithRelativeComparisonQuestion,
          );
          break;

        default:
          break;
      }
    } else {
      if (prevAnswer === undefined) {
        throw new Error("prevAnswer !== undefined but it is a user question!");
      }

      if (
        prevAnswer.preferNotToAnswer &&
        prevQuestion.fallbackNext?.preferNotToAnswer !== undefined
      ) {
        nextQuestionData.questionId =
          prevQuestion.fallbackNext.preferNotToAnswer;
      } else if (
        prevAnswer.nextWithoutOption &&
        prevQuestion.fallbackNext?.nextWithoutAnswering !== undefined
      ) {
        nextQuestionData.questionId =
          prevQuestion.fallbackNext.nextWithoutAnswering;
      }

      if (prevAnswer.data !== null) {
        switch (prevQuestion.type) {
          case QuestionType.YesNo:
            handleYesNoQuestion(
              prevQuestion as YesNoQuestion,
              prevAnswer.data as YesNoAnswerData,
            );
            break;

          case QuestionType.MultipleText:
            handleMultipleTextQuestion(
              prevQuestion as MultipleTextQuestion,
              prevAnswer.data as MultipleTextAnswerData,
            );
            break;

          case QuestionType.ChoicesWithMultipleAnswers:
          case QuestionType.ChoicesWithSingleAnswer:
            handleChoicesQuestions(
              prevQuestion as ChoicesQuestion,
              prevAnswer.data as
                | ChoicesWithSingleAnswerAnswerData
                | ChoicesWithMultipleAnswersAnswerData,
            );
            break;

          default:
            // For other question types, there isn't anything special we need to
            // handle.
            break;
        }
      }
    }

    const newNextQuestionsStack: NextQuestionData[] = jumpQuestionsDataStack;
    if (nextQuestionData.questionId !== null) {
      // We insert `nextQuestionData` at the start of the array because it
      // should be the last thing that gets popped from this stack.
      newNextQuestionsStack.unshift(nextQuestionData as NextQuestionData);
    } else {
      // If nextQuestionData.questionId is `null`, it doesn't need to be in this
      // stack.
    }
    return newNextQuestionsStack;
  }

  /**
   * Goes to the next question.
   */
  onNextSelect() {
    // Reset this so that the new `QuestionScreen` can set it.
    this.dataValidationFunction = null;

    const { questions, ping } = this.props;

    const setStateCallback = () => {
      storePingStateAsync(ping.id, this.state).then(() => {
        const { lastUploadDate } = this.state;
        const currentTime = new Date();
        if (
          lastUploadDate == null ||
          // Only upload at most half a minute
          currentTime.getTime() - lastUploadDate.getTime() > 30 * 1000
        ) {
          this.setState({ lastUploadDate: currentTime });
          uploadDataAsync();
        }
      });

      const {
        currentQuestionData: { questionId: currentQuestionid },
      } = this.state;

      if (
        currentQuestionid &&
        (questions[currentQuestionid].type === QuestionType.Branch ||
          questions[currentQuestionid].type ===
            QuestionType.BranchWithRelativeComparison)
      ) {
        // Directly calculates and goes to next if it's a branching question as
        // they are not actually a user question.
        this.onNextSelect();
      }

      if (currentQuestionid == null) {
        // There is no more question to answer.
        addEndTimeToPingAsync(ping.id, new Date()).then((newPing) => {
          this.props.onFinish(newPing);
        });
      }
    };

    this.setState((prevState) => {
      const {
        currentQuestionData: {
          questionId: prevQuestionId,
          extraData: prevExtraData,
        },
        answers,
        nextQuestionsDataStack: prevNextQuestionsDataStack,
      } = prevState;

      if (prevQuestionId === null) {
        throw new Error("prevQuestionId === null");
      }

      const prevQuestion = questions[prevQuestionId];
      const prevAnswer =
        answers[this.getRealQuestionId(prevQuestionId, prevState)];

      const newNextQuestionsStack = this.getNewNextQuestionsDataStack({
        prevQuestion,
        prevAnswer,
        prevExtraData,
        answers,
        prevState,
      });

      if (newNextQuestionsStack.length === 0) {
        // There isn't any question following the previous question, so we want
        // to pop from the stack if there is something left in the stack.
        let nextQuestionData!: CurrentQuestionData;
        if (prevNextQuestionsDataStack.length > 0) {
          nextQuestionData = prevNextQuestionsDataStack.pop()!;
        } else {
          // If there isn't anything left in stack, `questionId` will be `null`,
          // indicating that the ping has ended.
          nextQuestionData = {
            questionId: null,
            extraData: {},
          };
        }
        return {
          currentQuestionData: nextQuestionData,
          nextQuestionsDataStack: prevNextQuestionsDataStack,
        };
      } else {
        // We pop the `jumpQuestionsDataStack` to find what question we should
        // immediately go.
        const immediateNext = newNextQuestionsStack.pop()!;
        return {
          currentQuestionData: immediateNext,
          nextQuestionsDataStack: [
            // We add any additional `jumpQuestionsDataStack` on top of the
            // existing stack.
            ...prevNextQuestionsDataStack,
            ...newNextQuestionsStack,
          ],
        };
      }
    }, setStateCallback);
  }

  getRealQuestionId(
    questionId: QuestionId,
    state: SurveyScreenState = this.state,
  ): string {
    return this.replacePlaceholders(questionId, state);
  }

  async addAnswerToAnswersListAsync(
    question: Question,
    {
      preferNotToAnswer = false,
      nextWithoutOption = false,
      data = null,
      lastUpdateDate = new Date(),
    }: {
      preferNotToAnswer?: boolean;
      nextWithoutOption?: boolean;
      data?: AnswerData | null;
      lastUpdateDate?: Date;
    },
  ): Promise<void> {
    const realQuestionId = this.getRealQuestionId(question.id);

    const answer = await insertAnswerAsync({
      ping: this.props.ping,
      question,
      realQuestionId,
      preferNotToAnswer,
      nextWithoutOption,
      data,
      lastUpdateDate,
    });

    await new Promise((resolve, reject) => {
      this.setState(
        (prevState) => ({
          answers: {
            ...prevState.answers,
            [realQuestionId]: answer,
          },
        }),
        () => resolve(),
      );
    });
  }

  dataValidationFunction: (() => boolean) | null = null;
  render() {
    const {
      currentQuestionData: { questionId },
      answers,
    } = this.state;
    if (questionId === null) {
      // This is just here until `onFinish` is called.
      return <></>;
    }

    const { questions } = this.props;

    const question = questions[questionId] as Question;
    if (question === undefined) {
      return (
        <Text>
          {getCriticalProblemTextForUser(
            `questions["${questionId}"] === undefined`,
          )}
        </Text>
      );
    }
    const realQuestionId = this.getRealQuestionId(question.id);

    type QuestionScreenType = React.ElementType<QuestionScreenProps>;
    let QuestionScreen: QuestionScreenType;
    switch (question.type) {
      case QuestionType.ChoicesWithSingleAnswer:
      case QuestionType.ChoicesWithMultipleAnswers:
      case QuestionType.YesNo:
        QuestionScreen = ChoicesQuestionScreen as QuestionScreenType;
        break;

      case QuestionType.Slider:
        QuestionScreen = SliderQuestionScreen as QuestionScreenType;
        break;

      case QuestionType.MultipleText:
        QuestionScreen = MultipleTextQuestionScreen as QuestionScreenType;
        break;

      case QuestionType.HowLongAgo:
        QuestionScreen = HowLongAgoQuestionScreen as QuestionScreenType;
        break;

      case QuestionType.Branch:
      case QuestionType.BranchWithRelativeComparison:
        return <></>;
    }

    const smallScreen = Dimensions.get("window").height < 600;

    return (
      <View
        style={{
          paddingHorizontal: 20,
          marginTop: smallScreen ? 0 : 20,
          flex: 1,
        }}
      >
        <Text
          testID="questionTitle"
          style={{
            textAlign: "center",
            fontSize: smallScreen ? 15 : 20,
            flex: 0,
          }}
        >
          {this.replacePlaceholders(question.question)}
        </Text>
        <View
          style={{
            // Change this to `1` if we always want the "Next" button to be on the bottom.
            flex: -1,
          }}
        >
          <QuestionScreen
            /* https://stackoverflow.com/a/21750576/2603230 */
            key={question.id}
            question={question}
            onDataChange={(data) => {
              this.addAnswerToAnswersListAsync(question, {
                data,
              });
            }}
            allAnswers={answers}
            allQuestions={questions}
            pipeInExtraMetaData={(input) => this.replacePlaceholders(input)}
            setDataValidationFunction={(func) => {
              this.dataValidationFunction = func;
            }}
          />
        </View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: smallScreen ? 0 : 20,
            flex: 0,
          }}
        >
          <Button
            onPress={async () => {
              await this.addAnswerToAnswersListAsync(question, {
                preferNotToAnswer: true,
              });
              this.onNextSelect();
            }}
            accessibilityLabel="Prefer not to answer the current question"
            title="Prefer not to answer"
          />
          <Button
            onPress={async () => {
              if (
                this.dataValidationFunction &&
                !this.dataValidationFunction()
              ) {
                return;
              }

              if (answers[realQuestionId] == null) {
                await this.addAnswerToAnswersListAsync(question, {
                  nextWithoutOption: true,
                });
              }
              this.onNextSelect();
            }}
            accessibilityLabel="Next question"
            title="Next"
          />
        </View>
        {__DEV__ && _DEBUG_CONFIGS().showCurrentStatesInSurveyScreen && (
          <ScrollView
            style={{
              height: 200,
              borderColor: "black",
              borderWidth: 1,
            }}
          >
            <Text>
              currentQuestionData:{" "}
              {JSON.stringify(this.state.currentQuestionData)}
            </Text>
            <Text style={{ marginTop: 20 }}>
              nextQuestionsDataStack:{" "}
              {JSON.stringify(this.state.nextQuestionsDataStack)}
            </Text>
            <Text style={{ marginTop: 20 }}>
              currentQuestion: {JSON.stringify(question)}
            </Text>
            <Text style={{ marginTop: 20 }}>
              Current answer: {JSON.stringify(answers)}
            </Text>
          </ScrollView>
        )}
      </View>
    );
  }
}
