import test from 'node:test';
import assert from 'node:assert';

import { default as parse, TOKEN } from "../../src/lib/message-transformer/parse";

const base = "message-transformer/parse";
const domain = "nhex.dev";

test(`${base}: simple text`, function () {
    const [text] = parse("simple text");
    assert.deepEqual(text, { type: TOKEN.TEXT, payload: "simple text" });
});

test(`${base}: italic`, function () {
    ["*", "_"].forEach(m => {
        const [before, start, text, end, after] = parse(`before ${m}italized${m} after`);
        assert.deepEqual(before, { type: TOKEN.TEXT, payload: "before " });
        assert.equal(start, TOKEN.START_ITALIC);
        assert.deepEqual(text, { type: TOKEN.TEXT, payload: "italized" });
        assert.equal(end, TOKEN.END_ITALIC);
        assert.deepEqual(after, { type: TOKEN.TEXT, payload: " after" });
    });
});

test(`${base}: n italics`, function () {
    ["*", "_"].forEach(m => {
        const [start,
            text,
            end,
            after,
            start2,
            text2,
            end2] = parse(`${m}italized${m} text ${m}italized2${m}`);
        assert.equal(start, TOKEN.START_ITALIC);
        assert.deepEqual(text, { type: TOKEN.TEXT, payload: "italized" });
        assert.equal(end, TOKEN.END_ITALIC);
        assert.deepEqual(after, { type: TOKEN.TEXT, payload: " text " });
        assert.equal(start2, TOKEN.START_ITALIC);
        assert.deepEqual(text2, { type: TOKEN.TEXT, payload: "italized2" });
        assert.equal(end2, TOKEN.END_ITALIC);
    });
});

test(`${base}: unterminated italic`, function () {
    ["*", "_"].forEach(m => {
        const [before, start, text, end] = parse(`before ${m}italized text`);
        assert.deepEqual(before, { type: TOKEN.TEXT, payload: "before " })
        assert.equal(start, TOKEN.START_ITALIC);
        assert.deepEqual(text, { type: TOKEN.TEXT, payload: "italized text" });
        assert.equal(end, TOKEN.END_ITALIC);
    });
});

test(`${base}: bold`, function () {
    ["**", "__"].forEach(m => {
        const [before, start, text, end, after] = parse(`before ${m}bold${m} after`);
        assert.deepEqual(before, { type: TOKEN.TEXT, payload: "before " })
        assert.equal(start, TOKEN.START_BOLD);
        assert.deepEqual(text, { type: TOKEN.TEXT, payload: "bold" });
        assert.equal(end, TOKEN.END_BOLD);
        assert.deepEqual(after, { type: TOKEN.TEXT, payload: " after" })
    })
});

test(`${base}: n bolds`, function () {
    ["**", "__"].forEach(m => {
        const [start,
            text,
            end,
            after,
            start2,
            text2,
            end2] = parse(`${m}bold${m} text ${m}bold2${m}`);
        assert.equal(start, TOKEN.START_BOLD);
        assert.deepEqual(text, {
            type: TOKEN.TEXT,
            payload: "bold",
        })
        assert.equal(end, TOKEN.END_BOLD);
        assert.deepEqual(after, {
            type: TOKEN.TEXT,
            payload: " text ",
        })
        assert.equal(start2, TOKEN.START_BOLD);
        assert.deepEqual(text2, {
            type: TOKEN.TEXT,
            payload: "bold2",
        })
        assert.equal(end2, TOKEN.END_BOLD);
    });
});

test(`${base}: unterminated bold`, function () {
    ["**", "__"].forEach(m => {
        const [before, start, text, end] = parse(`before ${m}bold text`);
        assert.deepEqual(before, { type: TOKEN.TEXT, payload: "before " });
        assert.equal(start, TOKEN.START_BOLD);
        assert.deepEqual(text, { type: TOKEN.TEXT, payload: "bold text" });
        assert.equal(end, TOKEN.END_BOLD);
    });
});

test(`${base}: link`, function () {
    ["http", "https"].forEach(protocol => {
        const [before, start, text, end, after] = parse(`before ${protocol}://${domain} after`);
        assert.deepEqual(before, { type: TOKEN.TEXT, payload: "before " });
        assert.equal(start, TOKEN.START_LINK);
        assert.deepEqual(text, { type: TOKEN.TEXT, payload: `${protocol}://${domain}` });
        assert.equal(end, TOKEN.END_LINK);
        assert.deepEqual(after, { type: TOKEN.TEXT, payload: " after" });
    });
});

