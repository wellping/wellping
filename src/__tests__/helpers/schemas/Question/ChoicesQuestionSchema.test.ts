import { QuestionType } from "../../../../helpers/helpers";
import {
  ChoicesWithMultipleAnswersQuestionSchema,
  ChoicesWithSingleAnswerQuestionSchema,
  ChoicesQuestionSchema,
} from "../../../../helpers/schemas/Question";

describe("ChoicesQuestionSchema", () => {
  test("type", () => {
    const question = {
      id: "Feel_Ideal",
      question: "Choice question",
      next: "Next_Question",
      choices: [
        { key: "hello", value: "Hello" },
        { key: "world", value: "World" },
      ],
    };

    expect(() => {
      ChoicesQuestionSchema.parse({
        ...question,
        type: QuestionType.ChoicesWithSingleAnswer,
      });
    }).not.toThrowError();

    expect(() => {
      ChoicesQuestionSchema.parse({
        ...question,
        type: QuestionType.ChoicesWithMultipleAnswers,
      });
    }).not.toThrowError();

    expect(() => {
      ChoicesQuestionSchema.parse({
        ...question,
        type: QuestionType.HowLongAgo,
      });
    }).toThrowErrorMatchingSnapshot();
  });

  describe("choices", () => {
    const question = {
      id: "Feel_Ideal",
      type: QuestionType.ChoicesWithSingleAnswer,
      question: "Choice question",
      next: "Next_Question",
    };

    test("should not be undefined", () => {
      expect(() => {
        ChoicesQuestionSchema.parse({
          ...question,
        });
      }).toThrowErrorMatchingSnapshot();
    });

    test("should not be empty", () => {
      expect(() => {
        ChoicesQuestionSchema.parse({
          ...question,
          choices: [],
        });
      }).toThrowErrorMatchingSnapshot();
    });

    test("should be ChoiceSchema objects", () => {
      expect(() => {
        ChoicesQuestionSchema.parse({
          ...question,
          choices: [
            { key: "hello", value: "Hello" },
            { key: "world", value: "World" },
          ],
        });
      }).not.toThrowError();

      expect(() => {
        ChoicesQuestionSchema.parse({
          ...question,
          choices: ["hello", "world"],
        });
      }).toThrowErrorMatchingSnapshot("strings");

      expect(() => {
        ChoicesQuestionSchema.parse({
          ...question,
          choices: [2, 3, 5],
        });
      }).toThrowErrorMatchingSnapshot("numbers");
    });
  });

  describe("specialCasesStartId", () => {
    const question = {
      id: "Feel_Ideal",
      type: QuestionType.ChoicesWithSingleAnswer,
      question: "Choice question",
      choices: [
        { key: "hello", value: "Hello" },
        { key: "world", value: "World" },
      ],
      next: "Next_Question",
    };

    test("can be undefined", () => {
      expect(() => {
        ChoicesQuestionSchema.parse({
          ...question,
        });
      }).not.toThrowError();
    });

    test("should not be null", () => {
      expect(() => {
        ChoicesQuestionSchema.parse({
          ...question,
          specialCasesStartId: null,
        });
      }).toThrowErrorMatchingSnapshot();
    });

    test("can be empty object", () => {
      expect(() => {
        ChoicesQuestionSchema.parse({
          ...question,
          specialCasesStartId: {},
        });
      }).not.toThrowError();
    });

    test(`can include only "_pna"`, () => {
      expect(() => {
        ChoicesQuestionSchema.parse({
          ...question,
          specialCasesStartId: {
            _pna: "hello_world",
          },
        });
      }).not.toThrowError();
    });

    test(`can include only choices keys`, () => {
      expect(() => {
        ChoicesQuestionSchema.parse({
          ...question,
          specialCasesStartId: {
            hello: "hello_world",
          },
        });
      }).not.toThrowError();
    });

    test(`can include both "_pna" and choices keys`, () => {
      expect(() => {
        ChoicesQuestionSchema.parse({
          ...question,
          specialCasesStartId: {
            hello: "hello_world",
            _pna: "goodbye",
          },
        });
      }).not.toThrowError();
    });

    test(`cannot include non-choices key`, () => {
      expect(() => {
        ChoicesQuestionSchema.parse({
          ...question,
          specialCasesStartId: {
            notakey: "nonono",
          },
        });
      }).toThrowErrorMatchingSnapshot("non-choices key only");

      expect(() => {
        ChoicesQuestionSchema.parse({
          ...question,
          specialCasesStartId: {
            notakey: "nonono",
            world: "stillno",
          },
        });
      }).toThrowErrorMatchingSnapshot("non-choices key with choice key");

      expect(() => {
        ChoicesQuestionSchema.parse({
          ...question,
          specialCasesStartId: {
            notakey: "nonono",
            _pna: "goodbye",
          },
        });
      }).toThrowErrorMatchingSnapshot(`non-choices key with "_pna"`);
    });

    test(`question id can be null`, () => {
      expect(() => {
        ChoicesQuestionSchema.parse({
          ...question,
          specialCasesStartId: {
            hello: "new_world",
            _pna: null,
          },
        });
      }).not.toThrowError();

      expect(() => {
        ChoicesQuestionSchema.parse({
          ...question,
          specialCasesStartId: {
            world: null,
          },
        });
      }).not.toThrowError();

      expect(() => {
        ChoicesQuestionSchema.parse({
          ...question,
          specialCasesStartId: {
            _pna: null,
          },
        });
      }).not.toThrowError();
    });
  });

  describe("randomizeChoicesOrder", () => {
    const question = {
      id: "Feel_Ideal",
      type: QuestionType.ChoicesWithSingleAnswer,
      question: "Choice question",
      choices: [
        { key: "hello", value: "Hello" },
        { key: "world", value: "World" },
      ],
      next: "Next_Question",
    };

    test("can be undefined", () => {
      expect(() => {
        ChoicesQuestionSchema.parse({
          ...question,
        });
      }).not.toThrowError();
    });

    test("should not be null", () => {
      expect(() => {
        ChoicesQuestionSchema.parse({
          ...question,
          randomizeChoicesOrder: null,
        });
      }).toThrowErrorMatchingSnapshot();
    });

    test("can be true and false", () => {
      expect(() => {
        ChoicesQuestionSchema.parse({
          ...question,
          randomizeChoicesOrder: true,
        });
      }).not.toThrowError();

      expect(() => {
        ChoicesQuestionSchema.parse({
          ...question,
          randomizeChoicesOrder: false,
        });
      }).not.toThrowError();
    });
  });

  describe("randomizeExceptForChoiceIds", () => {
    const question = {
      id: "Feel_Ideal",
      type: QuestionType.ChoicesWithSingleAnswer,
      question: "Choice question",
      choices: [
        { key: "hello", value: "Hello" },
        { key: "world", value: "World" },
      ],
      randomizeChoicesOrder: true,
      next: "Next_Question",
    };

    test("can be undefined", () => {
      expect(() => {
        ChoicesQuestionSchema.parse({
          ...question,
        });
      }).not.toThrowError();
    });

    test("should not be null", () => {
      expect(() => {
        ChoicesQuestionSchema.parse({
          ...question,
          randomizeExceptForChoiceIds: null,
        });
      }).toThrowErrorMatchingSnapshot();
    });

    test("should not be set if `randomizeChoicesOrder` is false", () => {
      expect(() => {
        ChoicesQuestionSchema.parse({
          ...question,
          randomizeChoicesOrder: false,
          randomizeExceptForChoiceIds: ["hello"],
        });
      }).toThrowErrorMatchingSnapshot();
    });

    test("can be empty", () => {
      expect(() => {
        ChoicesQuestionSchema.parse({
          ...question,
          randomizeExceptForChoiceIds: [],
        });
      }).not.toThrowError();
    });

    test("can be choices keys", () => {
      expect(() => {
        ChoicesQuestionSchema.parse({
          ...question,
          randomizeExceptForChoiceIds: ["hello", "world"],
        });
      }).not.toThrowError();

      expect(() => {
        ChoicesQuestionSchema.parse({
          ...question,
          randomizeExceptForChoiceIds: ["world"],
        });
      }).not.toThrowError();
    });

    test("should not be non-choices keys", () => {
      expect(() => {
        ChoicesQuestionSchema.parse({
          ...question,
          randomizeExceptForChoiceIds: ["nono", "world"],
        });
      }).toThrowErrorMatchingSnapshot("with choice keys");

      expect(() => {
        ChoicesQuestionSchema.parse({
          ...question,
          randomizeExceptForChoiceIds: ["haha"],
        });
      }).toThrowErrorMatchingSnapshot("without choice keys");
    });
  });
});

