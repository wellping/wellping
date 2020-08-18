/* global document, URL, Blob, dcodeIO, btoa */

// https://stackoverflow.com/a/1349426/2603230
function generateId(length) {
  var result = "";
  var characters = "abcdefghijklmnopqrstuvwxyz0123456789";
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

async function generateUsersCSVs(numberOfUsers) {
  const userIds = [];
  for (let i = 0; i < numberOfUsers; i++) {
    const userId = generateId(8);
    if (userIds.indexOf(userId) === -1) {
      userIds.push(userId);
    }
  }

  const passwords = [];
  for (let i = 0; i < numberOfUsers; i++) {
    const password = generateId(8);
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
      var hashedPassword = await bcrypt.hash(password, 8);
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
      // See `FIREBASE_LOGIN_EMAIL_DOMAIN` constant.
      // This fictional email address should also be verified, so that if any
      // malicious person tries to create a new account, they will not be able
      // to interact with the database (as the database rules will require a
      // user to have a verified `@user.wellpingssnl` email suffix, which is
      // impossible to obtain unless they are generated here.)
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
  downloadDiv.innerText = "Generating... (This may take a while.)";
  generateUsersCSVs(numberOfUsers).then((csvFile) => {
    downloadDiv.innerText = "Done!";

    addButtonToDownloadDiv(
      csvFile[0],
      "import_to_firebase_auth.csv",
      "Firebase import csv",
    );
    addButtonToDownloadDiv(csvFile[1], "users.csv", "user ID and password");
  });
}
