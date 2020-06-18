import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";

import {
  QuestionScreen,
  ChoicesWithMultipleAnswersAnswerChoices,
  HowLongAgoAnswerData,
} from "../helpers/answerTypes";
import { QuestionType } from "../helpers/helpers";
import { HowLongAgoQuestion } from "../helpers/types";

function Item({ id, title, selected, onSelect }) {
  return (
    <TouchableOpacity
      onPress={() => onSelect(id)}
      style={[
        styles.item,
        { backgroundColor: selected ? "#b3995d" : "#F9F6EF" },
      ]}
    >
      <Text style={styles.title}>{title}</Text>
    </TouchableOpacity>
  );
}

interface HowLongAgoQuestionScreenProps extends QuestionScreen {
  question: HowLongAgoQuestion;
}

const HowLongAgoQuestionScreen: React.ElementType<HowLongAgoQuestionScreenProps> = ({
  question,
  onDataChange,
  pipeInExtraMetaData,
}) => {
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

  const [data, setData]: [
    HowLongAgoAnswerData,
    (data: HowLongAgoAnswerData) => void,
  ] = React.useState([-1, ""]);

  return (
    <View style={{ flexDirection: "row" }}>
      <FlatList
        data={Object.keys(numberChoices).map((key) => ({
          id: key,
          title: numberChoices[key],
        }))}
        renderItem={({ item }) => (
          <Item
            id={item.id}
            title={item.title}
            selected={item.id === `${data[0]}`}
            onSelect={(id) => {
              const newData: HowLongAgoAnswerData = [Number(id), data[1]];
              setData(newData);
              onDataChange(newData);
            }}
          />
        )}
        keyExtractor={(item) => item.id}
        extraData={data}
        style={{ marginRight: 5 }}
      />
      <FlatList
        data={Object.keys(unitChoices).map((key) => ({
          id: key,
          title: unitChoices[key],
        }))}
        renderItem={({ item }) => (
          <Item
            id={item.id}
            title={item.title}
            selected={item.id === data[1]}
            onSelect={(id) => {
              const newData: HowLongAgoAnswerData = [data[0], id];
              setData(newData);
              onDataChange(newData);
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

const styles = StyleSheet.create({
  item: {
    backgroundColor: "#f9c2ff",
    padding: 10,
    marginVertical: 8,
  },
  title: {
    fontSize: 20,
  },
});

export default HowLongAgoQuestionScreen;
