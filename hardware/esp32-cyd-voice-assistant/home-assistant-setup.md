# Home Assistant setup

No hub exists yet, so this is a prerequisite for everything else in this project — both the CYD dashboard and the voice satellite talk to Home Assistant, not directly to each other.

## 1. Install Home Assistant OS
- **Raspberry Pi:** flash **Home Assistant OS** (not just "Home Assistant Core") to the SD card/SSD with the official [Raspberry Pi Imager](https://www.raspberrypi.com/software/) — pick "Home Assistant" under "Other specific-purpose OS." Boot it, wait a few minutes for first-run setup, then open `http://homeassistant.local:8123`.
- **Home Assistant Green:** plug in, open `homeassistant.local:8123`, follow onboarding — no imaging step.
- Complete onboarding (admin account, location/timezone — timezone feeds both the weather integration and the Assist pipeline's language defaults).

## 2. Install the local voice add-ons
Settings → Add-ons → Add-on Store, install and start:
- **Whisper** (speech-to-text) — start with the `tiny` or `base` model on a Raspberry Pi; bigger models are more accurate but slower on Pi-class hardware. Size up later if accuracy bugs you more than latency does.
- **Piper** (text-to-speech) — pick any voice, low resource cost.
- **openWakeWord is *not* needed** — wake word detection runs on-device via ESPHome's `micro_wake_word`, not in Home Assistant.

If Whisper's latency on a Pi is annoying, the alternative is a Nabu Casa Home Assistant Cloud subscription (~$6.50/mo) for cloud STT/TTS instead of self-hosting Whisper/Piper — trades a monthly fee for speed and zero local compute. Not required to get started, and easy to switch to later without touching the ESP32 firmware.

## 3. Configure the Assist pipeline
Settings → Voice Assistants → Add Assistant:
- Conversation agent: the built-in **Home Assistant** agent is enough for device control ("turn on the kitchen lights") — no LLM needed for that. Add a local LLM later only if you want open-ended conversation.
- STT: Whisper. TTS: Piper.
- Set this pipeline as default (or select it per-device later, once the voice satellite shows up as a device).

## 4. Expose entities
Settings → Voice Assistants → Expose — choose which lights/switches/sensors Assist (and therefore the voice satellite) is allowed to see and control.

## 5. Add the ESPHome devices
Once `esphome/cyd-dashboard.yaml` and `esphome/voice-satellite.yaml` are flashed, Home Assistant should auto-discover both over mDNS — Settings → Devices & Services → the discovered ESPHome device card → Configure. If discovery doesn't fire, add them manually with each device's IP and the `api.encryption.key` from its YAML.
