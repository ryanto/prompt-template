import { describe, expect, test } from "vitest";
import { identifierN } from "../src/index";
import invariant from "tiny-invariant";

test("identifier", () => {
  const run = identifierN.run("test");

  expect(run.isError).toBe(false);
  invariant(!run.isError);

  expect(run.result).toEqual({
    index: 0,
    name: "test",
    type: "identifier",
  });
});

test("reserved word", () => {
  const run = identifierN.run("if");

  expect(run.isError).toBe(true);
  invariant(run.isError);

  expect(run.error).toBe("Reserved word {{if}} cannot be used as a variable");
});
