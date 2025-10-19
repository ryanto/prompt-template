import { expect, test } from "vitest";
import { expressionN } from "../src/index";
import invariant from "tiny-invariant";

test("expression", () => {
  const run = expressionN.run("test");

  expect(run.isError).toBe(false);
  invariant(!run.isError);

  expect(run.result).toEqual({
    type: "expression",
    index: 0,
    expression: {
      name: "test",
      type: "identifier",
      index: 0,
    },
  });
});
