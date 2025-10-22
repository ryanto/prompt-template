import { expect, test } from "vitest";
import { ifElseN } from "../src/index";
import invariant from "tiny-invariant";

test("if", () => {
  const run = ifElseN.run("{{if condition}}content{{end}}");

  expect(run.isError).toBe(false);
  invariant(!run.isError);

  expect(run.result).toEqual({
    type: "conditional",
    index: 0,
    condition: {
      type: "identifier",
      name: "condition",
      index: 5,
    },
    consequent: [
      {
        type: "text",
        text: "content",
        index: 16,
      },
    ],
  });
});

test("empty if", () => {
  const run = ifElseN.run("{{if condition}}{{end}}");

  expect(run.isError).toBe(false);
  invariant(!run.isError);

  expect(run.result).toEqual({
    type: "conditional",
    index: 0,
    condition: {
      type: "identifier",
      name: "condition",
      index: 5,
    },
    consequent: [],
  });
});

test("missing condition", () => {
  const run = ifElseN.run("{{if }}content");

  expect(run.isError).toBe(true);
  invariant(run.isError);

  expect(run.error).toEqual("Missing or invalid if expression");
  expect(run.index).toBe(5);
});

test("unclosed if start", () => {
  const run = ifElseN.run("{{if condition");

  expect(run.isError).toBe(true);
  invariant(run.isError);

  expect(run.error).toEqual("Unclosed if");
  expect(run.index).toBe(14);
});

test("bad inner", () => {
  const run = ifElseN.run("{{if condition}}{{name{{end}}");

  console.log(run);

  expect(run.isError).toBe(true);
  invariant(run.isError);

  expect(run.error).toEqual("Unclosed interpolation");
  expect(run.index).toBe(22);
});

test("if block without an end tag", () => {
  const run = ifElseN.run("{{if condition}}content");

  expect(run.isError).toBe(true);
  invariant(run.isError);

  expect(run.error).toEqual("Missing {{end}} after if block");
  expect(run.index).toEqual(23);
});

test("nested ifs", () => {
  const run = ifElseN.run(
    "{{if condition1}}{{if condition2}}content{{end}}{{end}}",
  );

  expect(run.isError).toBe(false);
  invariant(!run.isError);

  expect(run.result).toEqual({
    type: "conditional",
    index: 0,
    condition: {
      type: "identifier",
      name: "condition1",
      index: 5,
    },
    consequent: [
      {
        type: "conditional",
        condition: {
          type: "identifier",
          name: "condition2",
          index: 22,
        },
        consequent: [
          {
            type: "text",
            text: "content",
            index: 34,
          },
        ],
        index: 17,
      },
    ],
  });
});

test("if else", () => {
  const run = ifElseN.run("{{if condition}}true{{else}}false{{end}}");

  expect(run.isError).toBe(false);
  invariant(!run.isError);

  expect(run.result).toEqual({
    type: "conditional",
    index: 0,
    condition: {
      type: "identifier",
      name: "condition",
      index: 5,
    },
    consequent: [
      {
        type: "text",
        text: "true",
        index: 16,
      },
    ],
    alternate: [
      {
        type: "text",
        text: "false",
        index: 28,
      },
    ],
  });
});

test("no multiple else", () => {
  const run = ifElseN.run("{{if condition}}true{{else}}{{else}}false{{end}}");

  expect(run.isError).toBe(true);
  invariant(run.isError);

  expect(run.error).toBe("Encountered second {{else}} in if block");
});

test("error in else", () => {
  const run = ifElseN.run("{{if condition}}true{{else}}{{name{{end}}");

  expect(run.isError).toBe(true);
  invariant(run.isError);

  expect(run.error).toBe("Unclosed interpolation");
});

test("missing end after else", () => {
  const run = ifElseN.run("{{if condition}}true{{else}}false");

  expect(run.isError).toBe(true);
  invariant(run.isError);

  // TODO: this error sucks
  expect(run.error).toBe("Missing {{end}} after if/else block");
});
