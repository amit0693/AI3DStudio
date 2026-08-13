# ESP32 CYD smart-home voice assistant

Wall-mounted, self-hosted voice assistant + dashboard built on Home Assistant's Assist pipeline (ESPHome `voice_assistant` + `micro_wake_word`) — no cloud STT/TTS required. No smart-home hub exists yet, so this project includes standing one up.

## Why two boards, not one

The classic 2.8" CYD (ESP32-2432S028R) is display-only hardware — every usable GPIO is already claimed by the screen, touch controller, and SD card, leaving **three** free pins on the expansion headers (IO22, IO27, IO35 — and IO35 is input-only). Its "speaker" pin (IO26) runs off the ESP32's internal DAC through an amp whose exact wiring varies by board revision, and getting clean `voice_assistant` audio out of it is a known rough edge in the ESPHome community (see [witnessmenow/ESP32-Cheap-Yellow-Display#99](https://github.com/witnessmenow/ESP32-Cheap-Yellow-Display/discussions/99) and the [Home Assistant community thread on GPIO35](https://community.home-assistant.io/t/gpio35-on-cyd-esp32-2432s028/759710)). A clean I2S mic alone needs three free GPIOs (BCLK/WS/DATA); there's no room left for a speaker feed alongside it without giving up something else on the board.

Splitting the job across two cheap boards is more reliable than fighting the pinout:

| Board | Job | Why |
|---|---|---|
| **CYD (ESP32-2432S028R)** | Wall dashboard — room sensors, touch controls, clock/weather | What it's actually built for; display + touch pins are solid and well documented. |
| **Voice satellite** — bare ESP32 devkit + INMP441 mic + MAX98357A amp/speaker (or a bought M5Stack AtomEcho) | Wake word + mic/speaker for Assist | Plenty of free GPIO, no shared-pinout fights, and it's the exact pattern most published ESPHome voice-assistant builds use. |

Mount both in one printed wall bracket (see [`enclosure.md`](./enclosure.md)) so it reads as a single panel even though it's electrically two boards.

**Advanced/optional path:** it's reportedly possible to free enough GPIO for an I2S mic directly on the CYD by giving up the SD card interface (IO5/18/19/23 aren't used for anything else) and keeping IO26 for speaker out. Untested here and described as fiddly in the community threads above — only worth it if you specifically want a single-board unit and don't mind debugging audio quality yourself.

## Build order

1. Stand up Home Assistant — [`home-assistant-setup.md`](./home-assistant-setup.md).
2. Flash the CYD as a dashboard — [`esphome/cyd-dashboard.yaml`](./esphome/cyd-dashboard.yaml).
3. Build and flash the voice satellite — [`esphome/voice-satellite.yaml`](./esphome/voice-satellite.yaml).
4. Print the wall bracket — [`enclosure.md`](./enclosure.md).
5. Full parts list — [`BOM.md`](./BOM.md).

## Before you flash anything

`voice_assistant` / `micro_wake_word` / `i2s_audio` option names have moved between ESPHome releases as the voice pipeline matured. The YAML here reflects the well-established 2024–2025 shape of these components, but treat it as a first draft: run `esphome config <file>.yaml` to validate against whatever ESPHome version you actually install, and check [esphome.io/components/voice_assistant](https://esphome.io/components/voice_assistant.html) for anything that's changed since — this environment's network policy blocks esphome.io directly, so it couldn't be verified against the live docs while writing this.
