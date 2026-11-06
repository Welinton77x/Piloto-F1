// Câmeras da v2 pensadas para 9:16. 'h' = altura visível (unidades 3D) no alvo.
// Largura visível = h * 0.5625. O alvo fica um pouco ABAIXO do meio do sujeito,
// para o sujeito ocupar a faixa livre entre os selos (topo) e a legenda (base).
export type Cam = {f: number; az: number; el: number; h: number; target: [number, number, number]};

export const FOV = 28;

export const CAMS: Record<string, Cam[]> = {
  s1: [
    {f: 0, az: 18, el: 4, h: 2.9, target: [0, 0.85, 0]},
    {f: 120, az: 0, el: 4, h: 2.3, target: [0, 0.9, 0]},
  ],
  s2: [
    {f: 0, az: 35, el: 12, h: 6.5, target: [0, 0.1, 0]},
    {f: 40, az: 35, el: 12, h: 6.5, target: [0, 0.1, 0]},
    {f: 150, az: 12, el: 18, h: 3.3, target: [0, 0.62, -0.2]},
    {f: 210, az: 15, el: 18, h: 3.3, target: [0, 0.62, -0.2]},
  ],
  s3: [
    {f: 0, az: 30, el: 14, h: 6.5, target: [0, 0.1, 0]},
    {f: 140, az: 60, el: 14, h: 6.5, target: [0, 0.1, 0]},
    {f: 150, az: 8, el: 6, h: 3.9, target: [0.35, 0.55, 0.2]},
    {f: 360, az: 12, el: 6, h: 3.9, target: [0.35, 0.55, 0.2]},
  ],
  s4: [
    {f: 0, az: -15, el: 6, h: 2.3, target: [0, 0.95, 0]},
    {f: 40, az: -15, el: 6, h: 2.0, target: [0, 0.95, 0]},
    {f: 150, az: -8, el: 6, h: 2.0, target: [0, 0.95, 0]},
    {f: 190, az: -4, el: 6, h: 4.3, target: [-0.8, 0.62, 0]},
    {f: 300, az: -2, el: 6, h: 4.3, target: [-0.8, 0.62, 0]},
  ],
  s5: [
    {f: 0, az: 0, el: 4, h: 6.2, target: [0, -0.3, 0]},
    {f: 270, az: 3, el: 4, h: 6.2, target: [0, -0.3, 0]},
  ],
  s6: [
    {f: 0, az: 8, el: 6, h: 3.6, target: [0, 0.55, 0]},
    {f: 100, az: 8, el: 6, h: 3.8, target: [0.1, 0.55, 0]},
    {f: 140, az: 6, el: 6, h: 5.2, target: [0.55, 0.5, 0]},
    {f: 270, az: 10, el: 6, h: 5.2, target: [0.55, 0.5, 0]},
  ],
  s7: [
    {f: 0, az: 55, el: 10, h: 2.6, target: [0, 0.2, 0.9]},
    {f: 100, az: 40, el: 12, h: 3.9, target: [0, 0.5, 0.5]},
    {f: 150, az: 80, el: 6, h: 4.2, target: [0, 0.5, 0.4]},
    {f: 270, az: 45, el: 8, h: 3.3, target: [0, 0.65, 0.2]},
    {f: 360, az: 45, el: 8, h: 3.3, target: [0, 0.65, 0.2]},
  ],
  s8: [
    {f: 0, az: 0, el: 8, h: 4.4, target: [0, 0.42, 0]},
    {f: 270, az: -6, el: 8, h: 4.4, target: [0, 0.42, 0]},
  ],
  s9: [
    {f: 0, az: -8, el: 6, h: 4.2, target: [-0.15, 0.52, 0]},
    {f: 88, az: 0, el: 6, h: 4.2, target: [-0.15, 0.52, 0]},
    {f: 92, az: 45, el: 10, h: 4.6, target: [0, 0.5, 0]},
    {f: 178, az: 45, el: 10, h: 4.6, target: [0, 0.5, 0]},
    {f: 182, az: 0, el: 6, h: 4.0, target: [0, 0.5, 0]},
    {f: 270, az: 6, el: 6, h: 4.0, target: [0, 0.5, 0]},
  ],
  s10: [
    {f: 0, az: -8, el: 8, h: 4.6, target: [0, 0.85, 0]},
    {f: 110, az: 0, el: 8, h: 4.8, target: [0, 0.85, 0]},
    {f: 130, az: 0, el: 6, h: 3.9, target: [0, 0.6, 0]},
    {f: 240, az: 5, el: 6, h: 3.9, target: [0, 0.6, 0]},
  ],
  s11: [
    {f: 0, az: 0, el: 3, h: 5.2, target: [0, 0.48, 0]},
    {f: 270, az: 0, el: 3, h: 5.2, target: [0, 0.48, 0]},
  ],
};
