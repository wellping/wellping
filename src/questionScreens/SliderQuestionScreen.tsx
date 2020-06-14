import React from "react";
import { View, Text, Slider } from "react-native";

import { QuestionScreen, SliderAnswer } from "../helpers/answerTypes";
import { SliderQuestion } from "../helpers/types";

interface SliderQuestionScreenProps extends QuestionScreen {
  question: SliderQuestion;
}

const SliderQuestionScreen: React.ElementType<SliderQuestionScreenProps> = ({
  question,
  onDataChange,
  allAnswers,
  pipeInExtraMetaData,
}) => {
  let DEFAULT_SLIDER_VALUE = 50; // TODO: Let it be customizable in question JSON (https://github.com/StanfordSocialNeuroscienceLab/WellPing/issues/1)
  if (question.defaultValueFromQuestionId) {
    const prevQuestionAnswer = allAnswers[
      pipeInExtraMetaData(question.defaultValueFromQuestionId)
    ] as SliderAnswer;
    if (prevQuestionAnswer && prevQuestionAnswer.data != null) {
      DEFAULT_SLIDER_VALUE = prevQuestionAnswer.data;
    }
  }

  const [sliderValue, setSliderValue]: [
    number,
    (sliderValue: number) => void,
  ] = React.useState(DEFAULT_SLIDER_VALUE);

  React.useEffect(() => {
    // Reset the slider value when the question changes.
    setSliderValue(DEFAULT_SLIDER_VALUE);
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
