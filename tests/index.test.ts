import { describe, expect, test } from "vitest";
import { ifBlock, parserWithData } from "../src/index";
import invariant from "tiny-invariant";

describe("text and variables", () => {
  test("plain text", () => {
    const input = "Hello world!";
    const data = {};

    const run = parserWithData(data).run(input);

    expect(run.isError).toBe(false);
    invariant(!run.isError);

    expect(run.result).toBe("Hello world!");
  });

  test("placeholder only", () => {
    const input = "{{key}}";
    const data = { key: "value" };

    const run = parserWithData(data).run(input);

    expect(run.isError).toBe(false);
    invariant(!run.isError);

    expect(run.result).toBe("value");
  });

  test("multiple placeholder only", () => {
    const input = "{{first}}{{last}}";
    const data = { first: "bob", last: "smith" };

    const run = parserWithData(data).run(input);

    expect(run.isError).toBe(false);
    invariant(!run.isError);

    expect(run.result).toBe("bobsmith");
  });

  test("text and variables", () => {
    const input = "hi {{first}} {{last}}!";
    const data = { first: "John", last: "Doe" };

    const run = parserWithData(data).run(input);

    expect(run.isError).toBe(false);
    invariant(!run.isError);

    expect(run.result).toBe("hi John Doe!");
  });

  test("missing placeholder", () => {});
});

test("errors", () => {
  const input = "hi {{first";
  const data = { first: "John", last: "Doe" };

  const run = parserWithData(data).run(input);

  expect(run.isError).toBe(true);
  invariant(run.isError);

  expect(run.error).toBe("Unexpected end of template");
  expect(run.index).toBe(3);
});

describe("if statements", () => {
  test("if statement", () => {
    const input = "{{if c}}the condition is set{{end}}";
    const data = { c: true };
    const run = parserWithData(data).run(input);

    expect(run.isError).toBe(false);
    invariant(!run.isError);

    expect(run.result).toBe("the condition is set");
  });

  test("if statement that evaluate to false", () => {
    const input = "{{if c}}the condition is set{{end}}";
    const data = { c: false };
    const run = parserWithData(data).run(input);

    expect(run.isError).toBe(false);

    if (run.isError) {
      throw new Error(run.error);
    }

    expect(run.result).toBe("");
  });

  test.only("missing data", () => {
    const input = "{{if c}}the condition is set{{end}}";
    const data = {};
    const run = parserWithData(data).run(input);

    console.log(run);

    // expect(run.isError).toBe(false);
    expect(run.isError).toBe(true);
  });
  //
  // test("unclosed if statements", () => {
  //   const input = "{{if c}}the condition is set";
  //   const data = { c: true };
  //   const run = parserWithData(data).run(input);
  //
  // })
});
