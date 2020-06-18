import { addDays } from "date-fns";
import React from "react";
import { Button, Text, View, ScrollView, Dimensions } from "react-native";

import { _DEBUG_CONFIGS } from "../config/debug";
import {
  AnswersList,
  QuestionScreen,
  Answer,
  YesNoAnswer,
  MultipleTextAnswer,
  SliderAnswer,
  ChoicesWithSingleAnswerAnswer,
  ChoicesWithMultipleAnswersAnswer,
} from "./helpers/answerTypes";
import { uploadDataAsync } from "./helpers/apiManager";
import {
  storePingStateAsync,
  addEndTimeToPingAsync,
  PingInfo,
  enqueueToFuturePingQueue,
  getFuturePingsQueue,
} from "./helpers/asyncStorage";
import { getNonCriticalProblemTextForUser } from "./helpers/debug";
import {
  QuestionType,
  withVariable,
  replacePreviousAnswerPlaceholdersWithActualContent,
  decapitalizeFirstCharacter,
} from "./helpers/helpers";
import {
  Question,
  TypedGroupQuestion,
  SliderQuestion,
  ChoicesWithSingleAnswerQuestion,
  ChoicesWithMultipleAnswersQuestion,
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

type ExtraMetaData = { [key: string]: any };

type NextData = {
  questionId: QuestionId;
  extraMetaData?: ExtraMetaData;
};

interface SurveyScreenProps {
  survey: QuestionsList;
  surveyStartingQuestionId: QuestionId;
  pingId: string;
  previousState?: SurveyScreenState;
  onFinish: (finishedPing: PingInfo) => Promise<void>;
}

export interface SurveyScreenState {
  currentQuestionId: QuestionId | null;
  extraMetaData: ExtraMetaData;
  nextStack: NextData[];
  currentQuestionAnswers: AnswersList;
  lastUploadDate: Date;
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
      // Pop `nextStack` and go to that question when the current question's `next` is `null`.
      // When `nextStack` is empty and the current question's `next` is `null`, end the test.
      this.state = {
        currentQuestionId: props.surveyStartingQuestionId,
        nextStack: [],
        extraMetaData: {},
        currentQuestionAnswers: {},
        lastUploadDate: null,
      };
    }
  }

  componentDidMount() {
    storePingStateAsync(this.props.pingId, this.state);
  }

  pipeInExtraMetaData(input: string): string {
    if (!this.state.extraMetaData) {
      return input;
    }

    let output = input;
    for (const [key, value] of Object.entries(this.state.extraMetaData)) {
      let newValue = value;
      if (key === "TARGET_CATEGORY") {
        let capValue = value;
        if (capValue !== "PHE") {
          // TODO: MAKE THIS CUSTOMIZABLE
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
        const prevQuestion = this.state.currentQuestionAnswers[questionId];
        if (!prevQuestion) {
          return null;
        }
        switch (prevQuestion.type) {
          case QuestionType.ChoicesWithSingleAnswer: {
            const csaQuestion = this.props.survey[
              questionId
            ] as ChoicesWithSingleAnswerQuestion;

            const csaAnswer = prevQuestion as ChoicesWithSingleAnswerAnswer;
            if (csaAnswer.data == null) {
              return getNonCriticalProblemTextForUser(
                `csaAnswer.data (from ${csaAnswer.id}) == null`,
              );
            }

            const csaAnswerChoice = csaQuestion.choices.find(
              (choice) => choice.key === csaAnswer.data,
            );
            if (csaAnswerChoice == null) {
              return getNonCriticalProblemTextForUser(
                `csaAnswerChoice (from ${csaQuestion.id}) == null`,
              );
            }

            return decapitalizeFirstCharacter(csaAnswerChoice.value);
          }

          default:
            return null;
        }
      },
    );

    return output;
  }

  onNextSelect() {
    // Reset this so that the new QuestionScreen can set it.
    this.dataValidationFunction = null;

    const { survey, pingId } = this.props;

    const setStateCallback = () => {
      storePingStateAsync(pingId, this.state).then(() => {
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

      if (
        this.state.currentQuestionId &&
        (survey[this.state.currentQuestionId].type === QuestionType.Branch ||
          survey[this.state.currentQuestionId].type ===
            QuestionType.BranchWithRelativeComparison)
      ) {
        this.onNextSelect();
      }

      if (this.state.currentQuestionId == null) {
        addEndTimeToPingAsync(pingId, new Date()).then((ping) => {
          this.props.onFinish(ping);
        });
      }
    };

    const filterNextStack = (value: NextData) => {
      if (value.questionId) {
        return true;
      } else {
        return false;
      }
    };

    switch (survey[this.state.currentQuestionId].type) {
      case QuestionType.YesNo:
        this.setState((prevState) => {
          const currentQuestion = survey[
            prevState.currentQuestionId
          ] as YesNoQuestion;
          const currentQuestionAnswer = prevState.currentQuestionAnswers[
            prevState.currentQuestionId
          ] as YesNoAnswer;
          let selectedBranchId = currentQuestion.branchStartId?.no;

          if (currentQuestionAnswer.data) {
            selectedBranchId = currentQuestion.branchStartId?.yes;

            if (
              currentQuestion.addFollowupStream &&
              currentQuestion.addFollowupStream.yes
            ) {
              const futureStreamName: StreamName =
                currentQuestion.addFollowupStream.yes;

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
          }
          if (selectedBranchId) {
            return {
              currentQuestionId: selectedBranchId,
              nextStack: [
                ...prevState.nextStack,
                { questionId: currentQuestion.next },
              ].filter(filterNextStack),
            };
          } else {
            return {
              currentQuestionId: currentQuestion.next,
              nextStack: prevState.nextStack,
            };
          }
        }, setStateCallback);
        break;

      case QuestionType.MultipleText:
        this.setState((prevState) => {
          const currentQuestion = survey[
            prevState.currentQuestionId
          ] as MultipleTextQuestion;
          const currentQuestionAnswer = prevState.currentQuestionAnswers[
            prevState.currentQuestionId
          ] as MultipleTextAnswer;

          if (
            !currentQuestionAnswer.data ||
            currentQuestionAnswer.data.count === 0 ||
            currentQuestion.repeatedItemStartId == null
          ) {
            if (currentQuestion.fallbackItemStartId) {
              return {
                currentQuestionId: currentQuestion.fallbackItemStartId,
                nextStack: [
                  ...prevState.nextStack,
                  { questionId: currentQuestion.next },
                ].filter(filterNextStack),
                extraMetaData: {},
              };
            } else {
              return {
                currentQuestionId: currentQuestion.next,
                nextStack: prevState.nextStack,
                extraMetaData: {},
              };
            }
          }

          const repeatedStartInfo: NextData[] = [];
          for (let i = 1; i <= currentQuestionAnswer.data.count; i++) {
            const eachFieldId = currentQuestion.eachId.replace(
              withVariable(currentQuestion.indexName),
              `${i}`,
            );
            repeatedStartInfo.push({
              questionId: currentQuestion.repeatedItemStartId,
              extraMetaData: {
                [currentQuestion.variableName]:
                  currentQuestionAnswer.data.values[eachFieldId],
                [currentQuestion.indexName]: i,
              },
            });
          }

          const immediateNext = repeatedStartInfo.shift();

          return {
            currentQuestionId: immediateNext.questionId,
            nextStack: [
              ...prevState.nextStack,
              { questionId: currentQuestion.next },
              ...repeatedStartInfo.reverse(),
            ].filter(filterNextStack),
            extraMetaData: immediateNext.extraMetaData,
          };
        }, setStateCallback);
        break;

      case QuestionType.Branch:
        this.setState((prevState) => {
          const currentQuestion = survey[
            prevState.currentQuestionId
          ] as BranchQuestion;

          let selectedBranchId = currentQuestion.branchStartId.false;

          switch (currentQuestion.condition.questionType) {
            case QuestionType.MultipleText: {
              const targetQuestionAnswer = prevState.currentQuestionAnswers[
                this.pipeInExtraMetaData(currentQuestion.condition.questionId)
              ] as MultipleTextAnswer;
              if (targetQuestionAnswer && targetQuestionAnswer.data) {
                if (
                  targetQuestionAnswer.data.count ===
                  currentQuestion.condition.target
                ) {
                  selectedBranchId = currentQuestion.branchStartId.true;
                }
              }
              break;
            }

            case QuestionType.ChoicesWithSingleAnswer: {
              const csaQuestionAnswer = prevState.currentQuestionAnswers[
                this.pipeInExtraMetaData(currentQuestion.condition.questionId)
              ] as ChoicesWithSingleAnswerAnswer;
              if (csaQuestionAnswer && csaQuestionAnswer.data) {
                if (
                  csaQuestionAnswer.data === currentQuestion.condition.target
                ) {
                  selectedBranchId = currentQuestion.branchStartId.true;
                }
              }
              break;
            }
          }

          if (selectedBranchId) {
            return {
              currentQuestionId: selectedBranchId,
              nextStack: [
                ...prevState.nextStack,
                { questionId: currentQuestion.next },
              ].filter(filterNextStack),
            };
          } else {
            return {
              currentQuestionId: currentQuestion.next,
              nextStack: prevState.nextStack,
            };
          }
        }, setStateCallback);
        break;

      case QuestionType.BranchWithRelativeComparison:
        this.setState((prevState) => {
          const currentQuestion = survey[
            prevState.currentQuestionId
          ] as BranchWithRelativeComparisonQuestion;

          const values: { nextQuestionId: QuestionId; value: number }[] = [];
          for (const prevQuestionId of Object.keys(
            currentQuestion.branchStartId,
          )) {
            values.push({
              nextQuestionId: currentQuestion.branchStartId[prevQuestionId],
              value: (prevState.currentQuestionAnswers[
                prevQuestionId
              ] as SliderAnswer).data,
            });
          }

          let nextQuestionId = values[0].nextQuestionId;
          let curMaxValue = -1;
          for (const value of values) {
            if (value.value && value.value > curMaxValue) {
              nextQuestionId = value.nextQuestionId;
              curMaxValue = value.value;
            }
          }

          if (nextQuestionId) {
            return {
              currentQuestionId: nextQuestionId,
              nextStack: [
                ...prevState.nextStack,
                { questionId: currentQuestion.next },
              ].filter(filterNextStack),
            };
          } else {
            return {
              currentQuestionId: currentQuestion.next,
              nextStack: prevState.nextStack,
            };
          }
        }, setStateCallback);
        break;

      case QuestionType.ChoicesWithMultipleAnswers:
      case QuestionType.ChoicesWithSingleAnswer: {
        const currentQuestion = survey[
          this.state.currentQuestionId
        ] as ChoicesQuestion;
        const currentAnswer = this.state.currentQuestionAnswers[
          this.state.currentQuestionId
        ] as ChoicesWithSingleAnswerAnswer | ChoicesWithMultipleAnswersAnswer;
        if (currentQuestion.specialCasesStartId) {
          let fallbackNext: QuestionId | null = null;
          if (
            currentQuestion.specialCasesStartId.hasOwnProperty("_pna") &&
            (currentAnswer.nextWithoutOption || currentAnswer.preferNotToAnswer)
          ) {
            fallbackNext = currentQuestion.specialCasesStartId["_pna"];
          } else {
            if (currentQuestion.type === QuestionType.ChoicesWithSingleAnswer) {
              const csaAnswer = currentAnswer as ChoicesWithSingleAnswerAnswer;
              if (
                currentQuestion.specialCasesStartId.hasOwnProperty(
                  csaAnswer.data,
                )
              ) {
                fallbackNext =
                  currentQuestion.specialCasesStartId[csaAnswer.data];
              }
            } else {
              if (
                currentQuestion.type === QuestionType.ChoicesWithMultipleAnswers
              ) {
                const cmaAnswer = currentAnswer as ChoicesWithMultipleAnswersAnswer;
                Object.entries(cmaAnswer.data).some(
                  ([eachAnswer, selected]) => {
                    if (selected) {
                      if (
                        selected &&
                        currentQuestion.specialCasesStartId.hasOwnProperty(
                          eachAnswer,
                        )
                      ) {
                        fallbackNext =
                          currentQuestion.specialCasesStartId[eachAnswer];
                      }
                      // we return `true` here instead of inside so that it will also stop when any other choices are selected.
                      return true;
                    }
                    return false;
                  },
                );
              }
            }
          }

          if (fallbackNext) {
            this.setState((prevState) => {
              return {
                currentQuestionId: fallbackNext,
              };
            }, setStateCallback);
            break;
          }
        }
        // If it is not the case, we go to default. So no break here.
      }
      default:
        this.setState((prevState) => {
          const currentQuestion: Question = survey[prevState.currentQuestionId];
          let next: QuestionId | null = currentQuestion.next;
          let extraState = {};
          if (next === null) {
            if (prevState.nextStack.length > 0) {
              const nextData = prevState.nextStack.pop();
              next = nextData.questionId;
              extraState = {
                extraMetaData:
                  nextData.extraMetaData || prevState.extraMetaData,
              };
            }
          }
          return {
            currentQuestionId: next,
            nextStack: prevState.nextStack,
            ...extraState,
          };
        }, setStateCallback);
        break;
    }
  }

  getRealQuestionId(question: Question): string {
    return this.pipeInExtraMetaData(question.id);
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
      data?: any | null;
      lastUpdateDate?: Date;
    },
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const realQuestionId = this.getRealQuestionId(question);
      this.setState(
        (prevState) => ({
          currentQuestionAnswers: {
            ...prevState.currentQuestionAnswers,
            [realQuestionId]: {
              id: realQuestionId,
              type: question.type,
              nextWithoutOption,
              preferNotToAnswer,
              data,
              lastUpdateDate,
            },
          },
        }),
        () => resolve(),
      );
    });
  }

  dataValidationFunction: () => boolean = null;
  render() {
    /*var contents = this.props.screenProps.scores.map(score => (
      <Text key={score.name}>
        {score.name}:{score.value}
      </Text>
    ));
    return (
      <View style={styles.container}>
        <Text style={styles.highScoresTitle}>2048 High Scores!</Text>
        <Text style={styles.scores}>{contents}</Text>
      </View>
    );*/
    const { currentQuestionId, currentQuestionAnswers } = this.state;
    if (currentQuestionId == null) {
      return (
        <ScrollView>
          <Text>Survey ended!</Text>
          <Text>{JSON.stringify(this.state)}</Text>
        </ScrollView>
      );
    }

    const { survey } = this.props;

    const question = survey[currentQuestionId] as Question;
    const realQuestionId = this.getRealQuestionId(question);

    let QuestionScreen: React.ElementType<QuestionScreen>;
    switch (question.type) {
      case QuestionType.ChoicesWithSingleAnswer:
      case QuestionType.ChoicesWithMultipleAnswers:
      case QuestionType.YesNo:
        QuestionScreen = ChoicesQuestionScreen;
        break;

      case QuestionType.Slider:
        QuestionScreen = SliderQuestionScreen;
        break;

      case QuestionType.MultipleText:
        QuestionScreen = MultipleTextQuestionScreen;
        break;

      case QuestionType.HowLongAgo:
        QuestionScreen = HowLongAgoQuestionScreen;
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
          style={{
            textAlign: "center",
            fontSize: smallScreen ? 15 : 20,
            flex: 0,
          }}
        >
          {this.pipeInExtraMetaData(question.question)}
        </Text>
        <View
          style={{
            // Change this to `1` if we always want the "Next" button to be on the bottom.
            flex: -1,
          }}
        >
          <QuestionScreen
            /* https://stackoverflow.com/a/21750576/2603230 */
            key={survey[this.state.currentQuestionId].id}
            question={survey[this.state.currentQuestionId]}
            onDataChange={(data) => {
              this.addAnswerToAnswersListAsync(question, {
                data,
              });
            }}
            allAnswers={this.state.currentQuestionAnswers}
            allQuestions={survey}
            pipeInExtraMetaData={(input) => this.pipeInExtraMetaData(input)}
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

              if (this.state.currentQuestionAnswers[realQuestionId] == null) {
                await this.addAnswerToAnswersListAsync(question, {
                  nextWithoutOption: true,
                });
              }
              this.onNextSelect();
            }}
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
              {JSON.stringify(this.state.currentQuestionId)}
              {JSON.stringify(survey[this.state.currentQuestionId])}
              {JSON.stringify(this.state.extraMetaData)}
            </Text>
            <Text>
              Current answer:{" "}
              {JSON.stringify(this.state.currentQuestionAnswers)}
            </Text>
            <Text>Next stack: {JSON.stringify(this.state.nextStack)}</Text>
          </ScrollView>
        )}
      </View>
    );
  }
}
