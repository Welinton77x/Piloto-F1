import React from "react";
import {Composition} from "remotion";
import {Main} from "./Main";
import {TOTAL} from "./data/timeline";

export const Root: React.FC = () => (
  <>
    <Composition id="Prova" component={Main} defaultProps={{music: 0.25}} durationInFrames={TOTAL} fps={30} width={1080} height={1920} />
  </>
);
