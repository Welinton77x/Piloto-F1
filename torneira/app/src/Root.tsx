import React from "react";
import {Composition} from "remotion";
import {Main} from "./Main";
import {MascotTest} from "./MascotTest";
import {config, totalFrames} from "./data/scenes";

export const Root: React.FC = () => (
  <>
    <Composition id="Torneira" component={Main} durationInFrames={totalFrames} fps={config.fps} width={config.width} height={config.height} />
    <Composition id="MascotTest" component={MascotTest} durationInFrames={1} fps={30} width={1800} height={800} />
  </>
);
