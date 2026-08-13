# Bill of materials

Rough costs as of writing — check current listings before buying, prices on these move around.

## Home Assistant server (shared infrastructure — buy once)
| Item | Notes | Approx. |
|---|---|---|
| Raspberry Pi 4 or 5 (4GB+), or a spare mini PC | Runs Home Assistant OS. Reuse any always-on machine you already have instead, if you've got one. | $60–100 |
| microSD card (32GB+, A2-rated) or USB SSD | HA OS boot/storage — SSD is more reliable long-term than SD. | $10–20 |
| 5V/3A USB-C power supply | Official Pi supply avoids brownout weirdness under load. | $10 |
| *(Alternative to the three rows above)* Home Assistant Green | Official plug-and-play appliance, no OS install. | ~$100 |

## Wall dashboard (CYD)
| Item | Notes | Approx. |
|---|---|---|
| ESP32-2432S028R ("CYD"), 2.8" resistive touch | Confirm resistive vs. capacitive touch variant before buying — different touch driver, `esphome/cyd-dashboard.yaml` here targets resistive (XPT2046). | $15–20 |
| USB-C cable (data-capable, not charge-only) | For flashing + permanent power. | $5 |
| 5V/1A USB wall adapter | Needs mains power at the mount point. | $6 |

## Voice satellite — DIY path
| Item | Notes | Approx. |
|---|---|---|
| ESP32 dev board (plain WROOM, not the CYD) | Bare board — plenty of free GPIO since there's no display claiming pins. | $6–10 |
| INMP441 I2S MEMS microphone breakout | Digital I2S mic, the standard choice in published ESPHome voice builds. | $3–6 |
| MAX98357A I2S amp + small 4/8Ω 3W speaker | I2S class-D amp; speaker just needs to physically fit the enclosure. | $6–10 |
| Breadboard/perfboard + jumper wires | Prototype before soldering down permanently. | $5 |

## Voice satellite — buy-assembled alternative
| Item | Notes | Approx. |
|---|---|---|
| M5Stack AtomEcho | Small ESP32 module with onboard mic + speaker, purpose-built for ESPHome voice-assistant duty — skips all the breakout wiring above. | $15–20 |

## Optional sensors (either board, if the dashboard should show more than time/weather)
| Item | Notes | Approx. |
|---|---|---|
| BME280 breakout (I2C) | Temp/humidity/pressure. | $5–8 |
| PIR motion sensor | Also reusable for the showcase-lighting project in the wall-display roadmap. | $3–5 |

## Mounting
| Item | Notes |
|---|---|
| Wall anchors + screws, sized to your printed bracket | Or Command strips if the bracket is light enough. |
| PETG or ASA filament | Prefer over PLA for anything near the electronics or a sunlit wall. |
