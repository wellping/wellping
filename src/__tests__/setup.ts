import { PINGS, PINGS_DICT } from "./__data/pings";

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
