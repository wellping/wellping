/**
 * Please contact SSNL at http://ssnl.stanford.edu/contact if you wish to add
 * your study to the whitelist.
 */

// Not including local file fake URLs (e.g., WELLPING_LOCAL_DEBUG_URL) as they
// are always allowed.
export const STUDY_FILE_URL_PREFIXES_WHITELIST = [
  "https://wellping.github.io/",
  "https://stanfordsocialneurosciencelab.github.io/",
  "https://ssnl.lifesensing.org/",
];
