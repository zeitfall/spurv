import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { degreesToRadians, radiansToDegrees } from './angle.ts';

import { assertClose } from '../testing/index.ts';

describe('degreesToRadians()', () => {
    it('converts 180 degrees to a half turn', () => {
        assertClose(degreesToRadians(180), Math.PI);
    });

    it('converts fractions of a turn', () => {
        assertClose(degreesToRadians(45), Math.PI / 4);
        assertClose(degreesToRadians(90), Math.PI / 2);
        assertClose(degreesToRadians(360), 2 * Math.PI);
    });

    it('converts one degree', () => {
        assertClose(degreesToRadians(1), 0.017453292519943295);
    });

    it('preserves the sign of a negative angle', () => {
        assertClose(degreesToRadians(-90), -Math.PI / 2);
    });

    it('returns zero for a zero angle', () => {
        assert.equal(degreesToRadians(0), 0);
    });

    it('inverts radiansToDegrees', () => {
        for (const radians of [-4 * Math.PI, -0.5, 1, Math.PI / 3, 6]) {
            assertClose(degreesToRadians(radiansToDegrees(radians)), radians);
        }
    });
});

describe('radiansToDegrees()', () => {
    it('converts a half turn to 180 degrees', () => {
        assertClose(radiansToDegrees(Math.PI), 180);
    });

    it('converts fractions of a turn', () => {
        assertClose(radiansToDegrees(Math.PI / 4), 45);
        assertClose(radiansToDegrees(Math.PI / 2), 90);
        assertClose(radiansToDegrees(2 * Math.PI), 360);
    });

    it('converts one radian', () => {
        assertClose(radiansToDegrees(1), 57.29577951308232);
    });

    it('preserves the sign of a negative angle', () => {
        assertClose(radiansToDegrees(-Math.PI / 2), -90);
    });

    it('returns zero for a zero angle', () => {
        assert.equal(radiansToDegrees(0), 0);
    });

    it('inverts degreesToRadians', () => {
        for (const degrees of [-720, -30, 1, 57.5, 270]) {
            assertClose(radiansToDegrees(degreesToRadians(degrees)), degrees);
        }
    });
});
