import {
    Vector3,
    degreesToRadians,
    clamp,
    Scene,
    SceneNode,
    Camera,
    PerspectiveProjection,
    Geometry,
    VertexAttribute,
    VertexAttributeName,
    VertexFormat,
    NormalMaterial,
    Mesh,
    Renderer,
} from 'spurv';

const CAMERA_PITCH_AXIS = Object.freeze(new Vector3(1, 0, 0));
const CAMERA_PITCH_ANGLE = degreesToRadians(-40);
const CAMERA_FIELD_OF_VIEW = degreesToRadians(60);
const CAMERA_NEAR_DISTANCE = 0.1;
const CAMERA_FAR_DISTANCE = 128;

const CUBE_A_SPIN_AXIS = Object.freeze(new Vector3(0, 1, 0));
const CUBE_A_SPIN_SPEED = 0.5;

const CUBE_B_SPIN_AXIS = Object.freeze(new Vector3(0.4, 1, 0).normalize());
const CUBE_B_SPIN_SPEED = 2;
const CUBE_B_ORBIT_AXIS = Object.freeze(new Vector3(0, 1, 0.15).normalize());
const CUBE_B_ORBIT_SPEED = 0.6;

const CUBE_C_SPIN_AXIS = Object.freeze(new Vector3(1, 1, 1).normalize());
const CUBE_C_SPIN_SPEED = 4;
const CUBE_C_ORBIT_AXIS = Object.freeze(new Vector3(0.5, 1, 0).normalize());
const CUBE_C_ORBIT_SPEED = -2.5;

const canvasElement = document.querySelector('canvas') as HTMLCanvasElement;

const cubePositionAttribute = new VertexAttribute([
    0.5, 0.5, 0.5,
    0.5, -0.5, 0.5,
    0.5, -0.5, -0.5,
    0.5, 0.5, -0.5,

    -0.5, 0.5, -0.5,
    -0.5, -0.5, -0.5,
    -0.5, -0.5, 0.5,
    -0.5, 0.5, 0.5,

    -0.5, 0.5, -0.5,
    -0.5, 0.5, 0.5,
    0.5, 0.5, 0.5,
    0.5, 0.5, -0.5,

    -0.5, -0.5, 0.5,
    -0.5, -0.5, -0.5,
    0.5, -0.5, -0.5,
    0.5, -0.5, 0.5,

    -0.5, 0.5, 0.5,
    -0.5, -0.5, 0.5,
    0.5, -0.5, 0.5,
    0.5, 0.5, 0.5,

    0.5, 0.5, -0.5,
    0.5, -0.5, -0.5,
    -0.5, -0.5, -0.5,
    -0.5, 0.5, -0.5,
], VertexFormat.FLOAT32X3);

const cubeNormalAttribute = new VertexAttribute([
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,

    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,

    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,

    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,

    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,

    0, 0, -1,
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,
], VertexFormat.FLOAT32X3);

const cubeIndices = new Uint16Array([
    0, 1, 2, 0, 2, 3,
    4, 5, 6, 4, 6, 7,
    8, 9, 10, 8, 10, 11,
    12, 13, 14, 12, 14, 15,
    16, 17, 18, 16, 18, 19,
    20, 21, 22, 20, 22, 23,
]);

const cubeGeometry = new Geometry()
    .setAttribute(VertexAttributeName.POSITION, cubePositionAttribute)
    .setAttribute(VertexAttributeName.NORMAL, cubeNormalAttribute)
    .setIndices(cubeIndices);

const cubeMaterial = new NormalMaterial();

const cubeA = new SceneNode();

cubeA.transform.scale.set(2, 2, 2);
cubeA.addComponent(new Mesh(cubeGeometry, cubeMaterial));

const cubeB = new SceneNode();
const cubeBAxis = new SceneNode();
const cubeBOrbit = new SceneNode();

cubeB.addComponent(new Mesh(cubeGeometry, cubeMaterial));
cubeBAxis.transform.position.set(4, 0, 0);
cubeBAxis.addChild(cubeB);
cubeBOrbit.addChild(cubeBAxis);

const cubeC = new SceneNode();
const cubeCOrbit = new SceneNode();

cubeC.transform.position.set(1.5, 0, 0);
cubeC.transform.scale.set(0.5, 0.5, 0.5);
cubeC.addComponent(new Mesh(cubeGeometry, cubeMaterial));
cubeCOrbit.addChild(cubeC);

cubeBAxis.addChild(cubeCOrbit);

const scene = new Scene();

scene.root
    .addChild(cubeA)
    .addChild(cubeBOrbit);

const camera = new Camera(new PerspectiveProjection(
    CAMERA_FIELD_OF_VIEW,
    CAMERA_NEAR_DISTANCE,
    CAMERA_FAR_DISTANCE,
));

const cameraNode = new SceneNode();

cameraNode.addComponent(camera);
cameraNode.transform.position.set(0, 8, 8);
cameraNode.transform.rotation.setFromAxisAngle(CAMERA_PITCH_AXIS, CAMERA_PITCH_ANGLE);

scene.root.addChild(cameraNode);

const renderer = await Renderer.create(canvasElement);

const canvasResizeObserver = new ResizeObserver((entries) => {
    const { devicePixelContentBoxSize } = entries[0];
    const { inlineSize, blockSize } = devicePixelContentBoxSize[0];

    const maxCanvasSizePerDimension = renderer.maxCanvasSizePerDimension;

    canvasElement.width = clamp(inlineSize, 1, maxCanvasSizePerDimension);
    canvasElement.height = clamp(blockSize, 1, maxCanvasSizePerDimension);
});

canvasResizeObserver.observe(canvasElement);

requestAnimationFrame(renderFrame);

function renderFrame(elapsedTime: number) {
    const elapsedTimeInSeconds = elapsedTime / 1000;

    cubeA.transform.rotation.setFromAxisAngle(CUBE_A_SPIN_AXIS, CUBE_A_SPIN_SPEED * elapsedTimeInSeconds);
    cubeB.transform.rotation.setFromAxisAngle(CUBE_B_SPIN_AXIS, CUBE_B_SPIN_SPEED * elapsedTimeInSeconds);
    cubeBOrbit.transform.rotation.setFromAxisAngle(CUBE_B_ORBIT_AXIS, CUBE_B_ORBIT_SPEED * elapsedTimeInSeconds);
    cubeC.transform.rotation.setFromAxisAngle(CUBE_C_SPIN_AXIS, CUBE_C_SPIN_SPEED * elapsedTimeInSeconds);
    cubeCOrbit.transform.rotation.setFromAxisAngle(CUBE_C_ORBIT_AXIS, CUBE_C_ORBIT_SPEED * elapsedTimeInSeconds);

    scene.update();

    renderer.render(scene, camera);

    requestAnimationFrame(renderFrame);
}
