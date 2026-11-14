import type { getVertexFormatTypedArray } from './vertex-format-typed-arrays.ts';

type VertexAttributeArray = InstanceType<ReturnType<typeof getVertexFormatTypedArray>>;

export type { VertexAttributeArray };
