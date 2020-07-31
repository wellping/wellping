import { QuestionType } from "../../../helpers/helpers";
import {
  QuestionSchema,
  SliderQuestionSchema,
  QuestionTypeSchema,
  ChoicesQuestionSchema,
} from "../../../helpers/schemas/Question";

describe("QuestionTypeSchema", () => {
  test("should not change", () => {
    expect(QuestionTypeSchema).toMatchInlineSnapshot(`
      Object {
        "t": "enum",
        "values": Array [
          "Slider",
          "ChoicesWithSingleAnswer",
          "ChoicesWithMultipleAnswers",
          "YesNo",
          "MultipleText",
          "HowLongAgo",
          "Branch",
          "BranchWithRelativeComparison",
        ],
      }
    `);
  });

  test(".enum should be equal to QuestionType", () => {
    expect(QuestionTypeSchema.enum).toStrictEqual(QuestionType);
  });
});

describe("QuestionSchema", () => {
  test("empty", () => {
    expect(() => {
      QuestionSchema.parse({});
    }).toThrowErrorMatchingSnapshot();
  });

  test("incomplete fields", () => {
    expect(() => {
      QuestionSchema.parse({
        id: "Feel_Ideal",
        type: QuestionType.Slider,
        question: "(This is missing `slider` field)",
        defaultValueFromQuestionId: "Feel_Current",
        next: "Stressor",
      });
    }).toThrowErrorMatchingSnapshot();
  });

  test("next should not be undefined", () => {
    expect(() => {
      QuestionSchema.parse({
        id: "Feel_Ideal",
        type: QuestionType.Slider,
        question: "(This is missing `next` field)",
        defaultValueFromQuestionId: "Feel_Current",
        slider: ["left", "right"],
      });
    }).toThrowErrorMatchingSnapshot();

    expect(() => {
      QuestionSchema.parse({
        id: "Feel_Ideal",
        type: QuestionType.Slider,
        question: "Good question",
        defaultValueFromQuestionId: "Feel_Current",
        slider: ["left", "right"],
        next: null,
      });
    }).not.toThrowError();

    expect(() => {
      QuestionSchema.parse({
        id: "Feel_Ideal",
        type: QuestionType.Slider,
        question: "Good question",
        defaultValueFromQuestionId: "Feel_Current",
        slider: ["left", "right"],
        next: "Next_Question",
      });
    }).not.toThrowError();
  });

  test("invalid type", () => {
    expect(() => {
      QuestionSchema.parse({
        id: "invalid_question",
        type: "OwO",
        question: "Invalid question!",
        next: null,
      });
    }).toThrowErrorMatchingSnapshot();
  });

  test("missing type", () => {
    expect(() => {
      QuestionSchema.parse({
        id: "Feel_Ideal",
        question: "Missing type question",
        defaultValueFromQuestionId: "Feel_Current",
        slider: ["left", "right"],
        next: null,
      });
    }).toThrowErrorMatchingSnapshot();
  });

  test("mismatch type", () => {
    expect(() => {
      QuestionSchema.parse({
        id: "Feel_Ideal",
        type: QuestionType.ChoicesWithSingleAnswer,
        question: "Bad type question",
        defaultValueFromQuestionId: "Feel_Current",
        slider: ["left", "right"],
        next: "Next_Question",
      });
    }).toThrowErrorMatchingSnapshot();
  });
});

describe("SliderQuestionSchema", () => {
  test("type", () => {
    const question = {
      id: "Feel_Ideal",
      question: "Slider question",
      next: "Next_Question",
      slider: ["left", "right"],
    };

    expect(() => {
      SliderQuestionSchema.parse({
        ...question,
        type: QuestionType.Slider,
      });
    }).not.toThrowError();

    expect(() => {
      SliderQuestionSchema.parse({
        ...question,
        type: QuestionType.HowLongAgo,
      });
    }).toThrowErrorMatchingSnapshot();
  });

  test("slider tuple", () => {
    const question = {
      id: "Feel_Ideal",
      type: QuestionType.Slider,
      question: "Slider question",
      next: "Next_Question",
    };

    expect(() => {
      SliderQuestionSchema.parse({
        ...question,
        slider: ["left", "right"],
      });
    }).not.toThrowError();

    expect(() => {
      SliderQuestionSchema.parse({
        ...question,
        slider: ["left", "right", "top"],
      });
    }).toThrowErrorMatchingSnapshot("three items");

    expect(() => {
      SliderQuestionSchema.parse({
        ...question,
        slider: ["left"],
      });
    }).toThrowErrorMatchingSnapshot("one item");

    expect(() => {
      SliderQuestionSchema.parse({
        ...question,
        slider: [],
      });
    }).toThrowErrorMatchingSnapshot("zero item");
  });

  test("default value range 0 - 100", () => {
    const question = {
      id: "Feel_Ideal",
      type: QuestionType.Slider,
      question: "Range question",
      slider: ["left", "right"],
      next: "Next_Question",
    };

    expect(() => {
      SliderQuestionSchema.parse({
        ...question,
        defaultValue: 50,
      });
    }).not.toThrowError();

    expect(() => {
      SliderQuestionSchema.parse({
        ...question,
        defaultValue: 0,
      });
    }).not.toThrowError();

    expect(() => {
      SliderQuestionSchema.parse({
        ...question,
        defaultValue: 100,
      });
    }).not.toThrowError();

    expect(() => {
      SliderQuestionSchema.parse({
        ...question,
        defaultValue: -1,
      });
    }).toThrowErrorMatchingSnapshot("<0");

    expect(() => {
      SliderQuestionSchema.parse({
        ...question,
        defaultValue: 101,
      });
    }).toThrowErrorMatchingSnapshot(">100");
  });

  describe("defaultValueFromQuestionId", () => {
    const question = {
      id: "Feel_Ideal",
      type: QuestionType.Slider,
      question: "Range question",
      slider: ["left", "right"],
      next: "Next_Question",
    };

    test("can be undefined", () => {
      expect(() => {
        SliderQuestionSchema.parse({
          ...question,
        });
      }).not.toThrowError();
    });

    test("cannot be null", () => {
      expect(() => {
        SliderQuestionSchema.parse({
          ...question,
          defaultValueFromQuestionId: null,
        });
      }).toThrowErrorMatchingSnapshot();
    });

    test("is question ID", () => {
      expect(() => {
        SliderQuestionSchema.parse({
          ...question,
          defaultValueFromQuestionId: "valid_question_id",
        });
      }).not.toThrowError();

      expect(() => {
        SliderQuestionSchema.parse({
          ...question,
          defaultValueFromQuestionId: "INVALID QUESTION-ID",
        });
      }).toThrowErrorMatchingSnapshot("invalid id");

      expect(() => {
        SliderQuestionSchema.parse({
          ...question,
          defaultValueFromQuestionId: "",
        });
      }).toThrowErrorMatchingSnapshot("empty id");
    });
  });
});

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
});
