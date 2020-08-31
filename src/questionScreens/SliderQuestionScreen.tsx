import React from "react";
import { View, Text, Slider } from "react-native";

import {
  QuestionScreenProps,
  SliderAnswerData,
  SliderAnswer,
} from "../helpers/answerTypes";
import {
  getNonCriticalProblemTextForUser,
  alertWithShareButtonContainingDebugInfo,
} from "../helpers/debug";
import { SliderQuestion } from "../helpers/types";

export const DEFAULT_SLIDER_VALUE = 50;

export const getQuestionDefaultSliderValue = (question: SliderQuestion) => {
  if (question.defaultValue == null) {
    return DEFAULT_SLIDER_VALUE;
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
        alertWithShareButtonContainingDebugInfo(
          getNonCriticalProblemTextForUser(
            `defaultValueFromQuestionId ${question.defaultValueFromQuestionId} prevQuestion == null`,
          ),
        );
      } else {
        defaultSliderValue = getQuestionDefaultSliderValue(prevQuestion);
      }
    }
  }

  return (
    <View style={{ paddingVertical: 30 }}>
      <Slider
        step={1}
        value={defaultSliderValue}
        minimumValue={0}
        maximumValue={100}
        minimumTrackTintColor="#2F2424"
        maximumTrackTintColor="#2F2424"
        onSlidingComplete={(value) => {
          onDataChange({ value } as SliderAnswerData);
        }}
        accessibilityLabel="slider input"
      />
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ maxWidth: "40%" }}>{question.slider[0]}</Text>
        <Text style={{ maxWidth: "40%" }}>{question.slider[1]}</Text>
      </View>
    </View>
  );
};

export default SliderQuestionScreen;
