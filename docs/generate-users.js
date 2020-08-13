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

async function generateUsersCSV(numberOfUsers) {
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

  console.log(new Date());
  const hashedPasswords = [];
  await Promise.all(
    passwords.map(async (password) => {
      var bcrypt = dcodeIO.bcrypt;
      document.title = "generated the " + hashedPasswords.length;
      var hashedPassword = await bcrypt.hash(password, 8);
      hashedPasswords.push(btoa(hashedPassword));
    }),
  );
  console.log(new Date());

  // https://stackoverflow.com/a/14966131/2603230
  let usersCsv = "";
  for (let i = 0; i < numberOfUsers; i++) {
    usersCsv +=
      userIds[i] +
      "," +
      userIds[i] +
      "@wellping.ssnl.stanford.edu,false," +
      hashedPasswords[i] +
      ",,,,,,,,,,,,,,,,,,,,," +
      "\r\n";
  }
  return usersCsv;
}
