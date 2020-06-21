const originalErrorFn = console.error;
jest.spyOn(console, "error").mockImplementation((...error: any[]) => {
  if (
    (error[0] as string).includes(
      "Warning: Slider has been extracted from react-native",
    )
  ) {
    // Slience error about Slider.
    return;
  }
  originalErrorFn(...error);
});
