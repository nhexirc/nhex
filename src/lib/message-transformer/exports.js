import parse from "./parse.ts";
import jsxify from "./jsxify.tsx";

export default raw => jsxify(parse(raw));