test(`${base}: eof'd link`, function () {
    ["http", "https"].forEach(protocol => {
        const [before, start, text, end] = parse(`before ${protocol}://${domain}`);
        assert.deepEqual(before, { type: TOKEN.TEXT, payload: "before " });
        assert.equal(start, TOKEN.START_LINK);
        assert.deepEqual(text, { type: TOKEN.TEXT, payload: `${protocol}://${domain}` });
        assert.equal(end, TOKEN.END_LINK);
    });
});

test(`${base}: link in italic`, function () {
    ["http", "https"].forEach(protocol  => {
        ["*", "_"].forEach(m => {
            const [before,
                start,
                lstart,
                text,
                lend,
                end,
                after] = parse(`before ${m}${protocol}://${domain}${m} after`);
            assert.deepEqual(before, { type: TOKEN.TEXT, payload: "before " });
            assert.equal(start, TOKEN.START_ITALIC);
            assert.equal(lstart, TOKEN.START_LINK);
            assert.deepEqual(text, { type: TOKEN.TEXT, payload: `${protocol}://${domain}` });
            assert.equal(lend, TOKEN.END_LINK);
            assert.equal(end, TOKEN.END_ITALIC);
            assert.deepEqual(after, { type: TOKEN.TEXT, payload: " after" });
        });
    });
});

test(`${base}: unterminated italic with link`, function () {
    ["http", "https"].forEach(protocol  => {
        ["*", "_"].forEach(m => {
            const [before,
                start,
                lstart,
                text,
                lend,
                end] = parse(`before ${m}${protocol}://${domain}`);
            assert.deepEqual(before, { type: TOKEN.TEXT, payload: "before " });
            assert.equal(start, TOKEN.START_ITALIC);
            assert.equal(lstart, TOKEN.START_LINK);
            assert.deepEqual(text, { type: TOKEN.TEXT, payload: `${protocol}://${domain}` });
            assert.equal(lend, TOKEN.END_LINK);
            assert.equal(end, TOKEN.END_ITALIC);
        });
    });
});

test(`${base}: link in bold`, function () {
    ["http", "https"].forEach(protocol  => {
        ["**", "__"].forEach(m => {
            const [before,
                start,
                lstart,
                text,
                lend,
                end,
                after] = parse(`before ${m}${protocol}://${domain}${m} after`);
            assert.deepEqual(before, { type: TOKEN.TEXT, payload: "before " });
            assert.equal(start, TOKEN.START_BOLD);
            assert.equal(lstart, TOKEN.START_LINK);
            assert.deepEqual(text, { type: TOKEN.TEXT, payload: `${protocol}://${domain}` });
            assert.equal(lend, TOKEN.END_LINK);
            assert.equal(end, TOKEN.END_BOLD);
            assert.deepEqual(after, { type: TOKEN.TEXT, payload: " after" });
        });
    });
});

test(`${base}: unterminated link in bold`, function () {
    ["http", "https"].forEach(protocol  => {
        ["**", "__"].forEach(m => {
            const [before,
                start,
                lstart,
                text,
                lend,
                end] = parse(`before ${m}${protocol}://${domain}`);
            assert.deepEqual(before, { type: TOKEN.TEXT, payload: "before " });
            assert.equal(start, TOKEN.START_BOLD);
            assert.equal(lstart, TOKEN.START_LINK);
            assert.deepEqual(text, { type: TOKEN.TEXT, payload: `${protocol}://${domain}` });
            assert.equal(lend, TOKEN.END_LINK);
            assert.equal(end, TOKEN.END_BOLD);
        });
    });
});

test(`${base}: all mixed`, function () {
    const [before,
        bstart,
        btext,
        bend,
        stext,
        lstart,
        ltext,
        lend,
        stext2,
        istart,
        itext,
        iend] = parse(`before **bold** http://nhex.dev _italic` /* unterminated italic */);
    assert.deepEqual(before, { type: TOKEN.TEXT, payload: "before " });
    assert.equal(bstart, TOKEN.START_BOLD);
    assert.deepEqual(btext, { type: TOKEN.TEXT, payload: "bold" });
    assert.equal(bend, TOKEN.END_BOLD);
    assert.deepEqual(stext, { type: TOKEN.TEXT, payload: " " });
    assert.equal(lstart, TOKEN.START_LINK);
    assert.deepEqual(ltext, { type: TOKEN.TEXT, payload: "http://nhex.dev" });
    assert.equal(lend, TOKEN.END_LINK);
    assert.deepEqual(stext2, { type: TOKEN.TEXT, payload: " " });
    assert.equal(istart, TOKEN.START_ITALIC);
    assert.deepEqual(itext, { type: TOKEN.TEXT, payload: "italic" });
    assert.equal(iend, TOKEN.END_ITALIC);
});

