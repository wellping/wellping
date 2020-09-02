import { clearAllAnswersAsync } from "./answers";
import { clearAllPingsAsync } from "./pings";

export async function clearAllPingsAndAnswersAsync(): Promise<void> {
  await clearAllAnswersAsync();
  await clearAllPingsAsync();
}
