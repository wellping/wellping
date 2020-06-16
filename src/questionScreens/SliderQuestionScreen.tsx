import React from "react";
import { View, Text, Slider } from "react-native";

import { QuestionScreen, SliderAnswer } from "../helpers/answerTypes";
import { displayProblemForUser } from "../helpers/debug";
import { SliderQuestion } from "../helpers/types";

const DEFAULT_SLIDER_VALUE = 50;

const getQuestionDefaultSliderValue = (question: SliderQuestion) => {
  if (question.defaultValue == null) {
    return DEFAULT_SLIDER_VALUE;
  }
  return question.defaultValue;
};

interface SliderQuestionScreenProps extends QuestionScreen {
  question: SliderQuestion;
}

const SliderQuestionScreen: React.ElementType<SliderQuestionScreenProps> = ({
  question,
  onDataChange,
  allAnswers,
  allQuestions,
  pipeInExtraMetaData,
}) => {
  let defaultSliderValue = getQuestionDefaultSliderValue(question);
  if (question.defaultValueFromQuestionId) {
    const prevQuestionAnswer = allAnswers[
      pipeInExtraMetaData(question.defaultValueFromQuestionId)
    ] as SliderAnswer;
    if (prevQuestionAnswer && prevQuestionAnswer.data != null) {
      defaultSliderValue = prevQuestionAnswer.data;
    } else {
      // If the user did not answer the previous question,
      // use the default slider value from that question instead.
      const prevQuestion = allQuestions[
        question.defaultValueFromQuestionId
      ] as SliderQuestion;
      if (prevQuestion == null) {
        alert(
          displayProblemForUser(
            `defaultValueFromQuestionId ${question.defaultValueFromQuestionId} prevQuestion == null`,
          ),
        );
      } else {
        defaultSliderValue = getQuestionDefaultSliderValue(prevQuestion);
      }
    }
  }

  const [sliderValue, setSliderValue]: [
    number,
    (sliderValue: number) => void,
  ] = React.useState(defaultSliderValue);

  React.useEffect(() => {
    // Reset the slider value when the question changes.
    setSliderValue(defaultSliderValue);
  }, [question]);

  return (
    <View style={{ paddingVertical: 30 }}>
      <Slider
        step={1}
        value={sliderValue}
        minimumValue={0}
        maximumValue={100}
        minimumTrackTintColor="#2F2424"
        maximumTrackTintColor="#2F2424"
        onValueChange={(value) => {
          setSliderValue(value);
          onDataChange(value);
        }}
      />
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ maxWidth: "40%" }}>{question.slider[0]}</Text>
        <Text style={{ maxWidth: "40%" }}>{question.slider[1]}</Text>
      </View>
    </View>
  );
};

export default SliderQuestionScreen;
