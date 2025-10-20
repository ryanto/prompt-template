import { expect, test } from "vitest";
import { ifBlockN } from "../src/index";
import invariant from "tiny-invariant";

test("if", () => {
  const run = ifBlockN.run("{{if condition}}content{{end}}");

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
  const run = ifBlockN.run("{{if condition}}{{end}}");

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
  const run = ifBlockN.run("{{if }}content");

  expect(run.isError).toBe(true);
  invariant(run.isError);

  expect(run.error).toEqual("Missing or invalid if expression");
  expect(run.index).toBe(5);
});

test("unclosed if start", () => {
  const run = ifBlockN.run("{{if condition");

  expect(run.isError).toBe(true);
  invariant(run.isError);

  expect(run.error).toEqual("Unclosed if");
  expect(run.index).toBe(14);
});

test("if block without an end tag", () => {
  const run = ifBlockN.run("{{if condition}}content");

  expect(run.isError).toBe(true);
  invariant(run.isError);

  expect(run.error).toEqual("Missing end tag after if block");
  expect(run.index).toEqual(23);
});

test("nested ifs", () => {
  const run = ifBlockN.run(
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
