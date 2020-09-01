import { notificationsTest } from "./notifications.parttest";
import { pingsTest } from "./pings.parttest";

// https://github.com/facebook/jest/issues/6194#issuecomment-419837314
describe("pings", pingsTest);
describe("notifications", notificationsTest);
