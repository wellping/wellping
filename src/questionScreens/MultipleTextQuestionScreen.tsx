import React from "react";
import { View, Text } from "react-native";
import SearchableDropdown from "../react-native-searchable-dropdown";
import {
  QuestionScreen,
  MultipleTextAnswerData,
  MultipleTextAnswer,
} from "../../answerTypes";
import { MultipleTextQuestion, Names } from "../../types";
import { withVariable } from "../../helpers";
import { getNamesFile } from "../helpers/configFiles";

const names: Names = getNamesFile();
const namesItems = names.map((name, index) => ({ id: `${index}`, name: name }));

interface MultipleTextQuestionScreenProps extends QuestionScreen {
  question: MultipleTextQuestion;
}

const MultipleTextQuestionScreen: React.ElementType<
  MultipleTextQuestionScreenProps
> = ({ question, onDataChange, allAnswers }) => {
  let numberOfTextFields = question.max;
  if (question.maxMinus) {
    const prevQuestionAnswer = allAnswers[
      question.maxMinus
    ] as MultipleTextAnswer;
    if (
      prevQuestionAnswer &&
      prevQuestionAnswer.data &&
      prevQuestionAnswer.data.count
    ) {
      numberOfTextFields -= prevQuestionAnswer.data.count;
    }
  }

  const initTextValues = Array(numberOfTextFields).fill("");

  const [textValues, setTextValues]: [
    string[],
    (textValues: string[]) => void,
  ] = React.useState(initTextValues);

  React.useEffect(() => {
    // Reset the slider value when the question changes.
    setTextValues(initTextValues);
  }, [question]);

  function updateName(name: string, index: number) {
    const newTextValues: string[] = JSON.parse(JSON.stringify(textValues));
    newTextValues[index] = name.trim();
    setTextValues(newTextValues);

    const nonEmptyFields = newTextValues.filter(Boolean);
    const data: MultipleTextAnswerData = {
      count: nonEmptyFields.length,
      values: {},
    };
    nonEmptyFields.forEach((value, realIndex) => {
      const eachFieldId = question.eachId.replace(
        withVariable(question.indexName),
        `${realIndex + 1}`, // we want 1-indexed
      );
      data.values[eachFieldId] = value;
    });
    onDataChange(data);
  }

  let textFieldsDropdownItems: {
    id: string;
    name: string;
  }[] = [];
  if (question.choices === "NAMES") {
    textFieldsDropdownItems = namesItems;
  } else if (question.choices) {
    textFieldsDropdownItems = Object.keys(question.choices).map(key => ({
      id: key,
      name: question.choices[key],
    }));
  }

  // TODO: ADD AN OPTION TO FORCE USE VALUE FROM DROPDOWN (ALERT IF NOT IN SUGGESTION LIST)
  // https://github.com/StanfordSocialNeuroscienceLab/WellPing/issues/2
  const textFields: SearchableDropdown[] = [];
  for (let index = 0; index < numberOfTextFields; index++) {
    textFields.push(
      <SearchableDropdown
        key={index}
        onItemSelect={item => {
          updateName(item.name, index);
        }}
        containerStyle={{ padding: 5 }}
        itemStyle={{
          padding: 10,
          backgroundColor: "#F9F6EF",
          borderColor: "#bbb",
          borderWidth: 1,
        }}
        itemsContainerStyle={{ maxHeight: 100 }}
        items={textFieldsDropdownItems}
        resetValue={false}
        textInputProps={{
          placeholder:
            question.choices === "NAMES"
              ? "Enter a name here..."
              : "Select a category...",
          underlineColorAndroid: "transparent",
          style: {
            padding: 12,
            borderWidth: 1,
            borderColor: "#ccc",
            borderRadius: 5,
          },
          onTextChange: (text: string) => {
            updateName(text, index);
          },
        }}
        setSort={(item, searchedText) =>
          // Match exact
          item.name.toLowerCase().startsWith(searchedText.toLowerCase())
        }
        listProps={{
          nestedScrollEnabled: true,
        }}
      />,
    );
  }

  return <View style={{ paddingTop: 10 }}>{textFields}</View>;
};

export default MultipleTextQuestionScreen;
