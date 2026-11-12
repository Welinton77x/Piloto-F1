import React from "react";
import {Composition} from "remotion";
import {MascotTest} from "./MascotTest";

export const Root: React.FC = () => (
  <>
    <Composition id="MascotTest" component={MascotTest} durationInFrames={1} fps={30} width={1800} height={800} />
  </>
);