describe("ChoicesWithSingleAnswerQuestionSchema", () => {
  test("type", () => {
    const question = {
      id: "Feel_Ideal",
      question: "Choice question",
      next: "Next_Question",
      choices: [
        { key: "hello", value: "Hello" },
        { key: "world", value: "World" },
      ],
    };

    expect(() => {
      ChoicesWithSingleAnswerQuestionSchema.parse({
        ...question,
        type: QuestionType.ChoicesWithSingleAnswer,
      });
    }).not.toThrowError();

    expect(() => {
      ChoicesWithSingleAnswerQuestionSchema.parse({
        ...question,
        type: QuestionType.ChoicesWithMultipleAnswers,
      });
    }).toThrowErrorMatchingSnapshot("ChoicesWithMultipleAnswers");

    expect(() => {
      ChoicesWithSingleAnswerQuestionSchema.parse({
        ...question,
        type: QuestionType.YesNo,
      });
    }).toThrowErrorMatchingSnapshot("other");
  });
});

describe("ChoicesWithMultipleAnswersQuestionSchema", () => {
  test("type", () => {
    const question = {
      id: "Feel_Ideal",
      question: "Choice question",
      next: "Next_Question",
      choices: [
        { key: "hello", value: "Hello" },
        { key: "world", value: "World" },
      ],
    };

    expect(() => {
      ChoicesWithMultipleAnswersQuestionSchema.parse({
        ...question,
        type: QuestionType.ChoicesWithMultipleAnswers,
      });
    }).not.toThrowError();

    expect(() => {
      ChoicesWithMultipleAnswersQuestionSchema.parse({
        ...question,
        type: QuestionType.ChoicesWithSingleAnswer,
      });
    }).toThrowErrorMatchingSnapshot("ChoicesWithSingleAnswer");

    expect(() => {
      ChoicesWithMultipleAnswersQuestionSchema.parse({
        ...question,
        type: QuestionType.YesNo,
      });
    }).toThrowErrorMatchingSnapshot("other");
  });
});
