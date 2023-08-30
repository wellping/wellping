import React from "react";
import { Keyboard, Platform, TouchableOpacity, Text } from "react-native";

interface HideKeyboardButtonAndWrapperProps {
  children: React.ReactElement;
}
/**
 * If the keyboard is active, returns a "button" (Text + TouchableOpacity) that
 * dismisses the keyboard when clicked.
 *
 * If the keyboard is not active, returns `children`.
 */
const HideKeyboardButtonAndWrapper: React.FunctionComponent<
  HideKeyboardButtonAndWrapperProps
> = ({ children }) => {
  // https://reactnative.dev/docs/keyboard
  React.useEffect(() => {
    const keyboardShowEventName =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const keyboardHideEventName =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const willShow = Keyboard.addListener(keyboardShowEventName, _keyboardDidShow);
    const willHide = Keyboard.addListener(keyboardHideEventName, _keyboardDidHide);

    // cleanup function
    return () => {
      // Keyboard.removeListener(keyboardShowEventName, _keyboardDidShow);
      // Keyboard.removeListener(keyboardHideEventName, _keyboardDidHide);
      willShow?.remove()
      willHide?.remove()
    };
  }, []);

  const [isKeyboardActive, setKeyboardActive] = React.useState<boolean>(false);

  const _keyboardDidShow = () => {
    setKeyboardActive(true);
  };

  const _keyboardDidHide = () => {
    setKeyboardActive(false);
  };

  if (isKeyboardActive) {
    return (
      <TouchableOpacity
        onPress={() => {
          Keyboard.dismiss();
        }}
      >
        <Text
          style={{
            // https://docs.expo.io/versions/latest/react-native/button/#color
            color: Platform.OS === "ios" ? "#007AFF" : "#2196F3",
            textAlign: "center",
          }}
        >
          Hide Keyboard
        </Text>
      </TouchableOpacity>
    );
  } else {
    return children;
  }
};

export default HideKeyboardButtonAndWrapper;
