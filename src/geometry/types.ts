import type { VertexFormat } from './vertex-format.ts';
import type { VERTEX_FORMAT_TYPED_ARRAY_MAP } from './vertex-format-maps.ts';

type VertexAttributeArray = InstanceType<(typeof VERTEX_FORMAT_TYPED_ARRAY_MAP)[VertexFormat]>;

export type { VertexAttributeArray };
