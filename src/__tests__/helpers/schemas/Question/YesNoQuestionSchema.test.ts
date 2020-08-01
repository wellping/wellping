import { QuestionType } from "../../../../helpers/helpers";
import { YesNoQuestionSchema } from "../../../../helpers/schemas/Question";

describe("YesNoQuestionSchema", () => {
  test("type", () => {
    const question = {
      id: "Feel_Ideal",
      question: "Yes No question",
      next: "Next_Question",
    };

    expect(() => {
      YesNoQuestionSchema.parse({
        ...question,
        type: QuestionType.YesNo,
      });
    }).not.toThrowError();

    expect(() => {
      YesNoQuestionSchema.parse({
        ...question,
        type: QuestionType.HowLongAgo,
      });
    }).toThrowErrorMatchingSnapshot();
  });

  describe("branchStartId", () => {
    const question = {
      id: "Feel_Ideal",
      type: QuestionType.YesNo,
      question: "Yes No",
      next: "Next_Question",
    };

    test("can be undefined", () => {
      expect(() => {
        YesNoQuestionSchema.parse({
          ...question,
        });
      }).not.toThrowError();
    });

    test("should not be null", () => {
      expect(() => {
        YesNoQuestionSchema.parse({
          ...question,
          branchStartId: null,
        });
      }).toThrowErrorMatchingSnapshot();
    });

    test("can be empty object", () => {
      expect(() => {
        YesNoQuestionSchema.parse({
          ...question,
          branchStartId: {},
        });
      }).not.toThrowError();
    });

    test("can contain only yes or only no", () => {
      expect(() => {
        YesNoQuestionSchema.parse({
          ...question,
          branchStartId: {
            yes: "world",
          },
        });
      }).not.toThrowError();

      expect(() => {
        YesNoQuestionSchema.parse({
          ...question,
          branchStartId: {
            no: "hello",
          },
        });
      }).not.toThrowError();
    });

    test("can contain both yes and no", () => {
      expect(() => {
        YesNoQuestionSchema.parse({
          ...question,
          branchStartId: {
            yes: "world",
            no: "hello",
          },
        });
      }).not.toThrowError();
    });

    test("question ID can be null", () => {
      expect(() => {
        YesNoQuestionSchema.parse({
          ...question,
          branchStartId: {
            yes: null,
            no: "hello",
          },
        });
      }).not.toThrowError();

      expect(() => {
        YesNoQuestionSchema.parse({
          ...question,
          branchStartId: {
            yes: "world",
            no: null,
          },
        });
      }).not.toThrowError();

      expect(() => {
        YesNoQuestionSchema.parse({
          ...question,
          branchStartId: {
            yes: null,
          },
        });
      }).not.toThrowError();

      expect(() => {
        YesNoQuestionSchema.parse({
          ...question,
          branchStartId: {
            no: null,
          },
        });
      }).not.toThrowError();

      expect(() => {
        YesNoQuestionSchema.parse({
          ...question,
          branchStartId: {
            yes: null,
            no: null,
          },
        });
      }).not.toThrowError();
    });

    test("should not contain keys beside yes and no", () => {
      expect(() => {
        YesNoQuestionSchema.parse({
          ...question,
          branchStartId: {
            yes: "world",
            no: "hello",
            other: "key",
          },
        });
      }).toThrowErrorMatchingSnapshot("with yes & no");

      expect(() => {
        YesNoQuestionSchema.parse({
          ...question,
          branchStartId: {
            other: "key",
          },
        });
      }).toThrowErrorMatchingSnapshot("without yes / no");
    });
  });

  describe("addFollowupStream", () => {
    const question = {
      id: "Feel_Ideal",
      type: QuestionType.YesNo,
      question: "Yes No",
      next: "Next_Question",
    };

    test("can be undefined", () => {
      expect(() => {
        YesNoQuestionSchema.parse({
          ...question,
        });
      }).not.toThrowError();
    });

    test("should not be null", () => {
      expect(() => {
        YesNoQuestionSchema.parse({
          ...question,
          addFollowupStream: null,
        });
      }).toThrowErrorMatchingSnapshot();
    });

    test("can be empty object", () => {
      expect(() => {
        YesNoQuestionSchema.parse({
          ...question,
          addFollowupStream: {},
        });
      }).not.toThrowError();
    });

    test("can contain yes", () => {
      expect(() => {
        YesNoQuestionSchema.parse({
          ...question,
          addFollowupStream: {
            yes: "another_stream",
          },
        });
      }).not.toThrowError();
    });

    test("stream name should not be null", () => {
      expect(() => {
        YesNoQuestionSchema.parse({
          ...question,
          addFollowupStream: {
            yes: "another_stream",
          },
        });
      }).not.toThrowError();

      expect(() => {
        YesNoQuestionSchema.parse({
          ...question,
          addFollowupStream: {
            yes: undefined,
          },
        });
      }).not.toThrowError();

      expect(() => {
        YesNoQuestionSchema.parse({
          ...question,
          addFollowupStream: {
            yes: null,
          },
        });
      }).toThrowErrorMatchingSnapshot();
    });

    test("TODO: only supports `yes` right now", () => {
      expect(() => {
        YesNoQuestionSchema.parse({
          ...question,
          addFollowupStream: {
            yes: "another_stream",
            no: "not_supported",
          },
        });
      }).toThrowErrorMatchingSnapshot("with yes");

      expect(() => {
        YesNoQuestionSchema.parse({
          ...question,
          addFollowupStream: {
            no: "not_supported",
          },
        });
      }).toThrowErrorMatchingSnapshot("without yes");
    });

    test("should not contain keys other than yes", () => {
      expect(() => {
        YesNoQuestionSchema.parse({
          ...question,
          addFollowupStream: {
            yes: "another_stream",
            other_key: "invalid",
          },
        });
      }).toThrowErrorMatchingSnapshot("with yes");

      expect(() => {
        YesNoQuestionSchema.parse({
          ...question,
          addFollowupStream: {
            other_key: "invalid",
          },
        });
      }).toThrowErrorMatchingSnapshot("without yes");
    });
  });
});
