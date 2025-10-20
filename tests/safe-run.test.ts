import { describe, expect, test } from "vitest";
import { safeRun } from "../src/index";
import invariant from "tiny-invariant";

describe("text and variables", () => {
  test("plain text", () => {
    const input = "Hello world!";
    const data = {};
    const run = safeRun(input, data);

    expect(run.isError).toBe(false);
    invariant(!run.isError);

    expect(run.output).toBe("Hello world!");
  });

  test("placeholder only", () => {
    const input = "{{key}}";
    const data = { key: "value" };
    const run = safeRun(input, data);

    expect(run.isError).toBe(false);
    invariant(!run.isError);

    expect(run.output).toBe("value");
  });

  test("multiple placeholder only", () => {
    const input = "{{first}}{{last}}";
    const data = { first: "bob", last: "smith" };
    const run = safeRun(input, data);

    expect(run.isError).toBe(false);
    invariant(!run.isError);

    expect(run.output).toBe("bobsmith");
  });

  test("text and variables", () => {
    const input = "hi {{first}} {{last}}!";
    const data = { first: "John", last: "Doe" };
    const run = safeRun(input, data);

    expect(run.isError).toBe(false);
    invariant(!run.isError);

    expect(run.output).toBe("hi John Doe!");
  });

  test("missing placeholder", () => {
    const input = "hi {{first}} {{middle}} {{last}}!";
    const data = { first: "John", last: "Doe" };
    const run = safeRun(input, data);

    expect(run.isError).toBe(true);
    invariant(run.isError);

    expect(run.error).toEqual('Missing value for "{{middle}}"');
  });

  test("unclosed", () => {
    const input = "hi {{first";
    const data = { first: "John", last: "Doe" };
    const run = safeRun(input, data);

    expect(run.isError).toBe(true);
    invariant(run.isError);

    expect(run.error).toBe("Unclosed interpolation");
  });
});

describe("if statements", () => {
  test("if statement", () => {
    const input = "{{if c}}the condition is set{{end}}";
    const data = { c: true };
    const run = safeRun(input, data);

    expect(run.isError).toBe(false);
    invariant(!run.isError);

    expect(run.output).toBe("the condition is set");
  });

  test("if statement that evaluate to false", () => {
    const input = "{{if c}}the condition is set{{end}}";
    const data = { c: false };
    const run = safeRun(input, data);

    expect(run.isError).toBe(false);
    invariant(!run.isError);

    expect(run.output).toBe("");
  });

  // TODO: HERE
  test.todo("missing data", () => {
    const input = "{{if c}}the condition is set{{end}}";
    const data = {};
    const run = safeRun(input, data);

    console.log(run);

    expect(run.isError).toBe(true);
    invariant(run.isError);

    expect(run.error).toBe('Missing value for "{{c}}"');
  });

  test.todo("floating end", () => {});
});
