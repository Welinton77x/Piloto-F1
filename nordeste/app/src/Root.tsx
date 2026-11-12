import React from "react";
import {Composition} from "remotion";
import {Main} from "./Main";
import {MascotTest} from "./MascotTest";
import {Cover} from "./Cover";
import {config, totalFrames} from "./data/scenes";

export const Root: React.FC = () => (
  <>
    <Composition id="Torneira" component={Main} durationInFrames={totalFrames} fps={config.fps} width={config.width} height={config.height} />
    <Composition id="Audio" component={Main} defaultProps={{audioOnly: true}} durationInFrames={totalFrames} fps={config.fps} width={config.width} height={config.height} />
    <Composition id="Capa" component={Cover} defaultProps={{at: 150, dy: 0}} durationInFrames={1} fps={config.fps} width={config.width} height={config.height} />
    <Composition id="MascotTest" component={MascotTest} durationInFrames={1} fps={30} width={1800} height={800} />
  </>
);
