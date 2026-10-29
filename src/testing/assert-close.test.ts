import { describe, it } from 'node:test';
import assert, { AssertionError } from 'node:assert/strict';

import { assertArrayClose, assertClose } from './assert-close.ts';

describe('assertClose()', () => {
    it('accepts equal values', () => {
        assert.doesNotThrow(() => assertClose(0.25, 0.25));
    });

    it('accepts a difference within the default tolerance', () => {
        assert.doesNotThrow(() => assertClose(0.1 + 0.2, 0.3));
    });

    it('rejects a difference beyond the default tolerance', () => {
        assert.throws(() => assertClose(1, 1 + 1e-11), AssertionError);
    });

    it('accepts a difference equal to the tolerance', () => {
        assert.doesNotThrow(() => assertClose(1, 1.5, 0.5));
    });

    it('rejects a difference beyond the tolerance', () => {
        assert.throws(() => assertClose(1, 1.75, 0.5), AssertionError);
    });

    it('rejects NaN', () => {
        assert.throws(() => assertClose(Number.NaN, 0), AssertionError);
        assert.throws(() => assertClose(0, Number.NaN), AssertionError);
        assert.throws(() => assertClose(Number.NaN, Number.NaN), AssertionError);
    });

    it('accepts equal infinities and rejects opposite ones', () => {
        assert.doesNotThrow(() => assertClose(Infinity, Infinity));
        assert.throws(() => assertClose(Infinity, -Infinity), AssertionError);
    });

    it('reports the expected value, the tolerance, and the actual value', () => {
        assert.throws(() => assertClose(2, 1, 0.5), {
            name: 'AssertionError',
            message: 'assertClose: expected 1 ± 0.5, received 2.',
        });
    });
});

describe('assertArrayClose()', () => {
    it('accepts arrays whose elements differ within the tolerance', () => {
        assert.doesNotThrow(() => assertArrayClose([0.1 + 0.2, 1], [0.3, 1]));
    });

    it('accepts typed arrays', () => {
        assert.doesNotThrow(() => assertArrayClose(new Float32Array([0.5, 2]), [0.5, 2]));
    });

    it('accepts empty arrays', () => {
        assert.doesNotThrow(() => assertArrayClose([], []));
    });

    it('rejects arrays of different lengths', () => {
        assert.throws(() => assertArrayClose([1, 2], [1, 2, 3]), {
            name: 'AssertionError',
            message: 'assertArrayClose: expected length 3, received 2.',
        });
    });

    it('rejects an element beyond the tolerance and reports its index', () => {
        assert.throws(() => assertArrayClose([1, 2.75, 3], [1, 2, 3], 0.5), {
            name: 'AssertionError',
            message: 'assertArrayClose: expected element 1 2 ± 0.5, received 2.75.',
        });
    });

    it('rejects a NaN element', () => {
        assert.throws(() => assertArrayClose([1, Number.NaN], [1, 2]), AssertionError);
    });
});
