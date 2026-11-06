import React from "react";
import {Composition} from "remotion";
import {Main} from "./Main";
import {config, totalFrames} from "./data/scenes";

export const Root: React.FC = () => (
  <Composition id="Torneira" component={Main} durationInFrames={totalFrames} fps={config.fps} width={config.width} height={config.height} />
);
