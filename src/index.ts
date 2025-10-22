import {
  choice,
  endOfInput,
  everyCharUntil,
  lookAhead,
  whitespace,
  sequenceOf,
  str,
  fail,
  succeedWith,
  regex,
  recursiveParser,
  Parser,
} from "arcsecond";
import invariant from "tiny-invariant";

type Identifier = {
  type: "identifier";
  name: string;
  index: number;
};

// TODO: Escaped {{ }}
// TODO: Typed template based on identifiers
// TODO: Dot paths
// TODO: Function calls
// TODO: Function composition
// TODO: Async functions

// TODO: Update Expression to be Idnetifier | BinaryExpression
// In the future BinaryExpression will be (and a b) type statements
type Expression = Identifier;

type Interpolation = {
  type: "interpolation";
  expression: Expression;
  index: number;
};

type Text = {
  type: "text";
  text: string;
  index: number;
};

type Conditional = {
  type: "conditional";
  condition: Expression;
  consequent: Node[];
  alternate?: Node[];
  index: number;
};

type Node = Identifier | Expression | Conditional | Text | Interpolation;

// tokens
const open = str("{{");
const close = str("}}");
const ws = whitespace;

const RESERVED = new Set(["if", "else", "end"]);

export const identifierN = sequenceOf([
  regex(/^[A-Za-z_]/).errorMap(() => "Expected identifier"),
  regex(/^[A-Za-z0-9_.]*/),
])
  .map(([h, t]) => h + t)
  .chain<string>((name) =>
    name && RESERVED.has(name)
      ? fail(`Reserved word {{${name}}} cannot be used as a variable`)
      : succeedWith(name),
  )
  .mapFromData<Identifier>(({ result, index }) => ({
    type: "identifier",
    name: result,
    index: index - result.length,
  }));

// TODO: in the future this will be a choice between an identifier and
//       binary expression
export const expressionN = identifierN;

export const interpolationN = open.chain(() =>
  sequenceOf([
    identifierN,
    close.errorMap(() => "Unclosed interpolation"),
  ]).map<Interpolation>(([identifier]) => ({
    type: "interpolation",
    index: identifier.index - 2,
    expression: identifier,
  })),
);

export const textN = everyCharUntil(choice([lookAhead(open), endOfInput]))
  .chain((s) =>
    s && s.length > 0
      ? succeedWith(s)
      : fail("Expected at least one character"),
  )
  .mapFromData<Node>(({ result, index }) => ({
    type: "text",
    text: result,
    index: index - result.length,
  }));

// {{ if <expression> }}
const ifBeginTokens = [open, str("if"), ws];
const ifBeginP = sequenceOf(ifBeginTokens);

const ifConditionP = sequenceOf([
  ...ifBeginTokens,
  expressionN.errorMap(() => "Missing or invalid if expression"),
  close.errorMap(() => "Unclosed if"),
]).map<Expression>(([, , , expression]) => expression);

const elseP = sequenceOf([open, str("else"), close]);
const endP = sequenceOf([open, str("end"), close]);

// useful recursive parser combinator that bubbles up an error if
// there is one
// const manyUntil = <T, E>(p: Parser<T>, eP: Parser<E>): Parser<T[]> =>
//   recursiveParser(() =>
//     choice([
//       lookAhead(eP).map(() => []),
//       sequenceOf([p, manyUntil(p, eP)]).map(([x, xs]) => [x, ...xs]),
//     ]),
//   );

