import React from "react";
import { View, FlatList } from "react-native";
import {
  QuestionScreenProps,
  HowLongAgoAnswerData,
  HowLongAgoAnswerDataType,
} from "wellping-study-file/lib/answerTypes";
import { HowLongAgoQuestion } from "wellping-study-file/lib/types";

import { ChoiceItem } from "./ChoicesQuestionScreen";

const numberChoices: { [key: string]: string } = {
  "1": "1",
  "2": "2",
  "3": "3",
  "4": "4",
  "5": "5",
  "6": "6",
  "7": "7",
  "8": "8",
  "9": "9",
  "10": "10",
};
const unitChoices: { [key: string]: string } = {
  hours: "hours",
  days: "days",
  weeks: "weeks",
  months: "months",
};

const dictToFlatListData = (dict: { [key: string]: string }) => {
  return Object.keys(dict).map((key) => ({
    id: key,
    title: dict[key],
  }));
};

const flatListNumberChoices = dictToFlatListData(numberChoices);
const flatListUnitChoices = dictToFlatListData(unitChoices);

interface HowLongAgoQuestionScreenProps extends QuestionScreenProps {
  question: HowLongAgoQuestion;
}

// TODO: Add one more question type (something like TwoColumnQuestion) to support something more generic - though keep this HowLongAgo question type and just that new question screen here.
const HowLongAgoQuestionScreen: React.ElementType<
  HowLongAgoQuestionScreenProps
> = ({ question, loadingCompleted, onDataChange, pipeInExtraMetaData }) => {
  React.useEffect(() => {
    loadingCompleted();
  }, []);

  const [data, setData] = React.useState<HowLongAgoAnswerDataType>([
    null,
    null,
  ]);

  return (
    <View style={{ flexDirection: "row", paddingVertical: 5 }}>
      <FlatList
        data={flatListNumberChoices}
        renderItem={({ item }) => (
          <ChoiceItem
            id={item.id}
            title={item.title}
            selected={item.id === `${data[0]}`}
            onSelect={() => {
              const newData: HowLongAgoAnswerDataType = [
                Number(item.id),
                data[1],
              ];
              setData(newData);
              onDataChange({ value: newData } as HowLongAgoAnswerData);
            }}
          />
        )}
        keyExtractor={(item) => item.id}
        extraData={data}
        style={{ marginRight: 5 }}
      />
      <FlatList
        data={flatListUnitChoices}
        renderItem={({ item }) => (
          <ChoiceItem
            id={item.id}
            title={item.title}
            selected={item.id === data[1]}
            onSelect={() => {
              const newData: HowLongAgoAnswerDataType = [data[0], item.id];
              setData(newData);
              onDataChange({ value: newData } as HowLongAgoAnswerData);
            }}
          />
        )}
        keyExtractor={(item) => item.id}
        extraData={data}
        style={{ marginLeft: 5 }}
      />
    </View>
  );
};

export default HowLongAgoQuestionScreen;
