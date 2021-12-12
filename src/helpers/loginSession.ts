import { getInstallationIDAsync } from "./debug";
import { User } from "./secureStore/user";

export const getLoginSessionIDAsync = async (user: User): Promise<string> => {
  return `${user.username}-${await getInstallationIDAsync()}-${user.loginDate}`;
};
