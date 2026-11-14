import {Config} from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setCodec("h264");
Config.setCrf(17);
Config.setChromiumOpenGlRenderer("angle");
Config.setEntryPoint("src/index.ts");
Config.setBrowserExecutable(process.env.REMOTION_BROWSER ?? null);
