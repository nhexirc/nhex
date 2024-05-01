import test from 'node:test';
import assert from 'node:assert';
import { renderToString } from 'react-dom/server';
import jsxify from "../../src/lib/message-transformer/jsxify";
import parse from "../../src/lib/message-transformer/parse";
import { LINK_ELEMENT_STYLE } from '../../src/style.ts';

const assertEqualRendered = (raw: string, expected: string) => {
    assert.strictEqual(renderToString(jsxify(parse(raw))), expected);
};

const base = "message-transformer/jsxify";

test(`${base}: simple`, function () {
    assertEqualRendered("test", "test");
});

test(`${base}: one link`, function () {
    const url = "https://nhex.dev";
    const link = `<a href="${url}" target="_blank" class="${LINK_ELEMENT_STYLE}">${url}</a>`;
    assertEqualRendered("test https://nhex.dev", `test ${link}`);
    assertEqualRendered("https://nhex.dev test", `${link} test`);
    assertEqualRendered("test https://nhex.dev test", `test ${link} test`);
});

test(`${base}: n links`, function () {
    const url = "https://nhex.dev";
    const link = `<a href="${url}" target="_blank" class="${LINK_ELEMENT_STYLE}">${url}</a>`;
    assertEqualRendered("test https://nhex.dev test https://nhex.dev",
        `test ${link} test ${link}`);
});
