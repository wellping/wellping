import { secureRemoveAllAnswersAsync } from "./secureStore/answer";
import { secureRemoveAllPingsAsync } from "./secureStore/ping";

export async function clearAllPingsAndAnswersAsync(): Promise<void> {
  await secureRemoveAllAnswersAsync();
  await secureRemoveAllPingsAsync();
}
