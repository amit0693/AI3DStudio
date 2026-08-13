# Enclosure / wall mount

## Search before designing from scratch
Both boards here are extremely common in the ESPHome community — check Printables/Thingiverse for "ESP32 CYD wall mount," "ESP32-2432S028R case," and "AtomEcho case" before modeling anything. Verify a listing matches your exact board revision; mounting-hole spacing has drifted across CYD board revisions.

## If nothing fits: one bracket, two boards
Design a single bracket housing both boards side by side, so the pair reads as one wall panel:
- **CYD cutout:** screen bezel opening + a rear cavity clearing the SD slot and back-mounted components — the board isn't flat, check clearance around the ILI9341 driver PCB standoffs.
- **Satellite cutout:** a small hole pattern (speaker grille) directly over the speaker, and a separate small opening near the INMP441 — MEMS mics are sensitive to being sealed in a fully enclosed cavity, give it a real air path to the front face.
- **Shared USB-C access** on the underside or back for both boards' power cables, routed to a single wall power point.
- **Standoffs sized to each board's mounting holes**, not press-fit — screws let you pull a board back out to reflash over USB without destroying the print.

## Material
PETG or ASA over PLA — the electronics generate a little heat and the panel may end up somewhere warm (near a window, above a vent). PLA is fine if the mounting location stays cool and out of direct sun.

## Mounting
Wall anchors sized to the bracket's screw bosses, or Command strips if you keep the bracket small/light. Route the power cable(s) before final mounting — much easier than fishing cable behind an already-screwed-in bracket.
