# Sheri Archipelago — Art-Preserving 3D Diorama

This version uses the actual hand-painted island artwork as the visual source.

## What is different
- The exact artwork is used as the scene texture.
- The image is converted into a subdivided 3D mesh.
- Foreground objects are pushed forward.
- Distant islands and sky are recessed.
- Camera movement creates real parallax.
- Zoom is still real perspective-camera zoom.
- Rotation is deliberately limited to about ±15° so the hand-painted image does not break visually.

## Why this approach
A single image does not contain the unseen backs and sides of objects.
Full 360° rotation requires separate real 3D models.

This diorama approach is the best bridge between:
1. preserving the exact watercolor art direction, and
2. keeping genuine 3D camera movement.

## GitHub Pages
Upload / replace these files in the root of `sheri.archipelago`:

- index.html
- styles.css
- main.js
- assets/main-island-art.png

Commit to main and GitHub Pages will update automatically.
