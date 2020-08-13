import { fireEvent, act, RenderAPI } from "react-native-testing-library";
import { ReactTestInstance } from "react-test-renderer";
import waitForExpect from "wait-for-expect";

/**
 * This function is used when `fireEvent.changeText` is used (e.g. for
 * `MultipleTextQuestionScreen`).
 * We need to `waitForExpect` value to change with `act` so that there is no
 * error "Warning: An update to MultipleTextQuestionScreen inside a test was
 * not wrapped in act(...)."
 */
export async function changeTextAndWaitForUpdateAsync(
  getElement: () => Promise<ReactTestInstance>,
  text: string,
) {
  fireEvent.changeText(await getElement(), text);
  await act(async () => {
    await waitForExpect(async () => {
      expect((await getElement()).props.value).toStrictEqual(text);
    });
  });
}

const SLIDER_A11Y_LABEL = "slider input";
export const findSliderAsync = async ({ findAllByA11yLabel }: RenderAPI) => {
  const sliderInputs = await findAllByA11yLabel(SLIDER_A11Y_LABEL);
  expect(sliderInputs).toHaveLength(1);
  const sliderInput = sliderInputs[0];
  return sliderInput;
};
export const moveSlider = (sliderInput: ReactTestInstance, value: number) => {
  fireEvent(sliderInput, "onSlidingComplete", {
    nativeEvent: { value },
  });
};
