import Constants from "expo-constants";
import * as Crypto from "expo-crypto";
import * as Device from "expo-device";
import { Platform } from "react-native";

import { AnswerEntity } from "../entities/AnswerEntity";
import { PingEntity } from "../entities/PingEntity";
import { getPingsAsync, getAnswersAsync } from "./asyncStorage";
import { getSurveyFileAsync } from "./configFiles";
import { getUserAsync, User, storeUserAsync } from "./user";

export async function getServerUrlAsync(): Promise<string> {
  return (await getSurveyFileAsync()).studyInfo.serverURL;
}

type UploadData = {
  patientId: string;
  pings: PingEntity[];
  answers: AnswerEntity[];
};

// If success, return `null`. Else return error message.
export async function registerUserAsync(user: User): Promise<string | null> {
  if (!user.patientId || !user.password) {
    return "You should enter both User ID and password.";
  }

  const request: { [key: string]: any } = {
    new_password: user.password, // Do not reset password
    phone_number: "1234567890",
    device_os: Device.osName,
    os_version: Device.osVersion,
    product: Device.modelName,
    brand: Device.brand,
    manufacturer: Device.manufacturer,
    model: Device.modelId,
    beiwe_version: "1.6.0",
  };

  try {
    let endpoint = "/register_user";
    if (Platform.OS === "ios") {
      endpoint += "/ios/";
    }
    await makePostRequestAsync(endpoint, request, {}, user);
  } catch (e) {
    return `Request error: ${e}.`;
  }

  await storeUserAsync(user);
  return null;
}

export async function getAllDataAsync(): Promise<UploadData> {
  const user = await getUserAsync();
  const pings = await getPingsAsync();
  const answers = await getAnswersAsync();

  const data = {
    patientId: user!.patientId,
    pings,
    answers,
  };
  return data;
}

export async function uploadDataAsync() {
  const user = (await getUserAsync())!;
  const data = await getAllDataAsync();

  try {
    let endpoint = "/ssnl_upload";
    if (Platform.OS === "ios") {
      endpoint += "/ios/";
    }
    const response = await makePostRequestAsync(endpoint, {}, data, user);
    //console.warn(`YAYA ${JSON.stringify(response)}`);
    return { status: "success", response };
  } catch (e) {
    return { status: "error", error: `Request error: ${e}.` };
  }
}

function base64ToBase64URL(input: string): string {
  return input.replace(/\+/g, "-").replace(/\//g, "_");
}

export async function getRequestURLAsync(
  endpoint: string,
  request: { [key: string]: any } = {},
  forUser?: User,
): Promise<string> {
  let user: User | null = forUser || null;
  if (!user) {
    user = await getUserAsync();

    if (user == null) {
      throw new Error("user == null in getRequestURLAsync");
    }
  }

  const passwordHash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    user.password,
    {
      encoding: Crypto.CryptoEncoding.BASE64,
    },
  );
  request["password"] = base64ToBase64URL(passwordHash);
  request["device_id"] = `${user.patientId}-${Constants.installationId}`;
  request["patient_id"] = user.patientId;

  //console.warn(`request is ${JSON.stringify(request)}`);

  const serverUrl = await getServerUrlAsync();
  const query = Object.keys(request)
    .map((k) => encodeURIComponent(k) + "=" + encodeURIComponent(request[k]))
    .join("&");
  const url = `${serverUrl}${endpoint}?${query}`;
  return url;
}

export async function makePostRequestAsync(
  endpoint: string,
  request: { [key: string]: any },
  body?: { [key: string]: any },
  user?: User,
): Promise<any> {
  const headers = {
    "Beiwe-Api-Version": "2",
    Accept: "application/vnd.beiwe.api.v2, application/json",
  };

  const url = await getRequestURLAsync(endpoint, request, user);

  //console.warn("url is " + url);

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (response.status < 200 || response.status >= 400) {
    console.warn(`ERRORREQUEST: ${JSON.stringify(response)}`);

    if (response.status === 401 || response.status === 403) {
      throw new Error(
        `Verification failed.\n\nRequest: ${JSON.stringify(
          request,
        )}.\n\nResponse: ${JSON.stringify(response)}.`,
      );
    }

    throw new Error(
      `Request not successful.\n\nRequest: ${JSON.stringify(
        request,
      )}.\n\nResponse: ${JSON.stringify(response)}.`,
    );
  }

  //console.warn(response);

  return response.json();
}
