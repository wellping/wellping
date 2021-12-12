import { INSTALLATION_ID } from "./debug";
import { User } from "./secureStore/user";

export const getLoginSessionIDAsync = async (user: User): Promise<string> => {
  return `${user.username}-${INSTALLATION_ID}-${user.loginDate}`;
};
