/**
 * The types of the events that a render device reports.
 *
 * @remarks Each value is the string under which a listener is added.
 */
const RenderDeviceEventType = Object.freeze({
    DEVICE_LOST: 'devicelost',
    UNCAPTURED_ERROR: 'uncapturederror',
    COMPILATION_ERROR: 'compilationerror',
});

type RenderDeviceEventType = (typeof RenderDeviceEventType)[keyof typeof RenderDeviceEventType];

export { RenderDeviceEventType };
