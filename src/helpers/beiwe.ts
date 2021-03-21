/**
 * Unless otherwise noted, precondition for every function in the file is:
 * `useBeiwe(studyInfo) === true`.
 */

import Constants from "expo-constants";
import * as Crypto from "expo-crypto";
import * as Device from "expo-device";
import { Platform } from "react-native";

import { UploadData } from "./dataUpload";
import { JS_VERSION_NUMBER } from "./debug";
import { User, secureGetUserAsync } from "./secureStore/user";
import { DataUploadServerResponse, getBeiweServerConfig } from "./server";
import { getStudyInfoAsync } from "./studyFile";

/**
 * If success, returns nothing.
 * If error, throws error message.
 */
export async function beiweLoginAsync(user: User): Promise<void> {
  const request: { [key: string]: any } = {
    new_password: user.password, // Do not reset password
    phone_number: "1234567890", // Doesn't matter
    device_os: Device.osName,
    os_version: Device.osVersion,
    product: Device.modelName,
    brand: Device.brand,
    manufacturer: Device.manufacturer,
    model: Device.modelId,
    beiwe_version: `WellPing${JS_VERSION_NUMBER}`,
  };

  try {
    let endpoint = "/register_user";
    if (Platform.OS === "ios") {
      endpoint += "/ios/";
    }
    await makePostRequestAsync({
      endpoint,
      request,
      body: {},
      user,
    });
  } catch (e) {
    throw new Error(`Request error: ${e}.`);
  }
}

/**
 * Returns a `DataUploadServerResponse` if successful.
 * Throws an error otherwise.
 */
export async function beiweUploadDataForUserAsync(
  data: UploadData,
  startUploading: () => void,
  endUploading: (errorMessage?: string) => void,
): Promise<DataUploadServerResponse> {
  startUploading();

  const user = await secureGetUserAsync();
  if (user === null) {
    endUploading("BW: U=N");
    throw new Error(
      "secureGetUserAsync() === null in beiweUploadDataForUserAsync",
    );
  }

  try {
    const endpoint = "/ssnl_upload";
    const response = await makePostRequestAsync({
      endpoint,
      request: {},
      body: data,
      user,
      throwShortError: true,
    });
    //console.log(`${JSON.stringify(response)}`);
    endUploading();
    return response as DataUploadServerResponse;
  } catch (e) {
    endUploading(`BW: ${e.message}`);
    throw e;
  }
}

function base64ToBase64URL(input: string): string {
  return input.replace(/\+/g, "-").replace(/\//g, "_");
}

async function getRequestURLAsync(
  endpoint: string,
  request: { [key: string]: any } = {},
  forUser?: User,
): Promise<string> {
  let user: User | null = forUser || null;
  if (!user) {
    user = await secureGetUserAsync();

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
  request["device_id"] = `${user.username}-${Constants.installationId}`;
  request["username"] = user.username;
  request["patient_id"] = user.username;

  //console.warn(`request is ${JSON.stringify(request)}`);

  const studyInfo = await getStudyInfoAsync();
  const serverUrl = getBeiweServerConfig(studyInfo).serverUrl;
  const query = Object.keys(request)
    .map((k) => encodeURIComponent(k) + "=" + encodeURIComponent(request[k]))
    .join("&");
  const url = `${serverUrl}${endpoint}?${query}`;
  return url;
}

async function makePostRequestAsync({
  endpoint,
  request,
  body,
  user,
  throwShortError,
}: {
  endpoint: string;
  request: { [key: string]: any };
  body?: { [key: string]: any };
  user?: User;
  throwShortError?: boolean;
}): Promise<any> {
  const headers = {
    "Beiwe-Api-Version": "2",
    "WellPing-JSVersion": JS_VERSION_NUMBER,
    Accept: "*/*",
    "Content-Type": "application/json",
  };

  const url = await getRequestURLAsync(endpoint, request, user);

  //console.warn("url is " + url);

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (response.status < 200 || response.status >= 400) {
    if (response.status === 401 || response.status === 403) {
      throw new Error(
        throwShortError
          ? `VF${response.status}`
          : `Verification failed.\n\nRequest: ${JSON.stringify(
              request,
            )}.\n\nResponse: ${JSON.stringify(response)}.`,
      );
    }

    throw new Error(
      throwShortError
        ? `OF${response.status}`
        : `Request not successful.\n\nRequest: ${JSON.stringify(
            request,
          )}.\n\nResponse: ${JSON.stringify(response)}.`,
    );
  }

  //console.warn(response);

  return response.json();
}
