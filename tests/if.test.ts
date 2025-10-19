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
      type: "expression",
      index: 5,
      expression: {
        type: "identifier",
        name: "condition",
        index: 5,
      },
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

test.only("missing condition", () => {
  const run = ifBlockN.run("{{if}}content");

  expect(run.isError).toBe(true);
  invariant(run.isError);

  console.log(run.error);

  expect(run.error).toEqual("xx");
  expect(run.index).toBe(0);
});

test.todo("unclosed if", () => {
  const run = ifBlockN.run("{{if condition}}content");

  expect(run.isError).toBe(true);
  invariant(run.isError);

  expect(run.error).toEqual("xx");
  expect(run.index).toBe(0);
});
