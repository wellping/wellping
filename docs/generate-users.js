/* global document, URL, Blob, dcodeIO, btoa */

// https://stackoverflow.com/a/1349426/2603230
function generateId(length, includeUppercaseLetters) {
  var result = "";
  var characters = "abcdefghijklmnopqrstuvwxyz0123456789";
  if (includeUppercaseLetters) {
    characters += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  }
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

// https://stackoverflow.com/a/24922761/2603230
function downloadCsv(csvText, filename) {
  const link = document.createElement("a");
  if (link.download !== undefined) {
    // feature detection
    // Browsers that support HTML5 download attribute

    const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else {
    const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvText);
    window.open(encodedUri);
  }
}

function addButtonToDownloadDiv(csvText, filename, text) {
  const downloadDiv = document.getElementById("user-generations-download");
  const button = document.createElement("button");
  button.onclick = function () {
    downloadCsv(csvText, filename);
    return false;
  };
  button.innerText = "Download " + text;
  downloadDiv.appendChild(button);
}

async function generateUsersCSVsAsync(numberOfUsers) {
  const userIds = [];
  for (let i = 0; i < numberOfUsers; i++) {
    // We do not want to include uppercase letters in username because Firebase
    // Auth's email is case-insensitive.
    const userId = generateId(8, false);
    if (userIds.indexOf(userId) === -1) {
      userIds.push(userId);
    }
  }

  const passwords = [];
  for (let i = 0; i < numberOfUsers; i++) {
    // Password, unlike username (see above), can include uppercase letters.
    const password = generateId(8, true);
    if (
      userIds.indexOf(password) === -1 && // Cannot be same as user ID.
      passwords.indexOf(password) === -1
    ) {
      passwords.push(password);
    }
  }

  const hashedPasswords = [];
  await Promise.all(
    passwords.map(async (password) => {
      var bcrypt = dcodeIO.bcrypt;
      // We don't actually need the password hash here to be very secure, as
      // Firebase will re-hash the password once the user logs in for the first
      // time.
      // Ref: https://firebase.google.com/docs/auth/admin/import-users#usage
      var hashedPassword = await bcrypt.hash(password, 2);
      hashedPasswords.push([btoa(hashedPassword), password]);
    }),
  );

  // https://stackoverflow.com/a/14966131/2603230
  let firebaseAuthImportCsv = "";
  let usersCsv = "";
  for (let i = 0; i < numberOfUsers; i++) {
    firebaseAuthImportCsv +=
      userIds[i] +
      "," +
      userIds[i] +
      // MARK: FIREBASE_AUTH_VERIFIED_FICTIONAL_EMAIL_NOTE
      // This fictional email address should be imported as verified (hence the
      // `true` value), so that should any malicious person tries to create a
      // new account, they will not be able to interact with the database (as
      // the database rules require a user to have a verified `@user.wellpingssnl`
      // email suffix, which is impossible to obtain unless they are generated
      // here.)
      // See also `FIREBASE_LOGIN_EMAIL_DOMAIN` constant.
      "@user.wellpingssnl,true," +
      hashedPasswords[i][0] +
      ",,,,,,,,,,,,,,,,,,,,," +
      "\r\n";

    usersCsv += userIds[i] + "," + hashedPasswords[i][1] + "\r\n";
  }

  return [firebaseAuthImportCsv, usersCsv];
}

function generateButtonOnClick(numberOfUsers) {
  const downloadDiv = document.getElementById("user-generations-download");
  downloadDiv.innerText =
    "Generating " +
    numberOfUsers +
    " username/password combinations... (This may take a while.)";

  generateUsersCSVsAsync(numberOfUsers).then((csvFile) => {
    downloadDiv.innerText =
      "Done! " + numberOfUsers + " username/password combinations generated.";

    addButtonToDownloadDiv(
      csvFile[0],
      "import_to_firebase_auth.csv",
      "a csv file for Firebase import",
    );
    addButtonToDownloadDiv(
      csvFile[1],
      "users.csv",
      "a csv file containing username/password combinations (for your reference)",
    );
  });
}
