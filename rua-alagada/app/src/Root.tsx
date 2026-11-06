import React from "react";
import {Composition} from "remotion";
import {Main} from "./Main";
import {Cover} from "./Cover";
import {Banner} from "./Banner";
import {Logo} from "./Logo";
import {LogoAzul} from "./LogoAzul";
import {config, totalFrames} from "./data/scenes";

export const Root: React.FC = () => (
  <>
    <Composition id="RuaAlagada" component={Main} durationInFrames={totalFrames} fps={config.fps} width={config.width} height={config.height} />
    <Composition id="Capa" component={Cover} durationInFrames={1} fps={config.fps} width={config.width} height={config.height} />
    <Composition id="Logo" component={Logo} durationInFrames={1} fps={config.fps} width={1080} height={1080} />
    <Composition id="LogoAzul" component={LogoAzul} durationInFrames={1} fps={config.fps} width={1080} height={1080} />
    <Composition id="Banner" component={Banner} durationInFrames={1} fps={config.fps} width={2560} height={1440} defaultProps={{guide: false}} />
  </>
);
