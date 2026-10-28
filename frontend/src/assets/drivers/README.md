# Driver photos

Drop driver images in this folder. They are picked up automatically at build time — no
code changes needed.

**Naming** — any of these work (case, spaces, dashes, underscores and accents don't matter):

| File name                      | Matches                         |
| ------------------------------ | ------------------------------- |
| `ANT.png`                      | driver code (3 letters)         |
| `antonelli.jpg`                | surname                         |
| `kimi-antonelli.webp`          | full name (`Kimi Antonelli`)    |
| `12.png`                       | racing number                   |

Formats: png, jpg, jpeg, webp, avif. A transparent PNG cut-out is detected and shown
standing on the card; a normal rectangular photo is cropped to fill it.

Drivers without a file here fall back to their Wikipedia photo, then to initials.
