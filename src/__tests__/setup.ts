import { PINGS, PINGS_DICT } from "./data/pings";

beforeAll(() => {
  // Similar to https://github.com/expo/expo/blob/dba287e9686718ff6375f9274d0e5c72b6c3ff4e/packages/expo-asset/src/__tests__/Asset-test.ts#L213-L220
  // @ts-ignore: the type declaration marks __DEV__ as read-only
  __DEV__ = false; // eslint-disable-line no-global-assign

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

afterAll(() => {
  // Similar to https://github.com/expo/expo/blob/dba287e9686718ff6375f9274d0e5c72b6c3ff4e/packages/expo-asset/src/__tests__/Asset-test.ts#L213-L220
  // @ts-ignore: the type declaration marks __DEV__ as read-only
  __DEV__ = true; // eslint-disable-line no-global-assign
});
