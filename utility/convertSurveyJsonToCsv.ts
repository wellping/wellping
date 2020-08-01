import { StudyFile, Question } from "../src/helpers/types";

const questions: StudyFile = require("../config/survey.json");

for (const streamName of Object.keys(questions.streams)) {
  const stream: Question[] = Object.values(questions.streams[streamName]);

  // https://stackoverflow.com/a/31536517/2603230
  // TODO: Automatically fetch all keys from the question types.
  // TODO: The following is built for an older type of survey file. Might need to update.
  const header = [
    "id",
    "question",
    "type",
    "next",
    "choices",
    "specialCasesStartId",
    "randomizeChoicesOrder",
    "branchStartId",
    "eachId",
    "max",
    "maxMinus",
    "repeatedItemStartId",
    "fallbackItemStartId",
    "indexName",
    "variableName",
    "slider",
    "defaultValueFromQuestionId",
    "condition",
    "branchStartId",
  ];
  const csv = stream.map((row) =>
    header
      .map((fieldName) => {
        const value = (row as any)[fieldName];
        if (value == null) {
          return "";
        }
        if (typeof value !== "object") {
          if (typeof value === "string") {
            // Escape quotes inside the string.
            return JSON.stringify(value.replace(/"/g, '""'));
          }
          return JSON.stringify(value);
        }
        // So that the object with quotes inside will be shown normally in CSV.
        // https://stackoverflow.com/questions/8847766/how-to-convert-json-to-csv-format-and-store-in-a-variable#comment92206522_31536517
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      })
      .join(","),
  );
  csv.unshift(header.join(","));
  const results = csv.join("\r\n");

  // https://stackoverflow.com/a/2497040/2603230
  const fs = require("fs");
  fs.writeFile(`./csvs/${streamName}.csv`, results, function (err: any) {
    if (err) {
      return console.error(err);
    }
    console.log(`${streamName}.csv was saved!`);
  });
}
