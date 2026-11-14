# References

External projects are sources of knowledge, not of authority. A decision is therefore justified by its own reasoning, recorded in an ADR, and never by the fact that another project does the same. A borrowed idea names its source, as [0004](decisions/0004-frame-phases.md) does for Bevy. Sources are cited in ADRs and plans, and never in code; a test that takes an expected value from a source relies on the citation in the corresponding plan or ADR.

| Domain               | Sources                                                                                                        |
| -------------------- | -------------------------------------------------------------------------------------------------------------- |
| Math theory          | Dunn, Parberry, *3D Math Primer for Graphics and Game Development*, [gamemath.com](https://gamemath.com/book/) |
| Math API             | glam (Rust)                                                                                                    |
| Engine architecture  | Bevy                                                                                                           |
| WebGPU, WGSL         | W3C specifications; [webgpufundamentals.org](https://webgpufundamentals.org/)                                  |
| Rendering techniques | *Real-Time Rendering*, 4th ed.; Filament documentation                                                         |

Three.js and Babylon.js indicate the feature scope that users expect from a general-purpose 3D library, but they are not sources for API or architecture. An algorithm found in them is cited from its primary source.

The *3D Math Primer* uses a left-handed system and row vectors (`vM`), whereas spurv uses a right-handed system and column vectors (`Mv`), as [0005](decisions/0005-math-conventions.md) defines. When a formula is ported from the book, its matrices are therefore transposed and its products reversed.
