/**
 * Computes the radian measure of the given angle.
 *
 * @param degrees - The angle.
 */
function degreesToRadians(degrees: number) {
    return (Math.PI / 180) * degrees;
}

/**
 * Computes the degree measure of the given angle.
 *
 * @param radians - The angle.
 */
function radiansToDegrees(radians: number) {
    return (180 / Math.PI) * radians;
}

export {
    degreesToRadians,
    radiansToDegrees,
};
