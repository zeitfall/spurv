/**
 * The names under which a geometry holds its vertex attributes.
 */
const VertexAttributeName = Object.freeze({
    POSITION: 'POSITION',
    NORMAL: 'NORMAL',
    UV: 'UV',
});

type VertexAttributeName = (typeof VertexAttributeName)[keyof typeof VertexAttributeName];

export { VertexAttributeName };
