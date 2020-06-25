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
  QuestionScreenProps,
  ChoicesWithMultipleAnswersAnswerChoices,
  YesNoAnswerData,
  ChoicesWithSingleAnswerAnswerData,
  ChoicesWithMultipleAnswersAnswerData,
} from "../helpers/answerTypes";
import { QuestionType, shuffle } from "../helpers/helpers";
import { ChoicesQuestion, YesNoQuestion, Choice } from "../helpers/types";

export interface ChoiceItemProps {
  id: string;
  title: string;
  selected: boolean;
  onSelect: (id: string) => void;
}
export function ChoiceItem({ id, title, selected, onSelect }: ChoiceItemProps) {
  return (
    <TouchableOpacity
      onPress={() => onSelect(id)}
      style={[
        styles.item,
        { backgroundColor: selected ? "#b3995d" : "#F9F6EF" },
      ]}
      accessibilityLabel={`select ${title}`}
    >
      <Text style={styles.title}>{title}</Text>
    </TouchableOpacity>
  );
}

interface ChoicesQuestionScreenProps extends QuestionScreenProps {
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
    {} as ChoicesWithMultipleAnswersAnswerChoices,
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

    default:
      throw new Error("Wrong QuestionType in ChoicesQuestionScreen");
  }

  let choices: Choice[];
  if (answerType === ChoicesAnswerType.YESNO) {
    choices = YESNO_CHOICES;
  } else {
    const cQ = question as ChoicesQuestion;
    choices = cQ.choices;
  }

  const listRef = React.useRef<FlatList<{ id: string; title: string }>>(null);

  const [selected, setSelected] = React.useState<
    ChoicesWithMultipleAnswersAnswerChoices
  >(initAnswerData(choices));

  type FlatListData = {
    id: string;
    title: string;
  }[];
  const [flatListData, setFlatListData] = React.useState<FlatListData>([]);

  React.useEffect(() => {
    // We have to use `useEffect(..., [])` here to ensure this only runs once.
    // If we don't use `useEffect`, each time the user update the state, the choices will be re-shuffled.
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
  }, []);

  return (
    <View style={{ paddingTop: 20 }}>
      <FlatList
        data={flatListData}
        renderItem={({ item }) => (
          <ChoiceItem
            id={item.id}
            title={item.title}
            selected={selected[item.id]}
            onSelect={(id: string) => {
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
                  onDataChange({
                    value: newSelected,
                  } as ChoicesWithMultipleAnswersAnswerData);
                  break;

                case ChoicesAnswerType.SINGLE_SELECTION:
                  // Single-selection question only need the selected key as the data.
                  onDataChange({
                    value: id,
                  } as ChoicesWithSingleAnswerAnswerData);
                  break;

                case ChoicesAnswerType.YESNO:
                  onDataChange({
                    value: id === YESNO_CHOICES_YES_KEY,
                  } as YesNoAnswerData);
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
