import {
  MultipleTextAnswerData,
  MultipleTextAnswer,
} from "@wellping/study-schemas/lib/answerTypes";
import {
  MultipleTextQuestion,
  ChoicesList,
} from "@wellping/study-schemas/lib/types";
import cloneDeep from "lodash/cloneDeep";
import React from "react";
import { View, Text, TextInput, Alert, Platform, ScrollView } from "react-native";

import { getReusableChoicesIncludeErrorAsync } from "../helpers/studyFile";
import { QuestionScreenProps } from "../helpers/types";
// @ts-ignore
import SearchableDropdown from "../inc/react-native-searchable-dropdown";

interface MultipleTextQuestionScreenProps extends QuestionScreenProps {
  question: MultipleTextQuestion;
}

const MultipleTextQuestionScreen: React.ElementType<
  MultipleTextQuestionScreenProps
> = ({
  question,
  loadingCompleted,
  onDataChange,
  allAnswers,
  pipeInExtraMetaData,
  setDataValidationFunction,
  isDisabled
}) => {
  type DropdownItem = {
    id: string;
    name: string;
  };

  let numberOfTextFields = question.max;
  if (question.maxMinus) {
    const prevQuestionAnswer = allAnswers[
      question.maxMinus
    ] as MultipleTextAnswer;
    if (prevQuestionAnswer && prevQuestionAnswer.data) {
      const length = prevQuestionAnswer.data.value.length;
      if (length > 0) {
        numberOfTextFields -= length;
      }
    }
  }

  // const initTextValues = Array(numberOfTextFields).fill("");
  let initTextValues = Array(numberOfTextFields).fill("");

  // const [textValues, setTextValues] = React.useState<string[]>(initTextValues);
  const [textValues, setTextValues] = React.useState<string[]>(initTextValues)

  React.useEffect(() => {
    if (isDisabled && (allAnswers[question?.id] as MultipleTextAnswer)?.data) {
      setTextValues((allAnswers[question?.id] as MultipleTextAnswer).data?.value!);
    }
  }, [isDisabled, question])

  const [textFieldsDropdownItems, setTextFieldsDropdownItems] = React.useState<
    DropdownItem[]
  >([]);
  const textFieldsDropdownNames = textFieldsDropdownItems.map(
    (item) => item.name,
  );

  React.useEffect(() => {
    async function setupTextFieldsDropdownItemsAsync() {
      if (question.dropdownChoices !== undefined) {
        let tempChoices!: ChoicesList;
        if (typeof question.dropdownChoices.choices === "string") {
          tempChoices = await getReusableChoicesIncludeErrorAsync(
            question.dropdownChoices.choices,
          );
        } else {
          tempChoices = question.dropdownChoices.choices;
        }
        setTextFieldsDropdownItems(
          tempChoices.map((choice) => ({
            id: choice,
            name: pipeInExtraMetaData(choice),
          })),
        );
      }

      loadingCompleted();
    }
    // So that async can be used in `setupTextFieldsDropdownItemsAsync`.
    setupTextFieldsDropdownItemsAsync();
  }, [question.dropdownChoices]);

  React.useEffect(() => {
    // We have to `setDataValidationFunction` again when `textFieldsDropdownItems`
    // is changed so that the function will use the new `textValues` and
    // `textFieldsDropdownItems` when validating (as `dataValidationFunction`
    // depends on those two variables).
    setDataValidationFunction(() => {
      return dataValidationFunction();
    });
  }, [textValues, textFieldsDropdownItems]);

  const updateTextValue = (text: string, index: number) => {
    const newTextValues: string[] = cloneDeep(textValues);
    newTextValues[index] = text.trim();
    setTextValues(newTextValues);

    const nonEmptyFields = newTextValues.filter(Boolean);
    const data: MultipleTextAnswerData = { value: nonEmptyFields };
    onDataChange(data);
  };

  const [isInputEmpty, setIsInputEmpty] = React.useState<{
    [index: number]: boolean;
  }>(Array(numberOfTextFields).fill(true));

  const textFields: SearchableDropdown[] = [];
  // https://stackoverflow.com/a/56063129/2603230
  const textFieldsRef = React.useRef<(TextInput | null)[]>([]);
  for (let index = 0; index < numberOfTextFields; index++) {
    const focusOnNextIfNotLast = () => {
      if (index !== numberOfTextFields - 1) {
        textFieldsRef.current[index + 1]!.focus();
      }
    };

    textFieldsRef.current.push(null);

    textFields.push(
      // @ts-ignore
      <SearchableDropdown
        key={index}
        onItemSelect={(item: DropdownItem) => {
          updateTextValue(item.name, index);
          focusOnNextIfNotLast();
        }}
        containerStyle={{ padding: 5 ,}}
        itemStyle={{
          padding: 10,
          backgroundColor: "#F9F6EF",
          borderColor: "#bbb",
          borderWidth: 1,
          borderRadius: 12,
          height: 48,
        }}
        itemsContainerStyle={{
          // borderRadius: 12,
          // height: 48,
          maxHeight: 100,
          ...(!question.dropdownChoices?.alwaysShowChoices &&
            isInputEmpty[index] && { display: "none" }),
        }}
        items={textFieldsDropdownItems}
        resetValue={false}
        textInputProps={{
          ref: (ref: TextInput) => {
            textFieldsRef.current[index] = ref;
          },
          value: isDisabled ? textValues[index] : undefined,
          editable: !isDisabled,
          placeholder: question.placeholder,
          underlineColorAndroid: "transparent",
          adjustsFontSizeToFit: true,
          style: {
            paddingVertical: Platform.OS === "android" ? 0 : 10,
            paddingHorizontal: Platform.OS === "android" ? 20 : 20,
            borderWidth: 1,
            borderColor: "#ccc",
            borderRadius: 12,
            height: 48,
            fontSize: 18,
          },
          autoCorrect: false,
          keyboardType: question.keyboardType || "default",
          returnKeyType: index === numberOfTextFields - 1 ? "done" : "next",
          onChangeText: (text: string) => {
            setIsInputEmpty({
              ...isInputEmpty,
              [index]: text.trim().length === 0,
            });

            updateTextValue(text, index);
          },
          onSubmitEditing: () => {
            focusOnNextIfNotLast();
          },
          onEndEditing: () => {
            dataValidationFunction();
          },
          accessibilityLabel: `text input ${index}`,
          accessibilityHint: "Enter your answer here",
        }}
        setSort={(item: DropdownItem, searchedText: string) =>
          // Match exact
          item.name.toLowerCase().startsWith(searchedText.toLowerCase())
        }
        listProps={{
          nestedScrollEnabled: true,
        }}
      />,
    );
  }

  let alertDisplaying = false;
  const dataValidationFunction = () => {
    if (!question.dropdownChoices?.forceChoice) {
      // If there is no `forceChoice`, the data is always valid.
      return true;
    }

    if (alertDisplaying) {
      // It means the data is not valid, and an alert is still on screen.
      return false;
    }

    const invalidValues = textValues.filter((value) => {
      // If the text value is not empty and is not in the items list.
      return value && !textFieldsDropdownNames.includes(value);
    });

    if (invalidValues.length === 0) {
      // There is no invalid text values.
      return true;
    }

    // We clear the values first so that there will not be duplicate alerts.
    const invalidValuesIndices = invalidValues.map((value) =>
      textValues.indexOf(value),
    );
    invalidValuesIndices.forEach((index) => {
      textFieldsRef.current[index]?.clear();
      // Because `clear()` does not call `onChangeText`.
      updateTextValue("", index);
    });

    alertDisplaying = true;
    Alert.alert(
      "Notice",
      `You must select an item from the list.\n\n` +
        `The following ${
          invalidValues.length === 1 ? "item is" : "items are"
        } not in the list: ` +
        `${invalidValues.join(", ")}`,
      [
        {
          text: "OK",
          onPress: () => {
            textFieldsRef.current[invalidValuesIndices[0]]!.focus();
            alertDisplaying = false;
          },
          style: "cancel",
        },
      ],
    );
    return false;
  };

  if (numberOfTextFields === 0) {
    return (
      <View style={{ marginTop: 30 }}>
        <Text style={{ textAlign: "center" }}>
          (No text field available. Please contact the research staff if you
          believe this is an error.)
        </Text>
      </View>
    );
  }
  
  /* @ts-ignore */
  return <ScrollView style={{ paddingVertical: 0}}>{textFields}</ScrollView>;
};

export default MultipleTextQuestionScreen;
