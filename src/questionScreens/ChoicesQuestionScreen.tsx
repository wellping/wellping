import cloneDeep from "lodash/cloneDeep";
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
} from "../../answerTypes";
import { QuestionType, shuffle } from "../../helpers";
import { ChoicesQuestion, YesNoQuestion, Choice } from "../../types";

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

interface ChoicesQuestionScreenProps extends QuestionScreen {
  question: ChoicesQuestion | YesNoQuestion;
}

function initAnswerData(
  choices: Choice[],
): ChoicesWithMultipleAnswersAnswerChoices {
  // https://stackoverflow.com/a/26265095/2603230
  const defaultAnswers: ChoicesWithMultipleAnswersAnswerChoices = choices.reduce(
    (map, choice) => {
      map[choice.key] = false;
      return map;
    },
    {},
  );
  return defaultAnswers;
}

enum ChoicesAnswerType {
  SINGLE_SELECTION, // ChoicesWithMultipleAnswersAnswerChoices
  MULTIPLE_SELECTION, // string
  YESNO, // boolean
}

const YESNO_CHOICES_YES_KEY = "yes";
const YESNO_CHOICES_NO_KEY = "no";
const YESNO_CHOICES: Choice[] = [
  { key: YESNO_CHOICES_YES_KEY, value: "Yes" },
  { key: YESNO_CHOICES_NO_KEY, value: "No" },
];

const ChoicesQuestionScreen: React.ElementType<ChoicesQuestionScreenProps> = ({
  question,
  onDataChange,
  pipeInExtraMetaData,
}) => {
  let answerType: ChoicesAnswerType;
  switch (question.type) {
    case QuestionType.ChoicesWithSingleAnswer:
      answerType = ChoicesAnswerType.SINGLE_SELECTION;
      break;

    case QuestionType.ChoicesWithMultipleAnswers:
      answerType = ChoicesAnswerType.MULTIPLE_SELECTION;
      break;

    case QuestionType.YesNo:
      answerType = ChoicesAnswerType.YESNO;
      break;
  }

  let choices: Choice[];
  if (answerType === ChoicesAnswerType.YESNO) {
    choices = YESNO_CHOICES;
  } else {
    const cQ = question as ChoicesQuestion;
    choices = cQ.choices;
  }

  const listRef = React.useRef<FlatList<{ id: string; title: string }>>();

  const [selected, setSelected]: [
    ChoicesWithMultipleAnswersAnswerChoices,
    (selected: ChoicesWithMultipleAnswersAnswerChoices) => void,
  ] = React.useState(initAnswerData(choices));

  const [flatListData, setFlatListData]: [
    {
      id: string;
      title: string;
    }[],
    (value) => void,
  ] = React.useState([]);

  React.useEffect(() => {
    // Reset the choices data when the question changes.
    setSelected(initAnswerData(choices));

    let tempFlatListData = choices.map((choice) => ({
      id: choice.key,
      title: pipeInExtraMetaData(choice.value),
    }));
    if (answerType !== ChoicesAnswerType.YESNO) {
      const cQ = question as ChoicesQuestion;
      if (cQ.randomizeChoicesOrder) {
        const randomizeExceptForChoiceIds =
          cQ.randomizeExceptForChoiceIds || [];

        const flatListShuffleableData = tempFlatListData.filter(
          (value) => !randomizeExceptForChoiceIds.includes(value.id),
        );
        const flatListFixedDataAtLast = tempFlatListData.filter((value) =>
          randomizeExceptForChoiceIds.includes(value.id),
        );
        tempFlatListData = [
          ...shuffle(flatListShuffleableData),
          ...flatListFixedDataAtLast,
        ];
      }
    }
    setFlatListData(tempFlatListData);

    listRef.current.scrollToOffset({ offset: 0, animated: false });
  }, [question]);

  return (
    <View style={{ paddingTop: 20 }}>
      <FlatList
        data={flatListData}
        renderItem={({ item }) => (
          <Item
            id={item.id}
            title={item.title}
            selected={selected[item.id]}
            onSelect={(id) => {
              let newSelected: ChoicesWithMultipleAnswersAnswerChoices;
              if (answerType === ChoicesAnswerType.MULTIPLE_SELECTION) {
                newSelected = cloneDeep(selected);
              } else {
                // Reset everything to `false` if it is a single-selection question.
                newSelected = initAnswerData(choices);
              }
              newSelected[id] = !newSelected[id];
              setSelected(newSelected);

              switch (answerType) {
                case ChoicesAnswerType.MULTIPLE_SELECTION:
                  onDataChange(newSelected);
                  break;

                case ChoicesAnswerType.SINGLE_SELECTION:
                  // Single-selection question only need the selected key as the data.
                  onDataChange(id);
                  break;

                case ChoicesAnswerType.YESNO:
                  onDataChange(id === YESNO_CHOICES_YES_KEY);
                  break;
              }
            }}
          />
        )}
        keyExtractor={(item) => item.id}
        extraData={selected}
        ref={listRef}
        style={{
          borderWidth: 1,
          borderColor: "lightgray",
        }}
      />
      {answerType !== ChoicesAnswerType.YESNO && (
        <Text style={{ textAlign: "center" }}>
          You may need to scroll to see all options.
        </Text>
      )}
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

export default ChoicesQuestionScreen;
