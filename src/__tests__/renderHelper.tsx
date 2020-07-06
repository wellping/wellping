import React from "react";
import ErrorBoundary from "react-native-error-boundary";
import { render } from "react-native-testing-library";

// Inspired by https://github.com/facebook/react/issues/11098#issuecomment-523977830.
export const errorBoundaryWrapper = (
  child: React.ReactNode,
  onError: (error: Error, stackTrace: string) => void,
) => {
  const consoleError = console.error;
  const consoleErrorSpy = jest.spyOn(console, "error");
  consoleErrorSpy.mockImplementation((message: string, ...args) => {
    if (
      message.includes(
        "React will try to recreate this component tree from scratch using the error boundary you provided, ErrorBoundary.",
      )
    ) {
      return;
    }
    consoleError(message, ...args);
  });

  const onErrorFn = jest.fn().mockImplementation(onError);
  render(<ErrorBoundary onError={onErrorFn}>{child}</ErrorBoundary>);
  expect(onErrorFn).toBeCalledTimes(1);

  consoleErrorSpy.mockRestore();
};
