/**
 * The states of a render device.
 */
const RenderDeviceState = Object.freeze({
    ACTIVE: 'ACTIVE',
    LOST: 'LOST',
    DESTROYED: 'DESTROYED',
});

type RenderDeviceState = (typeof RenderDeviceState)[keyof typeof RenderDeviceState];

export { RenderDeviceState };
