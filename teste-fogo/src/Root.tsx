import React from "react";
import {Composition} from "remotion";
import {Video, TOTAL} from "./Video";
import {Video90, TOTAL90} from "./Video90";
import {VideoGuerra, TOTAL_GUERRA} from "./VideoGuerra";
import {VideoBham, TOTAL_BHAM} from "./VideoBham";
import {VideoTempo, TOTAL_TEMPO} from "./VideoTempo";
import {VideoFug, TOTAL_FUG} from "./VideoFug";
import {VideoAnc, TOTAL_ANC} from "./VideoAnc";

export const Root: React.FC = () => (
  <>
    <Composition id="TesteFogo" component={Video} durationInFrames={TOTAL} fps={30} width={1080} height={1920} />
    <Composition id="Ancora" component={VideoAnc} durationInFrames={TOTAL_ANC} fps={30} width={1080} height={1920} />
    <Composition id="Fugitivo" component={VideoFug} durationInFrames={TOTAL_FUG} fps={30} width={1080} height={1920} />
    <Composition id="Tempo" component={VideoTempo} durationInFrames={TOTAL_TEMPO} fps={30} width={1080} height={1920} />
    <Composition id="Birmingham" component={VideoBham} durationInFrames={TOTAL_BHAM} fps={30} width={1080} height={1920} />
    <Composition id="Guerra" component={VideoGuerra} durationInFrames={TOTAL_GUERRA} fps={30} width={1080} height={1920} />
    <Composition id="Fogo90" component={Video90} durationInFrames={TOTAL90} fps={30} width={1080} height={1920} />
  </>
);
