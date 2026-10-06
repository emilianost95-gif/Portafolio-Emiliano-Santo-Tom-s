import { INK, mountSketch } from '@/lib/canvas';

const MIN = 16;
const MAX = 32;
const BAND = 0.8;
const AMBIENT = 17;
const SAMPLES = 240;

/**
 * Lazo de control con histéresis sobre una planta térmica SIMULADA (no hay sensor
 * real acá): el relé enciende por debajo de consigna − banda y apaga por encima
 * de consigna + banda. Es la lógica que usa SmartGrow con un DHT22 y un relé.
 */
export function mount(canvas: HTMLCanvasElement): () => void {
  const history: number[] = [];
  const relayHistory: boolean[] = [];
  let temperature = 21;
  let setpoint = 24;
  let relay = false;
  let sinceSample = 0;

  return mountSketch(canvas, {
    frame: ({ ctx, width, height, pointer }, dt) => {
      const top = 34;
      const bottom = height - 40;
      const toY = (value: number) => bottom - ((value - MIN) / (MAX - MIN)) * (bottom - top);
      if (pointer.inside) {
        const wanted = MIN + ((bottom - pointer.y) / (bottom - top)) * (MAX - MIN);
        setpoint = Math.min(MAX - 2, Math.max(MIN + 2, wanted));
      }

      // Planta: el calefactor suma, el ambiente resta en proporción a la diferencia.
      const simDt = dt * 6;
      temperature += ((relay ? 2.6 : 0) - (temperature - AMBIENT) * 0.16) * simDt;
      if (temperature < setpoint - BAND) relay = true;
      if (temperature > setpoint + BAND) relay = false;

      sinceSample += dt;
      if (sinceSample > 0.03) {
        sinceSample = 0;
        history.push(temperature);
        relayHistory.push(relay);
        if (history.length > SAMPLES) {
          history.shift();
          relayHistory.shift();
        }
      }

      ctx.fillStyle = INK.bg;
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = 'rgba(255, 140, 38, 0.1)';
      ctx.fillRect(0, toY(setpoint + BAND), width, toY(setpoint - BAND) - toY(setpoint + BAND));
      ctx.strokeStyle = INK.arc;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(0, toY(setpoint));
      ctx.lineTo(width, toY(setpoint));
      ctx.stroke();
      ctx.setLineDash([]);

      const stepX = width / (SAMPLES - 1);
      ctx.strokeStyle = INK.chalk;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      history.forEach((value, index) => {
        if (index === 0) ctx.moveTo(0, toY(value));
        else ctx.lineTo(index * stepX, toY(value));
      });
      ctx.stroke();

      ctx.fillStyle = INK.arc;
      relayHistory.forEach((on, index) => {
        if (on) ctx.fillRect(index * stepX, height - 22, Math.ceil(stepX), 6);
      });

      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.fillStyle = INK.chalk;
      ctx.fillText(`TEMP ${temperature.toFixed(1)}°C   SET ${setpoint.toFixed(1)}°C   SIM`, 12, 20);
      ctx.fillStyle = relay ? INK.arc : INK.dim;
      ctx.fillText(`RELAY ${relay ? 'ON' : 'OFF'}`, 12, height - 28);
    },
  });
}
