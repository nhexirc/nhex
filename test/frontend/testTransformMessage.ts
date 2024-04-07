import test from 'node:test';
import assert from 'node:assert';
import { renderToString } from 'react-dom/server';
import transform from '../../src/lib/transformMessage.tsx';
import { LINK_ELEMENT_STYLE } from '../../src/style.ts';

const assertEqualRendered = (jsx: any, expected: string) =>
    assert.strictEqual(renderToString(transform(jsx)), expected);

test('transformMessage simple', function () {
    assertEqualRendered("test", "test");
});

test('transformMessage one link', function () {
    const url = "https://nhex.dev";
    const link = `<span><a href="${url}" target="_blank" class="${LINK_ELEMENT_STYLE}">${url}</a></span>`;
    assertEqualRendered("test https://nhex.dev", `<span>test </span>${link}`);
    assertEqualRendered("https://nhex.dev test", `<span></span>${link}<span> test</span>`);
    assertEqualRendered("test https://nhex.dev test", `<span>test </span>${link}<span> test</span>`);
});

test('transformMessage n links', function () {
    const url = "https://nhex.dev";
    const link = `<span><a href="${url}" target="_blank" class="${LINK_ELEMENT_STYLE}">${url}</a></span>`;
    assertEqualRendered("test https://nhex.dev test https://nhex.dev",
        `<span>test </span>${link}<span> test </span>${link}`);
});
