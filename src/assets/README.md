# Artwork

Drop images here and the game picks them up (no code changes). Anything missing
falls back to the built-in placeholder art.

## Slot icons — `icons/NN.png`

`NN` is the symbol's number. **15 images** (png / jpg / webp / svg all work):

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

## Wall poster — `poster.png`

One portrait image (about 3:4, e.g. 300×420). It is cropped to fill the frame.
