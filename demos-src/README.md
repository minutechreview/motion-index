# Motion Index video studies

These four original, silent 3D scenes interpret Shaan Johari's written Part 4 recipes; they do not use the source GIFs or frames. Each folder is a self-contained HyperFrames composition with vendored runtime files and locally embedded typefaces. The fonts are distributed under the included SIL Open Font Licenses; Three.js is MIT licensed, and GSAP's distribution header names its standard license.

Each composition is 1088 × 800, five seconds long and driven by deterministic seek time. The final portion reverses the move to return smoothly to frame one. The card and receipt masters are sampled at 60 fps and blended down to 30 fps to give their fast movements a short exposure blur.

To update a study, run `npx hyperframes check demos-src/<id>` and `npx hyperframes snapshot demos-src/<id> --at 0,1.5,3.5,4.9667 --no-end` from the repository root. Review the frames, render with the version pinned in the study's `package.json`, then encode a silent H.264 MP4 with `-crf 28 -movflags +faststart` into `public/demos/<id>.mp4`; export its first frame as `public/demos/<id>.jpg`. Run `npm run build` and `npm run check` afterward.
