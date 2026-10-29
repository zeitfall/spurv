import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { clamp, inverseLerp, lerp } from './scalar.ts';

import { assertClose } from '../testing/index.ts';

describe('clamp()', () => {
    it('returns a value within the bounds unchanged', () => {
        assert.equal(clamp(0.5, -1, 2), 0.5);
    });

    it('returns the lower bound for a value below it', () => {
        assert.equal(clamp(-3, -1, 2), -1);
    });

    it('returns the upper bound for a value above it', () => {
        assert.equal(clamp(5, -1, 2), 2);
    });

    it('returns the upper bound when the lower bound exceeds it', () => {
        assert.equal(clamp(0, 2, -1), -1);
        assert.equal(clamp(5, 2, -1), -1);
        assert.equal(clamp(-3, 2, -1), -1);
    });
});

describe('lerp()', () => {
    it('interpolates linearly between the values', () => {
        assertClose(lerp(-4, 4, 0.25), -2);
    });

    it('returns the start exactly at a factor of zero', () => {
        assert.equal(lerp(1e16, 0.1, 0), 1e16);
    });

    it('returns the end exactly at a factor of one', () => {
        assert.equal(lerp(1e16, 0.1, 1), 0.1);
    });

    it('extrapolates outside the range from zero to one', () => {
        assertClose(lerp(0, 2, 1.5), 3);
        assertClose(lerp(0, 2, -0.5), -1);
    });
});

describe('inverseLerp()', () => {
    it('returns the factor of a value between the bounds', () => {
        assertClose(inverseLerp(-4, 4, -2), 0.25);
    });

    it('returns zero at the start and one at the end', () => {
        assertClose(inverseLerp(-4, 4, -4), 0);
        assertClose(inverseLerp(-4, 4, 4), 1);
    });

    it('extrapolates for a value outside the bounds', () => {
        assertClose(inverseLerp(0, 4, 6), 1.5);
        assertClose(inverseLerp(0, 4, -2), -0.5);
    });

    it('supports a start greater than the end', () => {
        assertClose(inverseLerp(4, 0, 1), 0.75);
    });

    it('returns zero for equal bounds', () => {
        assert.equal(inverseLerp(3, 3, 5), 0);
    });
});
