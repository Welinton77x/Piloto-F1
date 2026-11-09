import React from "react";
import {Composition} from "remotion";
import {Video, TOTAL} from "./Video";
import {Video90, TOTAL90} from "./Video90";

export const Root: React.FC = () => (
  <>
    <Composition id="TesteFogo" component={Video} durationInFrames={TOTAL} fps={30} width={1080} height={1920} />
    <Composition id="Fogo90" component={Video90} durationInFrames={TOTAL90} fps={30} width={1080} height={1920} />
  </>
);
