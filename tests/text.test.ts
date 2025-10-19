import { expect, test } from "vitest";
import { textN } from "../src/index";
import invariant from "tiny-invariant";

test("text", () => {
  const run = textN.run("hello world");

  expect(run.isError).toBe(false);
  invariant(!run.isError);

  expect(run.result).toEqual({
    type: "text",
    text: "hello world",
    index: 0,
  });
});

test("must contain at least one character", () => {
  const run = textN.run("");

  expect(run.isError).toBe(true);
  invariant(run.isError);

  expect(run.error).toBe("Expected at least one character");
  expect(run.index).toBe(0);
});
