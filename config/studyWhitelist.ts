/**
 * Please contact SSNL at https://ssnl.stanford.edu/contact if you wish to add
 * your domain to the whitelist.
 */

// Not including local file fake URLs (e.g., WELLPING_LOCAL_DEBUG_URL) as they
// are always allowed.
export const STUDY_FILE_URL_PREFIXES_WHITELIST = [
  "https://wellping.github.io/",
  "https://stanfordsocialneurosciencelab.github.io/",
  "https://ssnl.lifesensing.org/",
  "https://wellping.communitiesproject.stanfordsnl.org/",
  "https://raw.githubusercontent.com/"
];
