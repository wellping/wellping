import Slider from "@react-native-community/slider";
import {
  SliderAnswerData,
  SliderAnswer,
} from "@wellping/study-schemas/lib/answerTypes";
import { SliderQuestion } from "@wellping/study-schemas/lib/types";
import React from "react";
import { View, Text } from "react-native";

import {
  getNonCriticalProblemTextForUser,
  alertWithShareButtonContainingDebugInfoAsync,
} from "../helpers/debug";
import { QuestionScreenProps } from "../helpers/types";
import { SLIDER_DEFAULTS } from "./constants";

export const getQuestionDefaultSliderValue = (question: SliderQuestion) => {
  if (question.defaultValue == null) {
    return SLIDER_DEFAULTS.DEFAULT_VALUE;
  }
  return question.defaultValue;
};

interface SliderQuestionScreenProps extends QuestionScreenProps {
  question: SliderQuestion;
}

const SliderQuestionScreen: React.ElementType<SliderQuestionScreenProps> = ({
  question,
  loadingCompleted,
  onDataChange,
  allAnswers,
  allQuestions,
  pipeInExtraMetaData,
}) => {
  React.useEffect(() => {
    loadingCompleted();
  }, []);

  let defaultSliderValue = getQuestionDefaultSliderValue(question);
  if (question.defaultValueFromQuestionId) {
    const prevQuestionAnswer = allAnswers[
      pipeInExtraMetaData(question.defaultValueFromQuestionId)
    ] as SliderAnswer;
    if (prevQuestionAnswer && prevQuestionAnswer.data != null) {
      defaultSliderValue = prevQuestionAnswer.data.value;
    } else {
      // If the user did not answer the previous question,
      // use the default slider value from that question instead.
      const prevQuestion = allQuestions[
        question.defaultValueFromQuestionId
      ] as SliderQuestion;
      if (prevQuestion == null) {
        alertWithShareButtonContainingDebugInfoAsync(
          getNonCriticalProblemTextForUser(
            `defaultValueFromQuestionId ${question.defaultValueFromQuestionId} prevQuestion == null`,
          ),
        );
      } else {
        defaultSliderValue = getQuestionDefaultSliderValue(prevQuestion);
      }
    }
  }

  // This value is for display only - it should not be used for anything else.
  const [__FOR_DISPLAY_ONLY__sliderValue, __FOR_DISPLAY_ONLY__setSliderValue] =
    React.useState<number | null>(null);

  return (
    <View style={{ paddingVertical: 30 }}>
      <Slider
        step={question.step ?? SLIDER_DEFAULTS.STEP}
        value={defaultSliderValue}
        minimumValue={question.minimumValue ?? SLIDER_DEFAULTS.MIN_VALUE}
        maximumValue={question.maximumValue ?? SLIDER_DEFAULTS.MAX_VALUE}
        minimumTrackTintColor="#2F2424"
        maximumTrackTintColor="#2F2424"
        onValueChange={(value) => {
          if (question.displayCurrentValueToUser) {
            // We need to set it only if it is displayed.
            __FOR_DISPLAY_ONLY__setSliderValue(value);
          }
        }}
        onSlidingComplete={(value) => {
          onDataChange({ value } as SliderAnswerData);
        }}
        accessibilityLabel="slider input"
      />
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ maxWidth: "40%" }}>{question.slider[0]}</Text>
        <Text style={{ maxWidth: "40%" }}>{question.slider[1]}</Text>
      </View>
      {question.displayCurrentValueToUser &&
        __FOR_DISPLAY_ONLY__sliderValue !== null && (
          <Text style={{ marginTop: 20, textAlign: "center" }}>
            (You have selected {__FOR_DISPLAY_ONLY__sliderValue})
          </Text>
        )}
    </View>
  );
};

export default SliderQuestionScreen;
