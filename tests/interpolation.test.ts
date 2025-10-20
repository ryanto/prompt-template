import { expect, test } from "vitest";
import { interpolationN } from "../src/index";
import invariant from "tiny-invariant";

test("interpolation", () => {
  const run = interpolationN.run("{{test}}");

  expect(run.isError).toBe(false);
  invariant(!run.isError);

  expect(run.result).toEqual({
    type: "interpolation",
    index: 0,
    expression: {
      type: "identifier",
      name: "test",
      index: 2,
    },
  });
});

test("unclosed interpolation", () => {
  const run = interpolationN.run("{{test");

  expect(run.isError).toBe(true);
  invariant(run.isError);

  expect(run.error).toEqual("Unclosed interpolation");
});

test("missing expression", () => {
  const run = interpolationN.run("{{}}");

  expect(run.isError).toBe(true);
  invariant(run.isError);

  expect(run.error).toEqual("Expected identifier");
});

test("unclosed and missing expression", () => {
  const run = interpolationN.run("{{");

  expect(run.isError).toBe(true);
  invariant(run.isError);

  expect(run.error).toEqual("Expected identifier");
});