export const ifElseN = ifConditionP.chain((expression) => {
  invariant(expression, "missing expression");

  const index = expression.index - 5; // 5 chars for {{if\s

  const consequentN: Parser<Node[]> = recursiveParser(() =>
    choice([
      endOfInput.chain(() => fail("Missing {{end}} after if block")),
      lookAhead(choice([elseP, endP])).map(() => []),
      sequenceOf([bodyN, consequentN]).map(([node, rest]) => [node, ...rest]),
    ]),
  );

  const alternateN: Parser<Node[]> = recursiveParser(() =>
    choice([
      endOfInput.chain(() => fail("Missing {{end}} after if/else block")),
      elseP.chain(() => fail("Encountered second {{else}} in if block")),
      lookAhead(endP).map(() => []),
      sequenceOf([bodyN, alternateN]).map(([node, rest]) => [node, ...rest]),
    ]),
  );

  return consequentN.chain((consequent) =>
    choice([
      endP.map<Conditional>(() => ({
        type: "conditional",
        condition: expression,
        index,
        consequent: consequent ?? [],
      })),
      sequenceOf([elseP, alternateN, endP]).map<Conditional>(
        ([, alternate]) => ({
          type: "conditional",
          condition: expression,
          index,
          consequent: consequent ?? [],
          alternate,
        }),
      ),
    ]),
  );
});

const bodyN = choice([
  lookAhead(ifBeginP).chain(() => ifElseN),
  lookAhead(open).chain(() => interpolationN),
  textN,
]);

const templateParser: Parser<Node[]> = recursiveParser(() =>
  choice([
    endOfInput.map(() => []),
    sequenceOf([bodyN, templateParser]).map(([first, rest]) => [
      first,
      ...rest,
    ]),
  ]),
);

// --- runner ---

type Data = {
  [key: string]: string | boolean;
};

class RuntimeError extends Error {
  index: number;

  constructor(message: string, index: number) {
    super(message);
    this.message = message;
    this.index = index;
  }
}

class ParseError extends Error {
  index: number;

  constructor(message: string, index: number) {
    super(message);
    this.message = message;
    this.index = index;
  }
}

export function run(template: string, data: Data): string {
  const ast = templateParser.run(template);
  if (ast.isError) {
    throw new ParseError(ast.error, ast.index);
  }

  if (!ast.result) {
    throw new ParseError("Could not generate program from template", 0);
  }

  const result = processNodes(ast.result, data);

  return result;
}

type ErrorResult = {
  isError: true;
  index: number;
  error: string;
};
type SuccessResult = {
  isError: false;
  output: string;
};
type SafeResult = ErrorResult | SuccessResult;

export function safeRun(template: string, data: Data): SafeResult {
  try {
    const output = run(template, data);
    return {
      isError: false,
      output,
    };
  } catch (e: unknown) {
    if (e instanceof ParseError) {
      return {
        isError: true,
        error: e.message,
        index: e.index,
      };
    }

    if (e instanceof RuntimeError) {
      return {
        isError: true,
        error: e.message,
        index: e.index,
      };
    }

    throw e;
  }
}

function hasKey(data: any, key: string) {
  const result = key.split(".").reduce(
    ([exists, obj], k) => {
      if (!exists) return [false, obj];
      if (obj == null || !(k in obj)) {
        return [false, obj];
      }
      return [true, obj[k]];
    },
    [true, data],
  );

  return result[0];
}

function getValue(data: Data, key: string) {
  return data[key];
  // return key.split(".").reduce<keyof Data>((obj, k) => obj[k], data);
}

const processNodes = (nodes: Node[], data: Data): string => {
  return nodes
    .map((part) => {
      if (part.type === "text") {
        return part.text;
      } else if (part.type === "interpolation") {
        const key = part.expression.name;
        if (!hasKey(data, key)) {
          throw new RuntimeError(`Missing value for "{{${key}}}"`, part.index);
        }

        return getValue(data, key);
      } else if (part.type === "conditional") {
        const key = part.condition.name;
        if (!hasKey(data, key)) {
          throw new RuntimeError(`Missing value for "{{${key}}}"`, part.index);
        }

        const conditionValue = getValue(data, key);
        if (conditionValue) {
          return processNodes(part.consequent, data);
        } else {
          return part.alternate ? processNodes(part.alternate, data) : "";
        }
      } else {
        return "";
      }
    })
    .join("");
};
