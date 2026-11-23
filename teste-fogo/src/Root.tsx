import {BlockTest} from "./BlockTest";
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
import {VideoMiojo, TOTAL_MIOJO} from "./VideoMiojo";
import {VideoGta, TOTAL_GTA} from "./VideoGta";
import {VideoCasamento, TOTAL_CASA} from "./VideoCasamento";
import {BoloPreview} from "./BoloPreview";
import {MecPreview} from "./MecPreview";
import {ChulePreview} from "./ChulePreview";
import {VideoChuveiro, TOTAL_CHUV} from "./VideoChuveiro";
import {VideoPastel, TOTAL_PASTEL} from "./VideoPastel";
import {VideoControle, TOTAL_CONTROLE} from "./VideoControle";
import {VideoTamandua, TOTAL_TAMANDUA} from "./VideoTamandua";
import {VideoFutebol, TOTAL_FUTEBOL} from "./VideoFutebol";
import {VideoCafe, TOTAL_CAFE} from "./VideoCafe";
import {VideoChurrasco, TOTAL_CHURRASCO} from "./VideoChurrasco";
import {VideoDespertador, TOTAL_DESPERTADOR} from "./VideoDespertador";
import {VideoTravesseiro, TOTAL_TRAVESSEIRO} from "./VideoTravesseiro";
import {VideoBoleto, TOTAL_BOLETO} from "./VideoBoleto";
import {VideoPanela, TOTAL_PANELA} from "./VideoPanela";
import {VideoBanho, TOTAL_BANHO} from "./VideoBanho";
import {VideoGta6, TOTAL_GTA6} from "./VideoGta6";
import {VideoOnibus, TOTAL_ONIBUS} from "./VideoOnibus";
import {VideoBrig, TOTAL_BRIG} from "./VideoBrig";
import {VideoAnt, TOTAL_ANT} from "./VideoAnt";
import {VideoRoupa, TOTAL_ROUPA} from "./VideoRoupa";
import {VideoAcai, TOTAL_ACAI} from "./VideoAcai";
import {VideoAcai2, TOTAL_ACAI2, AcaiProd} from "./VideoAcai2";
import {VideoMiojo2, TOTAL_MIOJO2} from "./VideoMiojo2";
import {VideoBolo2, TOTAL_BOLO2} from "./VideoBolo2";
import {VideoSorvete, TOTAL_SORV} from "./VideoSorvete";
import {VideoTrav2, TOTAL_TRAV2} from "./VideoTrav2";
import {VideoFiltro, TOTAL_FILTRO} from "./VideoFiltro";
import {VideoFuga2, TOTAL_FUGA2} from "./VideoFuga2";
import {VideoCama, TOTAL_CAMA} from "./VideoCama";
import {VideoChule, TOTAL_CHULE} from "./VideoChule";
import {VideoMec, TOTAL_MEC} from "./VideoMec";
import {VideoBolo, TOTAL_BOLO} from "./VideoBolo";

