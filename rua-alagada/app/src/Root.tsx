import React from "react";
import {Composition} from "remotion";
import {Main} from "./Main";
import {Cover} from "./Cover";
import {config, totalFrames} from "./data/scenes";

export const Root: React.FC = () => (
  <>
    <Composition id="RuaAlagada" component={Main} durationInFrames={totalFrames} fps={config.fps} width={config.width} height={config.height} />
    <Composition id="Capa" component={Cover} durationInFrames={1} fps={config.fps} width={config.width} height={config.height} />
  </>
);
