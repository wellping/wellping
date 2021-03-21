import { INSTALLATION_ID } from "./debug";
import { User } from "./secureStore/user";

export const getLoginSessionID = (user: User): string => {
  return `${user.username}-${INSTALLATION_ID}-${user.loginDate}`;
};
