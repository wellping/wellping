import * as aesjs from "aes-js";
import * as Crypto from "expo-crypto";

import { getUserAsync } from "../asyncStorage/user";

function aesJsEncryptString(text: string, key: aesjs.ByteSource): string {
  // https://github.com/ricmoo/aes-js#ctr---counter-recommended

  // Convert text to bytes
  const textBytes = aesjs.utils.utf8.toBytes(text);

  const aesCtr = new aesjs.ModeOfOperation.ctr(key);
  const encryptedBytes = aesCtr.encrypt(textBytes);

  // To print or store the binary data, you may convert it to hex
  const encryptedHex = aesjs.utils.hex.fromBytes(encryptedBytes);
  return encryptedHex;
}

function aesJsDecryptString(
  encryptedHex: string,
  key: aesjs.ByteSource,
): string {
  // https://github.com/ricmoo/aes-js#ctr---counter-recommended

  // When ready to decrypt the hex string, convert it back to bytes
  const encryptedBytes = aesjs.utils.hex.toBytes(encryptedHex);

  const aesCtr = new aesjs.ModeOfOperation.ctr(key);
  const decryptedBytes = aesCtr.decrypt(encryptedBytes);

  // Convert our bytes back into text
  const decryptedText = aesjs.utils.utf8.fromBytes(decryptedBytes);
  return decryptedText;
}

/**
 * Returns the key that should be used to encrypt and decrypt the string.
 */
async function getKeyForUser(): Promise<Uint8Array> {
  const user = await getUserAsync();
  if (user === null) {
    throw new Error("getKeyForUser: getUserAsync === null");
  }

  const hexKey = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${user.username} ${user.password}`,
  );
  const key = aesjs.utils.hex.toBytes(hexKey);
  return key;
}

/**
 * Precondition: `getUserAsync !== null`
 */
export async function encryptStringAsync(text: string): Promise<string> {
  return aesJsEncryptString(text, await getKeyForUser());
}

/**
 * Precondition: `getUserAsync !== null`
 */
export async function decryptStringAsync(
  encryptedHex: string,
): Promise<string> {
  return aesJsDecryptString(encryptedHex, await getKeyForUser());
}