export const Root: React.FC = () => (
  <>
    <Composition id="TesteFogo" component={Video} durationInFrames={TOTAL} fps={30} width={1080} height={1920} />
    <Composition id="Bolo" component={VideoBolo} durationInFrames={TOTAL_BOLO} fps={30} width={1080} height={1920} />
    <Composition id="BoloPreview" component={BoloPreview} durationInFrames={2} fps={30} width={1080} height={1920} />
    <Composition id="Mecanico" component={VideoMec} durationInFrames={TOTAL_MEC} fps={30} width={1080} height={1920} />
    <Composition id="Chule" component={VideoChule} durationInFrames={TOTAL_CHULE} fps={30} width={1080} height={1920} />
    <Composition id="Chuveiro" component={VideoChuveiro} durationInFrames={TOTAL_CHUV} fps={30} width={1080} height={1920} />
    <Composition id="Pastel" component={VideoPastel} durationInFrames={TOTAL_PASTEL} fps={30} width={1080} height={1920} />
    <Composition id="Controle" component={VideoControle} durationInFrames={TOTAL_CONTROLE} fps={30} width={1080} height={1920} />
    <Composition id="Tamandua" component={VideoTamandua} durationInFrames={TOTAL_TAMANDUA} fps={30} width={1080} height={1920} />
    <Composition id="Futebol" component={VideoFutebol} durationInFrames={TOTAL_FUTEBOL} fps={30} width={1080} height={1920} />
    <Composition id="Cafe" component={VideoCafe} durationInFrames={TOTAL_CAFE} fps={30} width={1080} height={1920} />
    <Composition id="Churrasco" component={VideoChurrasco} durationInFrames={TOTAL_CHURRASCO} fps={30} width={1080} height={1920} />
    <Composition id="Despertador" component={VideoDespertador} durationInFrames={TOTAL_DESPERTADOR} fps={30} width={1080} height={1920} />
    <Composition id="Travesseiro" component={VideoTravesseiro} durationInFrames={TOTAL_TRAVESSEIRO} fps={30} width={1080} height={1920} />
    <Composition id="Boleto" component={VideoBoleto} durationInFrames={TOTAL_BOLETO} fps={30} width={1080} height={1920} />
    <Composition id="Panela" component={VideoPanela} durationInFrames={TOTAL_PANELA} fps={30} width={1080} height={1920} />
    <Composition id="Banho" component={VideoBanho} durationInFrames={TOTAL_BANHO} fps={30} width={1080} height={1920} />
    <Composition id="Gta6" component={VideoGta6} durationInFrames={TOTAL_GTA6} fps={30} width={1080} height={1920} />
    <Composition id="Onibus" component={VideoOnibus} durationInFrames={TOTAL_ONIBUS} fps={30} width={1080} height={1920} />
    <Composition id="Brig" component={VideoBrig} durationInFrames={TOTAL_BRIG} fps={30} width={1080} height={1920} />
    <Composition id="Ant" component={VideoAnt} durationInFrames={TOTAL_ANT} fps={30} width={1080} height={1920} />
    <Composition id="Roupa" component={VideoRoupa} durationInFrames={TOTAL_ROUPA} fps={30} width={1080} height={1920} />
    <Composition id="Acai" component={VideoAcai} durationInFrames={TOTAL_ACAI} fps={30} width={1080} height={1920} />
    <Composition id="Acai2" component={VideoAcai2} durationInFrames={TOTAL_ACAI2} fps={30} width={1080} height={1920} />
    <Composition id="AcaiProd" component={AcaiProd} durationInFrames={6} fps={30} width={1080} height={1350} />
    <Composition id="Miojo2" component={VideoMiojo2} durationInFrames={TOTAL_MIOJO2} fps={30} width={1080} height={1920} />
    <Composition id="Bolo2" component={VideoBolo2} durationInFrames={TOTAL_BOLO2} fps={30} width={1080} height={1920} />
    <Composition id="Sorvete" component={VideoSorvete} durationInFrames={TOTAL_SORV} fps={30} width={1080} height={1920} />
    <Composition id="Trav2" component={VideoTrav2} durationInFrames={TOTAL_TRAV2} fps={30} width={1080} height={1920} />
    <Composition id="Filtro" component={VideoFiltro} durationInFrames={TOTAL_FILTRO} fps={30} width={1080} height={1920} />
    <Composition id="Fuga2" component={VideoFuga2} durationInFrames={TOTAL_FUGA2} fps={30} width={1080} height={1920} />
    <Composition id="Cama" component={VideoCama} durationInFrames={TOTAL_CAMA} fps={30} width={1080} height={1920} />
    <Composition id="BlockTest" component={BlockTest} durationInFrames={30} fps={30} width={1080} height={1920} />
    <Composition id="ChulePreview" component={ChulePreview} durationInFrames={8} fps={30} width={1080} height={1920} />
    <Composition id="MecPreview" component={MecPreview} durationInFrames={6} fps={30} width={1080} height={1920} />
    <Composition id="Casamento" component={VideoCasamento} durationInFrames={TOTAL_CASA} fps={30} width={1080} height={1920} />
    <Composition id="Gta" component={VideoGta} durationInFrames={TOTAL_GTA} fps={30} width={1080} height={1920} />
    <Composition id="Miojo" component={VideoMiojo} durationInFrames={TOTAL_MIOJO} fps={30} width={1080} height={1920} />
    <Composition id="Escola" component={VideoEscola} durationInFrames={TOTAL_ESCOLA} fps={30} width={1080} height={1920} />
    <Composition id="ToyPreview" component={ToyPreview} durationInFrames={7} fps={30} width={2000} height={700} />
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
