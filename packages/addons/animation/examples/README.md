# Animation examples and component reuse

Types text character by character inside the already-rendered React content. Unlike replacing a string, it keeps existing React elements (links, ANSI spans, custom renderers) mounted.

## Copying into another React application

To reuse `TypewriterEntry`, copy `src/components/TypewriterEntry/`, plus its imports from `../../AnimationSequence`, `../../getConsoleAnimationDelay`, and `../../types`. The component uses React and `motion/react` for reduced-motion support; no global stylesheet or theme variables are required. Its wrapper styling is component-local.

For independent reuse, replace the three addon helpers with equivalent local types, delay calculation, and an external-store sequence coordinator.
