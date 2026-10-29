# References

External projects are sources of knowledge, not of authority. A decision is justified by its own reasoning in an ADR or in `code-style.md`, never by "project X does it". A borrowed idea names its source, as [0004](decisions/0004-frame-phases.md) does for Bevy.

| Domain               | Sources                                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------------------ |
| Math theory          | Dunn, Parberry, *3D Math Primer for Graphics and Game Development*, [gamemath.com](https://gamemath.com/book/) |
| Math API             | glam (Rust)                                                                                                  |
| Engine architecture  | Bevy                                                                                                         |
| WebGPU, WGSL         | W3C specifications; [webgpufundamentals.org](https://webgpufundamentals.org/)                               |
| Rendering techniques | *Real-Time Rendering*, 4th ed.; Filament documentation                                                       |

Three.js and Babylon.js define the expected feature scope of a general-purpose 3D library. They are not sources for API or architecture. An algorithm found in them is cited from its primary source.
