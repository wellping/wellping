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
  onSelect: () => void;
}
export function ChoiceItem({ title, selected, onSelect }: ChoiceItemProps) {
  return (
    <TouchableOpacity
      onPress={() => onSelect()}
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

enum ChoicesAnswerType {
  SINGLE_SELECTION, // ChoicesWithMultipleAnswersAnswerChoices
  MULTIPLE_SELECTION, // string
  YESNO, // boolean
}

const YESNO_CHOICES_YES_VALUE = "Yes";
const YESNO_CHOICES_NO_VALUE = "No";
const YESNO_CHOICES: Choice[] = [
  YESNO_CHOICES_YES_VALUE,
  YESNO_CHOICES_NO_VALUE,
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
  >([]);

  type FlatListData = {
    id: string;
    title: string;
  }[];
  const [flatListData, setFlatListData] = React.useState<FlatListData>([]);

  const initAnswerDataWithFlatListData = (
    inputFlatListData: FlatListData = flatListData,
  ) => {
    // Unlike `choices`, `flatListDataChoices` will be in the actual order of
    // the choices displayed on the screen.
    const flatListDataChoices = inputFlatListData.map((data) => data.title);
    return flatListDataChoices.map((choice) => [
      choice,
      false,
    ]) as ChoicesWithMultipleAnswersAnswerChoices;
  };

  React.useEffect(() => {
    // We have to use `useEffect(..., [])` here to ensure this only runs once.
    // If we don't use `useEffect`, each time the user update the state, the choices will be re-shuffled.
    let tempFlatListData = choices.map((choice) => {
      return {
        id: choice,
        title: pipeInExtraMetaData(choice),
      };
    });
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

    // We have to specify `tempFlatListData` variable here (instead of using
    // the `flatListData` variable) because `flatListData` might still not be
    // updated here.
    setSelected(initAnswerDataWithFlatListData(tempFlatListData));
  }, []);

  return (
    <View style={{ paddingTop: 20 }}>
      <FlatList
        data={flatListData}
        renderItem={({ item, index }) => (
          <ChoiceItem
            id={item.id}
            title={item.title}
            selected={(selected[index] && selected[index][1]) || false}
            onSelect={() => {
              const value = item.title;

              let newSelected: ChoicesWithMultipleAnswersAnswerChoices;
              if (answerType === ChoicesAnswerType.MULTIPLE_SELECTION) {
                newSelected = cloneDeep(selected);
              } else {
                // Reset everything to `false` if it is a single-selection question.
                newSelected = initAnswerDataWithFlatListData();
              }
              newSelected[index][1] = !newSelected[index][1];
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
                    value,
                  } as ChoicesWithSingleAnswerAnswerData);
                  break;

                case ChoicesAnswerType.YESNO:
                  onDataChange({
                    value: value === YESNO_CHOICES_YES_VALUE,
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
