# Wall display roadmap

Five more 3D-printed + ESP32 wall projects, same skillset as the voice-assistant build, roughly in suggested order.

## 1. Lit display shelf for the 1:10 scale car collection
Printed shelf brackets + a WS2812B addressable LED strip under the lip, driven by a cheap ESP32 running WLED. Color/effect presets and brightness from phone or Home Assistant (WLED has a native HA integration). Good first project after the voice assistant — reuses the same "ESP32 + printed bracket" pattern with zero audio complexity.

## 2. Motion-triggered showcase lighting
Add a PIR sensor to the shelf project above (or a separate cabinet): lights brighten when someone walks up, dim or switch off otherwise. Minimal extra wiring over #1 — one sensor, a few lines of automation, either on-device in ESPHome or as a Home Assistant automation once the shelf is HA-connected.

## 3. Rotating turntable stand
A single "hero" car gets a slow-turning printed turntable: small geared DC motor or 28BYJ-48 stepper + driver, ESP32 to control speed/on-off. Mechanically the most involved of the five (printed gearing/bearing surface) — everything else here is comparatively simple wiring.

## 4. Print-farm status dashboard
A second CYD (same board/skills as the voice-assistant dashboard) mounted in the workspace, polling OctoPrint/Moonraker/Bambu's API and showing the current job, progress %, and bed/nozzle temps. Directly useful for BayLayer Labs day to day — reuses `esp32-cyd-voice-assistant/esphome/cyd-dashboard.yaml` as a starting point, just swap the displayed data source.

## 5. Weather/transit/calendar display
Plain ESP32 (no touch needed) + small e-ink or TFT panel in a printed picture-frame enclosure. Pulls weather/calendar/commute data via Home Assistant sensors, same `sensor: platform: homeassistant` pattern as the dashboard build. Good candidate for e-ink specifically, since it holds its image with the power off.
