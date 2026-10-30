import { AssertionError } from 'node:assert';

const DEFAULT_TOLERANCE = 1e-12;

/**
 * Asserts that a number differs from the expected value by at most the tolerance.
 *
 * @param actual - The computed value.
 * @param expected - The reference value.
 * @param tolerance - The maximum absolute difference.
 *
 * @throws AssertionError if the difference exceeds the tolerance or either value is NaN.
 */
function assertClose(actual: number, expected: number, tolerance = DEFAULT_TOLERANCE) {
    if (isClose(actual, expected, tolerance)) {
        return;
    }

    throw new AssertionError({
        message: `assertClose: expected ${expected} +/- ${tolerance}, received ${actual}.`,
        actual,
        expected,
        operator: 'assertClose',
    });
}

/**
 * Asserts that two arrays have equal length and that every element differs from the expected
 * element by at most the tolerance.
 *
 * @param actual - The computed values.
 * @param expected - The reference values.
 * @param tolerance - The maximum absolute difference per element.
 *
 * @throws AssertionError if the lengths differ or any element fails {@link assertClose}.
 */
function assertArrayClose(
    actual: ArrayLike<number>,
    expected: ArrayLike<number>,
    tolerance = DEFAULT_TOLERANCE,
) {
    if (actual.length !== expected.length) {
        throw new AssertionError({
            message: `assertArrayClose: expected length ${expected.length}, received ${actual.length}.`,
            actual,
            expected,
            operator: 'assertArrayClose',
        });
    }

    for (let i = 0; i < expected.length; i++) {
        if (isClose(actual[i], expected[i], tolerance)) {
            continue;
        }

        throw new AssertionError({
            message: `assertArrayClose: expected element ${i} ${expected[i]} +/- ${tolerance}, received ${actual[i]}.`,
            actual,
            expected,
            operator: 'assertArrayClose',
        });
    }
}

function isClose(actual: number, expected: number, tolerance: number) {
    return actual === expected || Math.abs(actual - expected) <= tolerance;
}

export { assertClose, assertArrayClose };
