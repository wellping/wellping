import {
  QuestionIdSchema,
  QuestionIdSchemaNullable,
} from "../../../helpers/schemas/common";

describe("QuestionIdSchema", () => {
  test("doesn't allow null", () => {
    expect(() => {
      QuestionIdSchema.parse(null);
    }).toThrowErrorMatchingSnapshot();
  });

  test("doesn't allow undefined", () => {
    expect(() => {
      QuestionIdSchema.parse(undefined);
    }).toThrowErrorMatchingSnapshot();
  });

  test("doesn't allow empty", () => {
    expect(() => {
      QuestionIdSchema.parse("");
    }).toThrowErrorMatchingSnapshot();
  });

  test("doesn't allow special characters", () => {
    expect(() => {
      QuestionIdSchema.parse("HELLO WORLD");
    }).toThrowErrorMatchingSnapshot();

    expect(() => {
      QuestionIdSchema.parse("hello-world");
    }).toThrowErrorMatchingSnapshot();

    expect(() => {
      QuestionIdSchema.parse("测试");
    }).toThrowErrorMatchingSnapshot();
  });

  test("accept", () => {
    expect(() => {
      QuestionIdSchema.parse("1");
    }).not.toThrowError();

    expect(() => {
      QuestionIdSchema.parse("hello");
    }).not.toThrowError();

    expect(() => {
      QuestionIdSchema.parse("hello_world");
    }).not.toThrowError();

    expect(() => {
      QuestionIdSchema.parse("HELLO_WORLD");
    }).not.toThrowError();
  });
});

describe("QuestionIdSchemaNullable", () => {
  test("allow null", () => {
    expect(() => {
      QuestionIdSchemaNullable([]).parse(null);
    }).not.toThrowError();
  });

  test("doesn't allow undefined", () => {
    expect(() => {
      QuestionIdSchemaNullable([]).parse(undefined);
    }).toThrowErrorMatchingSnapshot();
  });

  test("doesn't allow empty", () => {
    expect(() => {
      QuestionIdSchemaNullable([]).parse("");
    }).toThrowErrorMatchingSnapshot();
  });

  test("doesn't allow empty - path info", () => {
    expect(() => {
      QuestionIdSchemaNullable(["myPath"]).parse(undefined);
    }).toThrowErrorMatchingSnapshot();
  });

  test("still allow to be optional", () => {
    expect(() => {
      QuestionIdSchemaNullable([]).optional().parse(undefined);
    }).not.toThrowError();

    expect(() => {
      QuestionIdSchemaNullable(["myPath"]).optional().parse(undefined);
    }).not.toThrowError();

    expect(() => {
      QuestionIdSchemaNullable([]).optional().parse(null);
    }).not.toThrowError();

    expect(() => {
      QuestionIdSchemaNullable([]).optional().parse("hello");
    }).not.toThrowError();
  });
});
