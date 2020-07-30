import { PINGS, PINGS_DICT } from "./data/pings";

beforeEach(() => {
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

    if (
      (error[0] as string).includes(
        "Consider adding an error boundary to your tree to customize error handling behavior",
      )
    ) {
      // https://github.com/facebook/react/issues/11098
      return;
    }

    originalErrorFn(...error);
  });
});

beforeAll(() => {
  /** TEST TEST DATA INTEGRITY **/
  (() => {
    let lastPingTime = new Date(0);
    PINGS.forEach((ping) => {
      expect(ping.notificationTime < ping.startTime).toBeTruthy();
      if (ping.endTime !== null) {
        expect(ping.startTime < ping.endTime).toBeTruthy();
      }

      expect(ping.notificationTime > lastPingTime).toBeTruthy();
      lastPingTime = ping.notificationTime;
    });

    expect(PINGS).toHaveLength(Object.keys(PINGS_DICT).length);
  })();

  // https://stackoverflow.com/a/56482581/2603230
  test("Timezone should always be UTC", () => {
    expect(new Date().getTimezoneOffset()).toBe(0);
  });
});
