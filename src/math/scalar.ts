/**
 * Computes the number nearest to the given value within the given bounds.
 *
 * @param value - The input value.
 * @param min - The lower bound.
 * @param max - The upper bound.
 * @remarks A lower bound greater than the upper bound yields the upper bound.
 */
function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(value, min));
}

/**
 * Computes the linear interpolation between the given values.
 *
 * @param from - The start value.
 * @param to - The end value.
 * @param factor - The interpolation factor.
 */
function lerp(from: number, to: number, factor: number) {
    return (1 - factor) * from + factor * to;
}

/**
 * Computes the factor at which the linear interpolation between the given bounds yields the
 * given value.
 *
 * @param from - The start value.
 * @param to - The end value.
 * @param value - The interpolated value.
 * @remarks Equal bounds yield zero.
 */
function inverseLerp(from: number, to: number, value: number) {
    if (from === to) {
        return 0;
    }

    return (value - from) / (to - from);
}

export {
    clamp,
    lerp,
    inverseLerp,
};
