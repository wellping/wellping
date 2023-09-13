import { getInstallationIDAsync } from "./debug";
import { User } from "./secureStore/user";

export const getLoginSessionIDAsync = async (user: User): Promise<string> => {
  return `${user.username}-${await getInstallationIDAsync()}-${user.loginDate}`;
};


// loginCode is __debug__-__test__-https://debug.local.wellping.ssnl.stanford.edu/DEBUG_STUDY.json