import { expect, test } from "vitest";
import { expressionN } from "../src/index";
import invariant from "tiny-invariant";

// right now the only expressions are identifiers

test("expression", () => {
  const run = expressionN.run("test");

  expect(run.isError).toBe(false);
  invariant(!run.isError);

  expect(run.result).toEqual({
    name: "test",
    type: "identifier",
    index: 0,
  });
});
