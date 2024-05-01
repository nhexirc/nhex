import test from 'node:test';
import assert from 'node:assert';
import IRCNicksSet from '../../src/lib/IRCNicksSet';

test('IRCNicksSet general', function () {
    const set = new IRCNicksSet();
    set.add("EdFletcher");
    set.add("@EdFletcher");
    assert.strictEqual(set.size, 1, "size A");
    assert.strictEqual(set.has("EdFletcher"), true);
    assert.strictEqual(set.has("@EdFletcher"), true);

    set.add("+EdFletcher");
    assert.strictEqual(set.size, 1, "size B");

    assert.strictEqual(set.delete("EdFletcher"), true);
    assert.strictEqual(set.size, 0, "size C");
});

test('IRCNicksSet getCurrentHat', function () {
    const set = new IRCNicksSet();
    set.add("@EdFletcher");
    assert.strictEqual(set._getCurrentHat("EdFletcher"), "@");

    set.add("Nhex");
    assert.strictEqual(set._getCurrentHat("Nhex"), "");
});