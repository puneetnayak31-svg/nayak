import {existsSync} from "node:fs";
import {Config} from "@remotion/cli/config";

// Cloud sessions can't download Remotion's Chrome (remotion.media is not on the
// network allowlist), so use the headless shell that ships with the container.
const preinstalledShell = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
if (existsSync(preinstalledShell)) {
  Config.setBrowserExecutable(preinstalledShell);
}

Config.setVideoImageFormat("jpeg");
