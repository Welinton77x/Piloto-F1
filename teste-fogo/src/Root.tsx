import React from "react";
import {Composition} from "remotion";
import {Video, TOTAL} from "./Video";
import {Video90, TOTAL90} from "./Video90";
import {VideoGuerra, TOTAL_GUERRA} from "./VideoGuerra";
import {VideoBham, TOTAL_BHAM} from "./VideoBham";
import {VideoTempo, TOTAL_TEMPO} from "./VideoTempo";
import {VideoFug, TOTAL_FUG} from "./VideoFug";
import {VideoAnc, TOTAL_ANC} from "./VideoAnc";
import {VideoGalo, TOTAL_GALO} from "./VideoGalo";
import {VideoPombo, TOTAL_POMBO} from "./VideoPombo";
import {ToyPreview} from "./ToyPreview";
import {VideoEscola, TOTAL_ESCOLA} from "./VideoEscola";

export const Root: React.FC = () => (
  <>
    <Composition id="TesteFogo" component={Video} durationInFrames={TOTAL} fps={30} width={1080} height={1920} />
    <Composition id="Escola" component={VideoEscola} durationInFrames={TOTAL_ESCOLA} fps={30} width={1080} height={1920} />
    <Composition id="ToyPreview" component={ToyPreview} durationInFrames={3} fps={30} width={2000} height={700} />
    <Composition id="Pombo" component={VideoPombo} durationInFrames={TOTAL_POMBO} fps={30} width={1080} height={1920} />
    <Composition id="Galo" component={VideoGalo} durationInFrames={TOTAL_GALO} fps={30} width={1080} height={1920} />
    <Composition id="Ancora" component={VideoAnc} durationInFrames={TOTAL_ANC} fps={30} width={1080} height={1920} />
    <Composition id="Fugitivo" component={VideoFug} durationInFrames={TOTAL_FUG} fps={30} width={1080} height={1920} />
    <Composition id="Tempo" component={VideoTempo} durationInFrames={TOTAL_TEMPO} fps={30} width={1080} height={1920} />
    <Composition id="Birmingham" component={VideoBham} durationInFrames={TOTAL_BHAM} fps={30} width={1080} height={1920} />
    <Composition id="Guerra" component={VideoGuerra} durationInFrames={TOTAL_GUERRA} fps={30} width={1080} height={1920} />
    <Composition id="Fogo90" component={Video90} durationInFrames={TOTAL90} fps={30} width={1080} height={1920} />
  </>
);
