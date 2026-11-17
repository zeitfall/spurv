import type { RenderDeviceEventType } from './render-device-event-type.ts';

/**
 * A mapping of each type of event of a render device to the event that a listener receives.
 */
interface RenderDeviceEventMap {
    [RenderDeviceEventType.DEVICE_LOST]: CustomEvent<GPUDeviceLostInfo>;
    [RenderDeviceEventType.UNCAPTURED_ERROR]: CustomEvent<GPUError>;
    [RenderDeviceEventType.COMPILATION_ERROR]: CustomEvent<GPUCompilationInfo>;
}

export type { RenderDeviceEventMap };
