import { describe, expect, it, vi } from 'vitest';
import { MotionPlayer } from '../src/presentation/MotionPlayer.js';
import { motionPlan } from '../src/presentation/motion.js';
import { CASES } from '../src/presentation/model.js';
import { PACKET_COLORS } from '../src/scene/theme.js';

const context = (visual, frame, scenario) => ({ visual, frame, scenario });
const flush = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

function playerHarness() {
  const pending = [];
  const defer = () => new Promise((resolve) => pending.push(resolve));
  const animator = {
    speed: 1,
    play: vi.fn(defer),
    wait: vi.fn(defer),
    cancel: vi.fn(() => pending.splice(0).forEach((resolve) => resolve(false))),
  };
  const onPlan = vi.fn();
  const onError = vi.fn();
  const player = new MotionPlayer({
    animator,
    getPlan: () => ({ tracks: [[{ from: 'a', to: 'b' }]] }),
    onPlan,
    onChange: vi.fn(),
    onError,
  });
  return { player, animator, onPlan, onError, finish: () => pending.shift()(true) };
}

describe('flujos didácticos', () => {
  it('representa la reconciliación como control y evita el worker caído', () => {
    const plan = motionPlan(context('cluster', CASES.node[3]), 0);
    expect(plan.tone).toBe('control');
    expect(plan.tracks[0]).toMatchObject([
      { from: 'worker2', to: 'control', kind: 'control' },
      { from: 'control', to: 'worker2', kind: 'control' },
    ]);
    for (const visual of ['pipeline', 'cluster', 'observe', 'traffic']) {
      for (let cycle = 0; cycle < 5; cycle++) {
        const flow = motionPlan(context(visual, CASES.traffic[0]), cycle);
        expect(PACKET_COLORS[flow.tone]).toBeDefined();
        for (const hop of flow.tracks.flat()) expect(PACKET_COLORS[hop.kind]).toBeDefined();
      }
    }
  });

  it('alterna las réplicas Ready y devuelve la respuesta por el camino inverso', () => {
    const first = motionPlan(context('traffic', CASES.traffic[0]), 0).tracks[0];
    const second = motionPlan(context('traffic', CASES.traffic[0]), 1).tracks[0];
    expect(first.map(({ from, to }) => `${from}>${to}`)).toEqual([
      'browser>ingress',
      'ingress>service',
      'service>worker1',
      'worker1>service',
      'service>ingress',
      'ingress>browser',
    ]);
    expect(first.slice(0, 3).every((hop) => hop.kind === 'request')).toBe(true);
    expect(first.slice(3).every((hop) => hop.kind === 'response')).toBe(true);
    expect(second[2].to).toBe('worker2');
  });

  it('no envía tráfico al nodo caído ni a réplicas arrancando y no inventa endpoints', () => {
    for (let cycle = 0; cycle < 4; cycle++) {
      const plan = motionPlan(context('traffic', CASES.node[3]), cycle);
      expect(plan.tracks.flat().some((hop) => hop.to === 'worker1')).toBe(false);
      expect(plan.tracks[0][2].to).toBe('worker2');
    }
    const none = motionPlan(context('traffic', { pods: [{ node: 'worker1', state: 'starting' }] }), 0);
    expect(none.tracks).toEqual([]);
    expect(none.label).toBe('Sin endpoints preparados');
  });

  it('mantiene el fallo de imagen durante la investigación sin simular una descarga exitosa', () => {
    const failing = motionPlan(context('pipeline', CASES.pull[1], 'pull'), 0);
    expect(failing.tracks.flat().every((hop) => hop.kind === 'error')).toBe(true);
    const investigating = motionPlan(context('pipeline', CASES.pull[2], 'pull'), 0);
    expect(investigating.tone).toBe('error');
    expect(investigating.tracks).toEqual([]);
    expect(CASES.pull[2].pods[0].state).toBe('error');
  });

  it('representa Prometheus como consulta de métricas y no como receptor de logs', () => {
    const frame = CASES.traffic[0];
    const metrics = motionPlan(context('observe', frame), 0).tracks[0];
    expect(metrics.map(({ from, to }) => [from, to])).toEqual([
      ['prometheus', 'worker1'],
      ['worker1', 'prometheus'],
    ]);
    const logs = motionPlan(context('observe', frame), 1).tracks.flat();
    expect(logs.every((hop) => hop.to === 'loki')).toBe(true);
    const queries = motionPlan(context('observe', frame), 2).tracks;
    expect(queries.map((path) => path[0].to)).toEqual(['prometheus', 'loki']);
  });

  it('repite únicamente el paso actual del despliegue y rechaza topologías desconocidas', () => {
    const original = JSON.stringify(CASES.deploy[4]);
    const plan = motionPlan(context('pipeline', CASES.deploy[4], 'deploy'), 7);
    expect(plan.tracks.map((path) => path[0].to)).toEqual(['worker1', 'worker2']);
    expect(JSON.stringify(CASES.deploy[4])).toBe(original);
    expect(() => motionPlan(context('desconocida', { pods: [] }), 0)).toThrow('topología');
  });
});

describe('reproducción y cancelación', () => {
  it('pausa paquetes y conserva la velocidad elegida al reanudar', () => {
    const { player, animator } = playerHarness();
    player.start();
    player.pause();
    player.setSpeed(2);
    expect(player.state).toBe('paused');
    expect(animator.speed).toBe(0);
    player.resume();
    expect(animator.speed).toBe(2);
    player.stop();
  });

  it('reproduce un solo recorrido sin iniciar un bucle adicional', async () => {
    const { player, animator, finish, onError } = playerHarness();
    player.start({ repeat: false });
    finish();
    await flush();
    expect(player.state).toBe('idle');
    expect(player.cycles).toBe(1);
    expect(animator.play).toHaveBeenCalledTimes(1);
    expect(animator.wait).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });

  it('cancela el recorrido y la espera entre ciclos sin reactivar una escena anterior', async () => {
    const { player, finish, onPlan, onError } = playerHarness();
    player.start();
    finish();
    await flush();
    expect(player.cycles).toBe(1);
    player.stop();
    await flush();
    expect(player.state).toBe('idle');
    expect(onPlan).toHaveBeenCalledTimes(1);
    player.start();
    player.stop();
    await flush();
    expect(onPlan).toHaveBeenCalledTimes(2);
    expect(onError).not.toHaveBeenCalled();
  });

  it('comunica un fallo de reproducción en vez de contar un recorrido exitoso', async () => {
    const { player, animator, onError } = playerHarness();
    animator.play.mockResolvedValue(false);
    player.start();
    await flush();
    expect(player.cycles).toBe(0);
    expect(player.state).toBe('idle');
    expect(onError).toHaveBeenCalledOnce();
  });
});
