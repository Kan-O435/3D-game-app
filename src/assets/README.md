# Artwork

Drop images into these folders and the game picks them up (no code changes).
Anything missing falls back to the built-in placeholder art. png / jpg / webp /
svg all work; the number at the end of the file name is what counts
(`03.png` and `icon-03.png` are the same).

```
src/assets/
├── icons/      slot symbol images, one per symbol      (00.png … 14.png)
├── specials/   the three special symbols               (flame / star / wild .png)
├── posters/    the back-wall poster, one per stage     (01.png … 05.png)
└── poster.png  optional: one general poster for any stage without its own
```

## Slot icons — `icons/NN.png`

`NN` is the symbol's number, **counting from 00** (not 01). Up to **15 images**; a symbol without an image keeps its built-in drawing, so you can add them piece by piece:

| file | symbol | how it pays / turns up |
|---|---|---|
| `00.png` – `04.png` | common (5) | low payout, turns up often |
| `05.png` – `09.png` | uncommon (5) | medium payout |
| `10.png`, `11.png` | rare (2) | high payout, turns up rarely |
| `12.png` | the flame (炎上) | 3 of them anywhere wipes that spin's winnings |
| `13.png` | ★ (bonus / ファンサ) | 3+ anywhere pays, whatever the line |
| `14.png` | W (wild / 推し) | stands in for any ordinary symbol |

Tips: square images, 64×64 or 128×128 is plenty (each cell is tiny on screen and
the picture is rendered at half resolution, so fine lines and small text get
lost). A transparent background looks best; the game adds a dark tile and a thin
coloured border around it (specials get a white frame).

## Special symbols — `specials/`

A separate folder for the three specials, so they don't get mixed in with the
ordinary twelve. Name the files by what they are — `flame.png` (炎上, symbol 12),
`star.png` (★ / ファンサ, 13), `wild.png` (W / 推し, 14) — or by number
(`12.png`, `13.png`, `14.png`). Same image tips as above. (Putting `12.png` …
`14.png` in `icons/` still works too, and wins if both exist.)

## Wall poster — `posters/NN.png` (one per stage)

The poster on the wall behind the machine changes with the stage:

| file | stage |
|---|---|
| `posters/01.png` | STAGE 1 「お話会」 |
| `posters/02.png` | STAGE 2 「2ショット」 |
| `posters/03.png` | STAGE 3 「ライブ」 |
| `posters/04.png` | STAGE 4 「ワンマンライブ」 |
| `posters/05.png` | STAGE 5 「武道館」 |

A stage with no image of its own uses `poster.png` (the single general poster) if
there is one, otherwise the built-in poster. Portrait images, about 3:4
(e.g. 300×420), are cropped to fill the frame. The poster swaps when the next
stage begins.

## What's in here now

- `icons/00.png` – `11.png`: 12 portrait photos for the 12 ordinary symbols
  (`10.png`/`11.png` are the two rare ones). The flame, ★ and W (`12`–`14`) still
  use their built-in drawings until you add images for them in `specials/`.
- `posters/no1.png`: the stage-1 poster (any name ending in the stage number works,
  so `no1.png` = stage 1). Stages 2–5 use the built-in poster until you add
  `no2.png` … or `02.png` …

Photos are cropped to a square around the upper-centre (where the face is) and
magnified a little, then shown small and smoothed; the picture only needs to be
roughly square with the face near the middle.
