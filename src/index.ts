import {
  choice,
  endOfInput,
  everyCharUntil,
  lookAhead,
  many,
  optionalWhitespace,
  whitespace,
  sequenceOf,
  str,
  fail,
  succeedWith,
  withData,
  regex,
} from "arcsecond";

type Identifier = {
  type: "identifier";
  name: string;
  index: number;
};

type Expression = {
  type: "expression";
  expression: Identifier;
  index: number;
};

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

// type If = {
//       type: "if";
//       condition: string; // identifier
//       consequent: Node[]; // nodes until {{ else }} or {{ end }}
//       alternate?: Node[]; // nodes between {{ else }} and {{ end }}
//     };

type Node = Identifier | Expression | Conditional | Text | Interpolation;

// tokens
const open = str("{{");
const close = str("}}");
const ows = optionalWhitespace;

const RESERVED = new Set(["if", "else", "end"]);

export const identifierN = sequenceOf([
  regex(/^[A-Za-z_]/).errorMap(() => "Expected identifier"),
  regex(/^[A-Za-z0-9_.]*/),
])
  .map(([h, t]) => h + t)
  .chain<string>((name) =>
    name && RESERVED.has(name)
      ? fail(`'${name}' is a reserved word`)
      : succeedWith(name),
  )
  .mapFromData<Identifier>(({ result, index }) => ({
    type: "identifier",
    name: result,
    index: index - result.length,
  }));

// TODO: im not sure this is needed, it's a nice wrapper though?
export const expressionN = identifierN.mapFromData<Expression>(
  ({ result }) => ({
    type: "expression",
    expression: result,
    index: result.index,
  }),
);

export const interpolationN = sequenceOf([open, ows, expressionN, ows, close])
  .mapFromData<Node>(({ result: [, , expression] }) => ({
    type: "interpolation",
    index: expression.index - 2,
    expression,
  }))
  .errorMap(() => "Unclosed interpolation");

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

// Not sure how to test this?
const bodyNode = choice([
  lookAhead(sequenceOf([open, ows, str("end"), ows, close])).chain(() =>
    fail("stop"),
  ),
  lookAhead(open).chain(() => interpolationN),
  textN,
]);

// {{ if <identifier> }}
const ifStartP = sequenceOf([
  open,
  ows,
  str("if"),
  whitespace,
  expressionN,
  ows,
  close.errorMap(() => "Unclosed if tag"),
]).map<Expression>(([, , , , expression]) => expression);

// {{ else }} / {{ end }}
// const elseT = sequenceOf([
//   open,
//   ows,
//   str("else"),
//   ows,
//   close.errorMap(() => "Unclosed end tag"),
// ]).map(() => null);

const endP = sequenceOf([
  open,
  ows,
  str("end"),
  ows,
  close.errorMap(() => "Unclosed end tag"),
]).map(() => null);

export const ifBlockN = ifStartP.chain((expression) => {
  if (!expression) return fail("Missing expression in if tag");

  return many(bodyNode).chain((consequent) =>
    endP.map(() => ({
      type: "conditional",
      index: 0,
      condition: expression,
      consequent,
    })),
  );
});

// Main program here

const node = choice([
  lookAhead(sequenceOf([open, ows, str("if")])).chain(() => ifBlockN),
  lookAhead(open).chain(() => interpolationN),
  textN,
]);

const templateParser = many(node).chain((nodes) =>
  endOfInput.map(() => nodes).errorMap(() => "Unexpected end of template"),
);

function getValue(data: any, key: string) {
  return key.split(".").reduce((obj, k) => obj?.[k], data);
}

function hasValue(data: any, key: string) {
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

const processNodes = (nodes: Node[], data: any): string => {
  return nodes
    .map((part) => {
      if (part.type === "text") {
        return part.text;
      } else if (part.type === "interpolation") {
        const key = part.expression.expression.name;
        return getValue(data, key);
      } else if (part.type === "conditional") {
        const key = part.condition.expression.name;
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

const interpolator = templateParser.mapFromData(({ result: parts, data }) => {
  // this is the full ast
  console.log(JSON.stringify(parts, null, 2));

  const result = parts ? processNodes(parts, data) : "";
  return result;
});

// Wrap with data
export const parserWithData = withData(interpolator);
