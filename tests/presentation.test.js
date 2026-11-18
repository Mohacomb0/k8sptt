import { describe, expect, it } from 'vitest';
import {
  CASES,
  caseFrame,
  isDemoAdvanceShortcut,
  legacyLaboratoryUrl,
  nextIndex,
  presenterState,
  slideIndex,
} from '../src/presentation/model.js';
import { SLIDES } from '../src/presentation/slides.js';

describe('navegación de la presentación', () => {
  it('resuelve un enlace directo y usa la portada si no existe', () => {
    const target = SLIDES.findIndex((slide) => slide.id === 'nodo-caido');
    expect(slideIndex('#nodo-caido', SLIDES)).toBe(target);
    expect(slideIndex('#no-existe', SLIDES)).toBe(0);
    expect(slideIndex('', SLIDES)).toBe(0);
    expect(slideIndex('#pipeline', SLIDES)).toBe(SLIDES.findIndex((slide) => slide.id === 'pipeline'));
  });

  it('no permite salir de los límites con anterior o siguiente', () => {
    expect(nextIndex(0, -1, SLIDES.length)).toBe(0);
    expect(nextIndex(SLIDES.length - 1, 1, SLIDES.length)).toBe(SLIDES.length - 1);
    expect(nextIndex(2, 1, SLIDES.length)).toBe(3);
  });

  it('prepara la diapositiva actual y la siguiente para la vista del ponente', () => {
    const state = presenterState(SLIDES, 0);
    expect(state).toMatchObject({
      type: 'presenter-state',
      index: 1,
      total: SLIDES.length,
      chapter: SLIDES[0].chapter,
      notes: SLIDES[0].notes,
      nextTitle: 'Tres preguntas. Un recorrido.',
    });
    expect(presenterState(SLIDES, SLIDES.length - 1).nextTitle).toBeUndefined();
    expect(() => presenterState(SLIDES, SLIDES.length)).toThrow('Diapositiva desconocida');
  });

  it('redirige enlaces históricos al laboratorio sin perder parámetros ni fragmentos', () => {
    expect(
      legacyLaboratoryUrl({
        pathname: '/',
        search: '?escenario=cors&detalle=a%20b',
        hash: '#paso-2',
      }),
    ).toBe('/laboratorio.html?escenario=cors&detalle=a%20b#paso-2');
    expect(
      legacyLaboratoryUrl({
        pathname: '/request-journey/index.html',
        search: '?escenario=cors',
        hash: '#pipeline',
      }),
    ).toBe('/request-journey/laboratorio.html?escenario=cors#pipeline');
    expect(legacyLaboratoryUrl({ pathname: '/', hash: '#pipeline' })).toBeNull();
    expect(legacyLaboratoryUrl({ pathname: '/laboratorio.html', search: '?escenario=cors' })).toBeNull();
  });
});

describe('atajo de la demo', () => {
  it('reserva Espacio para escenarios sin apropiarse del foco interactivo ni de otras diapositivas', () => {
    expect(isDemoAdvanceShortcut({ key: ' ' }, { hasScenario: true })).toBe(true);
    expect(isDemoAdvanceShortcut({ key: ' ' }, { hasScenario: false })).toBe(false);
    expect(isDemoAdvanceShortcut({ key: ' ' }, { hasScenario: true, interactive: true })).toBe(false);
    expect(isDemoAdvanceShortcut({ key: ' ' }, { hasScenario: true, dialogOpen: true })).toBe(false);
    expect(isDemoAdvanceShortcut({ key: 'ArrowRight' }, { hasScenario: true })).toBe(false);
  });

  it('respeta eventos ya consumidos y combinaciones de teclas del navegador', () => {
    for (const flag of ['defaultPrevented', 'ctrlKey', 'metaKey', 'altKey', 'shiftKey']) {
      expect(isDemoAdvanceShortcut({ key: ' ', [flag]: true }, { hasScenario: true })).toBe(false);
    }
  });
});

describe('casos didácticos', () => {
  it('publicar una imagen aún no crea pods; el despliegue acaba con dos réplicas Ready', () => {
    expect(caseFrame('deploy', 2).pods).toHaveLength(0);
    const starting = caseFrame('deploy', 4);
    expect(starting.pods.every((pod) => pod.state === 'starting')).toBe(true);
    expect(starting.paths).toEqual([
      ['registry', 'worker1'],
      ['registry', 'worker2'],
    ]);
    const ready = caseFrame('deploy', 5).pods;
    expect(ready).toHaveLength(2);
    expect(ready.every((pod) => pod.state === 'ready')).toBe(true);
  });

  it('el rollout conserva dos pods preparados y como máximo uno adicional', () => {
    for (const frame of CASES.rollout) {
      expect(frame.pods.filter((pod) => pod.state === 'ready')).toHaveLength(2);
      expect(frame.pods.length).toBeLessThanOrEqual(3);
    }
    expect(CASES.rollout.at(-1).pods.every((pod) => pod.label.includes('v2'))).toBe(true);
  });

  it('reemplaza el pod perdido sin reparar ficticiamente el nodo caído', () => {
    expect(caseFrame('node', 1).pods.filter((pod) => pod.state === 'ready')).toHaveLength(1);
    const replacement = caseFrame('node', 3);
    expect(replacement.down).toBe('worker1');
    expect(replacement.pods.some((pod) => pod.node === 'worker2' && pod.state === 'starting')).toBe(true);
    const recovered = CASES.node.at(-1);
    expect(recovered.down).toBe('worker1');
    expect(recovered.pods).toHaveLength(2);
    expect(recovered.pods.every((pod) => pod.node === 'worker2' && pod.state === 'ready')).toBe(true);
  });

  it('mantiene el fallo de pull durante la investigación y solo recupera tras corregirlo', () => {
    expect(caseFrame('pull', 1).pods[0].state).toBe('error');
    expect(caseFrame('pull', 2).pods[0].state).toBe('error');
    expect(caseFrame('pull', 3).pods[0].state).toBe('ready');
  });

  it('acota los pasos y rechaza casos desconocidos en lugar de simular un éxito', () => {
    expect(caseFrame('node', -1)).toBe(CASES.node[0]);
    expect(caseFrame('node', 100)).toBe(CASES.node.at(-1));
    expect(() => caseFrame('desconocido', 0)).toThrow('Demostración desconocida');
  });
});
