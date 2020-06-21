beforeEach(() => {
  const originalErrorFn = console.error;
  jest.spyOn(console, "error").mockImplementation((error: string) => {
    if (
      error.includes("Warning: Slider has been extracted from react-native")
    ) {
      // Slience error about Slider.
      return;
    }
    originalErrorFn(error);
  });
});
