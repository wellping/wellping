import { QuestionType } from "../../../../helpers/helpers";
import { MultipleTextQuestionSchema } from "../../../../helpers/schemas/Question";

describe("MultipleTextQuestionSchema", () => {
  test("type", () => {
    const question = {
      id: "Feel_Ideal",
      question: "Multiple text question",
      indexName: "INDEX",
      variableName: "TARGET_NAME",
      max: 3,
      next: "Next_Question",
    };

    expect(() => {
      MultipleTextQuestionSchema.parse({
        ...question,
        type: QuestionType.MultipleText,
      });
    }).not.toThrowError();

    expect(() => {
      MultipleTextQuestionSchema.parse({
        ...question,
        type: QuestionType.HowLongAgo,
      });
    }).toThrowErrorMatchingSnapshot();
  });

  describe("indexName", () => {
    const question = {
      id: "Feel_Ideal",
      type: QuestionType.MultipleText,
      question: "Multiple text question",
      variableName: "TARGET_NAME",
      max: 3,
      next: "Next_Question",
    };

    test("should not be undefined", () => {
      expect(() => {
        MultipleTextQuestionSchema.parse({
          ...question,
        });
      }).toThrowErrorMatchingSnapshot();
    });

    test("should not be null", () => {
      expect(() => {
        MultipleTextQuestionSchema.parse({
          ...question,
          indexName: null,
        });
      }).toThrowErrorMatchingSnapshot();
    });

    test("should not be empty", () => {
      expect(() => {
        MultipleTextQuestionSchema.parse({
          ...question,
          indexName: "",
        });
      }).toThrowErrorMatchingSnapshot();
    });

    test("can be any string", () => {
      expect(() => {
        MultipleTextQuestionSchema.parse({
          ...question,
          indexName: "INDEX",
        });
      }).not.toThrowError();

      expect(() => {
        MultipleTextQuestionSchema.parse({
          ...question,
          indexName: "hello_world",
        });
      }).not.toThrowError();

      expect(() => {
        MultipleTextQuestionSchema.parse({
          ...question,
          indexName: "HELLO WORLD",
        });
      }).not.toThrowError();

      expect(() => {
        MultipleTextQuestionSchema.parse({
          ...question,
          indexName: "__+O+__",
        });
      }).not.toThrowError();
    });
  });

  describe("variableName", () => {
    const question = {
      id: "Feel_Ideal",
      type: QuestionType.MultipleText,
      question: "Multiple text question",
      indexName: "INDEX",
      max: 3,
      next: "Next_Question",
    };

    test("should not be undefined", () => {
      expect(() => {
        MultipleTextQuestionSchema.parse({
          ...question,
        });
      }).toThrowErrorMatchingSnapshot();
    });

    test("should not be null", () => {
      expect(() => {
        MultipleTextQuestionSchema.parse({
          ...question,
          variableName: null,
        });
      }).toThrowErrorMatchingSnapshot();
    });

    test("should not be empty", () => {
      expect(() => {
        MultipleTextQuestionSchema.parse({
          ...question,
          variableName: "",
        });
      }).toThrowErrorMatchingSnapshot();
    });

    test("can be any string", () => {
      expect(() => {
        MultipleTextQuestionSchema.parse({
          ...question,
          variableName: "TARGET",
        });
      }).not.toThrowError();

      expect(() => {
        MultipleTextQuestionSchema.parse({
          ...question,
          variableName: "target_name",
        });
      }).not.toThrowError();

      expect(() => {
        MultipleTextQuestionSchema.parse({
          ...question,
          variableName: "HELLO WORLD",
        });
      }).not.toThrowError();

      expect(() => {
        MultipleTextQuestionSchema.parse({
          ...question,
          variableName: "__+O+__",
        });
      }).not.toThrowError();
    });
  });

  describe("placeholder", () => {
    const question = {
      id: "Feel_Ideal",
      type: QuestionType.MultipleText,
      question: "Multiple text question",
      variableName: "TARGET_NAME",
      indexName: "INDEX",
      max: 3,
      next: "Next_Question",
    };

    test("can be undefined", () => {
      expect(() => {
        MultipleTextQuestionSchema.parse({
          ...question,
        });
      }).not.toThrowError();
    });

    test("should not be null", () => {
      expect(() => {
        MultipleTextQuestionSchema.parse({
          ...question,
          placeholder: null,
        });
      }).toThrowErrorMatchingSnapshot();
    });

    test("can be empty", () => {
      expect(() => {
        MultipleTextQuestionSchema.parse({
          ...question,
          placeholder: "",
        });
      }).not.toThrowError();
    });

    test("can be any string", () => {
      expect(() => {
        MultipleTextQuestionSchema.parse({
          ...question,
          variableName: "Enter a name...",
        });
      }).not.toThrowError();

      expect(() => {
        MultipleTextQuestionSchema.parse({
          ...question,
          variableName: "Do something!",
        });
      }).not.toThrowError();

      expect(() => {
        MultipleTextQuestionSchema.parse({
          ...question,
          variableName: "千里之行始于足下",
        });
      }).not.toThrowError();

      expect(() => {
        MultipleTextQuestionSchema.parse({
          ...question,
          variableName: "???***!!!---",
        });
      }).not.toThrowError();
    });
  });

  describe("choices", () => {
    const question = {
      id: "Feel_Ideal",
      type: QuestionType.MultipleText,
      question: "Multiple text question",
      variableName: "TARGET_NAME",
      indexName: "INDEX",
      max: 3,
      next: "Next_Question",
    };

    test("can be undefined", () => {
      expect(() => {
        MultipleTextQuestionSchema.parse({
          ...question,
        });
      }).not.toThrowError();
    });

    test("should not be null", () => {
      expect(() => {
        MultipleTextQuestionSchema.parse({
          ...question,
          choices: null,
        });
      }).toThrowErrorMatchingSnapshot();
    });

    test("should not be anything besides array and string", () => {
      expect(() => {
        MultipleTextQuestionSchema.parse({
          ...question,
          choices: 4,
        });
      }).toThrowErrorMatchingSnapshot("number");

      expect(() => {
        MultipleTextQuestionSchema.parse({
          ...question,
          choices: {
            "HELLO WORLD": "hi!",
          },
        });
      }).toThrowErrorMatchingSnapshot("object");
    });

    test("should not be empty array", () => {
      expect(() => {
        MultipleTextQuestionSchema.parse({
          ...question,
          choices: [],
        });
      }).toThrowErrorMatchingSnapshot();
    });

    test("should not be an array of string", () => {
      expect(() => {
        MultipleTextQuestionSchema.parse({
          ...question,
          choices: ["hello", "world"],
        });
      }).toThrowErrorMatchingSnapshot();
    });

    // TODO: WILL ONLY ACCEPT URL / ARRAY IN THE FUTURE
    test("TODO: should not be string other than `NAMES`", () => {
      expect(() => {
        MultipleTextQuestionSchema.parse({
          ...question,
          choices: "NAMES",
        });
      }).not.toThrowError();

      expect(() => {
        MultipleTextQuestionSchema.parse({
          ...question,
          choices: "helloworld",
        });
      }).toThrowErrorMatchingSnapshot("string");

      expect(() => {
        MultipleTextQuestionSchema.parse({
          ...question,
          choices: "https://example.com/choices.json",
        });
      }).toThrowErrorMatchingSnapshot("url");
    });

    test("can be any Choice array", () => {
      expect(() => {
        MultipleTextQuestionSchema.parse({
          ...question,
          choices: [
            {
              key: "hello",
              value: "HELLO WORLD!",
            },
          ],
        });
      }).not.toThrowError();

      expect(() => {
        MultipleTextQuestionSchema.parse({
          ...question,
          choices: [
            {
              key: "hello",
              value: "HELLO!",
            },
            {
              key: "arefly",
              value: "arefly.com!",
            },
            {
              key: "world",
              value: "WORLD!",
            },
          ],
        });
      }).not.toThrowError();
    });
  });

  describe("forceChoice", () => {
    const question = {
      id: "Feel_Ideal",
      type: QuestionType.MultipleText,
      question: "Multiple text question",
      variableName: "TARGET_NAME",
      indexName: "INDEX",
      max: 3,
      choices: [
        {
          key: "hello",
          value: "HELLO!",
        },
        {
          key: "arefly",
          value: "arefly.com!",
        },
        {
          key: "world",
          value: "WORLD!",
        },
      ],
      next: "Next_Question",
    };

    test("can be undefined", () => {
      expect(() => {
        MultipleTextQuestionSchema.parse({
          ...question,
        });
      }).not.toThrowError();
    });

    test("should not be null", () => {
      expect(() => {
        MultipleTextQuestionSchema.parse({
          ...question,
          forceChoice: null,
        });
      }).toThrowErrorMatchingSnapshot();
    });

    test("should not be anything other than boolean", () => {
      expect(() => {
        MultipleTextQuestionSchema.parse({
          ...question,
          forceChoice: "true",
        });
      }).toThrowErrorMatchingSnapshot("string true");

      expect(() => {
        MultipleTextQuestionSchema.parse({
          ...question,
          forceChoice: 1,
        });
      }).toThrowErrorMatchingSnapshot("number");
    });

    test("can be true of false", () => {
      expect(() => {
        MultipleTextQuestionSchema.parse({
          ...question,
          forceChoice: true,
        });
      }).not.toThrowError();

      expect(() => {
        MultipleTextQuestionSchema.parse({
          ...question,
          forceChoice: false,
        });
      }).not.toThrowError();
    });

    test("should not be set if choices is not set", () => {
      expect(() => {
        MultipleTextQuestionSchema.parse({
          ...question,
          choices: undefined,
          forceChoice: true,
        });
      }).toThrowErrorMatchingSnapshot("true");

      expect(() => {
        MultipleTextQuestionSchema.parse({
          ...question,
          choices: undefined,
          forceChoice: false,
        });
      }).toThrowErrorMatchingSnapshot("false");

      expect(() => {
        MultipleTextQuestionSchema.parse({
          ...question,
          choices: undefined,
          forceChoice: undefined,
        });
      }).not.toThrowError();
    });
  });
});
