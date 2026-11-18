import './presentation.css';
import { SLIDES } from './slides.js';
import { CASES, caseFrame, isDemoAdvanceShortcut, nextIndex, presenterState, slideIndex } from './model.js';
import { MotionPlayer } from './MotionPlayer.js';
import { motionPlan } from './motion.js';

const $ = (id) => document.getElementById(id);
let index = slideIndex(location.hash, SLIDES);
let step = 0;
let manager;
let view;
let animator;
let motion;
let busy = false;
let generation = 0;
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
let reducedMotion = motionPreference.matches;
const chapters = [...new Set(SLIDES.map((slide) => slide.chapter))];
const dialog = $('index-dialog');
let presenterWindow;
const presenterSession = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

function syncPresenter() {
  if (!presenterWindow || presenterWindow.closed) return;
  presenterWindow.postMessage({ ...presenterState(SLIDES, index), session: presenterSession }, location.origin);
}

function announce(message) {
  $('app-status').textContent = message;
  $('app-status').hidden = false;
}

function currentFrame() {
  const slide = SLIDES[index];
  return slide.scenario
    ? caseFrame(slide.scenario, step)
    : {
        title: slide.visualTitle,
        text:
          slide.visual === 'observe'
            ? 'Relaciones conceptuales. Métricas requieren instrumentación/exporters; logs centralizados requieren un recolector y un backend.'
            : 'Esquema ilustrativo: dos workers, no la topología real ni la escala del inventario.',
        pods: [
          { label: 'api · v1', node: 'worker1', state: 'ready' },
          { label: 'api · v1', node: 'worker2', state: 'ready' },
        ],
      };
}

function renderFrame(animate = false) {
  motion?.stop();
  const slide = SLIDES[index];
  const frame = currentFrame();
  const frames = CASES[slide.scenario];
  $('scenario-controls').hidden = !frames;
  $('step-label').textContent = frames ? `PASO ${step + 1} / ${frames.length} · ${frame.title}` : frame.title;
  $('step-caption').textContent = frame.text;
  $('scenario-next').textContent = frames && step === frames.length - 1 ? 'Demo completada ✓' : 'Siguiente paso →';
  $('scenario-next').title = 'Avanzar demo: Espacio (fuera de botones, enlaces y campos)';
  $('scenario-next').disabled = busy || !frames || step === frames.length - 1;
  view?.setFrame(frame);
  if (!animate || !animator || reducedMotion) return;
  const paths = frame.paths ?? (frame.path ? [frame.path] : []);
  if (!paths.length) return;
  const token = generation;
  busy = true;
  $('scenario-next').disabled = true;
  renderMotionControls();
  const tracks = paths.map((path) =>
    path.slice(1).map((to, i) => ({
      from: path[i],
      to,
      kind: frame.error ? 'error' : 'request',
      ms: 20,
    })),
  );
  animator.play(tracks).finally(() => {
    if (generation !== token) return;
    busy = false;
    $('scenario-next').disabled = step === frames.length - 1;
    renderMotionControls();
  });
}

function render() {
  generation++;
  busy = false;
  motion?.stop();
  animator?.cancel();
  const slide = SLIDES[index];
  document.title = `${slide.title.replace('\n', ' ')} · GrupMed`;
  $('chapter-number').textContent = String(chapters.indexOf(slide.chapter) + 1).padStart(2, '0');
  $('chapter').textContent = slide.chapter;
  $('slide-kicker').textContent = slide.kicker;
  $('slide-title').textContent = slide.title;
  $('slide-description').textContent = slide.description;
  $('slide-content').innerHTML = slide.content;
  $('takeaway').textContent = slide.takeaway;
  $('source').textContent = slide.source;
  $('visual-title').textContent = slide.visualTitle;
  $('footer-chapter').textContent = slide.chapter;
  $('slide-count').textContent = `${String(index + 1).padStart(2, '0')} / ${SLIDES.length}`;
  $('progress').style.width = `${((index + 1) / SLIDES.length) * 100}%`;
  $('previous').disabled = index === 0;
  $('next').disabled = index === SLIDES.length - 1;
  $('speaker-notes').textContent = slide.notes;
  $('slide-index')
    .querySelectorAll('a')
    .forEach((link, i) => {
      if (i === index) link.setAttribute('aria-current', 'step');
      else link.removeAttribute('aria-current');
    });
  view?.setTopology(slide.visual);
  renderFrame();
  document.querySelector('.slide-copy').scrollTop = 0;
  syncPresenter();
}

function goTo(target) {
  if (target === index) return;
  index = target;
  step = 0;
  history.replaceState(null, '', `#${SLIDES[index].id}`);
  render();
}

function advanceDemo() {
  const frames = CASES[SLIDES[index].scenario];
  if (busy || !frames || step === frames.length - 1) return;
  step = nextIndex(step, 1, frames.length);
  renderFrame(true);
}

function toggleNotes() {
  const hidden = !$('speaker-notes').hidden;
  $('speaker-notes').hidden = hidden;
  $('notes-toggle').setAttribute('aria-pressed', String(!hidden));
}

function renderMotionControls() {
  const state = motion?.state ?? 'idle';
  const available = Boolean(motion) && !busy && !reducedMotion;
  const playing = state === 'playing';
  $('motion-toggle').disabled = !available;
  $('motion-once').disabled = !available || playing;
  $('motion-speed').disabled = !available;
  $('motion-toggle').textContent = playing
    ? 'Ⅱ Pausar movimiento'
    : state === 'paused'
      ? '▶ Reanudar movimiento'
      : '▶ Iniciar movimiento';
  $('motion-toggle').setAttribute('aria-pressed', String(playing));
  $('motion-speed').textContent = `${motion?.speed ?? 1}×`;
  $('motion-speed').setAttribute('aria-label', `Velocidad del movimiento: ${motion?.speed ?? 1}×`);
  $('motion-count').textContent = `RECORRIDOS ${String(motion?.cycles ?? 0).padStart(2, '0')}`;
  document.querySelector('.visual-panel').dataset.motion = state;
  view?.setActivityPaused(state === 'paused');
  if (state === 'idle') {
    view?.clearActivity();
    if (!motion?.cycles) $('motion-readout').hidden = true;
  }
  $('motion-signal').textContent = playing ? 'EN MOVIMIENTO' : state === 'paused' ? 'EN PAUSA' : 'RECORRIDO COMPLETADO';
  $('motion-hint').textContent = reducedMotion
    ? 'Movimiento desactivado: preferencia de accesibilidad del sistema.'
    : 'Tráfico, luces y señales · tú marcas el ritmo';
}

function openIndex() {
  motion?.pause();
  dialog.showModal();
}

function openPresenter() {
  if (presenterWindow && !presenterWindow.closed) {
    presenterWindow.focus();
    syncPresenter();
    return;
  }
  const url = new URL('presenter.html', location.href);
  url.searchParams.set('session', presenterSession);
  presenterWindow = window.open(url, 'grupmed-presenter', 'popup,width=1000,height=800');
  if (!presenterWindow) {
    announce('El navegador ha bloqueado la ventana. Permite ventanas emergentes para abrir la vista del ponente.');
    return;
  }
  presenterWindow.focus();
}

async function fullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch (error) {
    console.error('No se pudo cambiar el modo de pantalla completa.', error);
    announce('El navegador no permite cambiar a pantalla completa. Puedes usar su opción de pantalla completa.');
  }
}

$('slide-index').innerHTML = SLIDES.map(
  (slide, i) =>
    `<a href="#${slide.id}" data-slide="${i}"><span>${String(i + 1).padStart(2, '0')}</span><div><small>${slide.chapter}</small><strong>${slide.title.replace('\n', ' ')}</strong></div></a>`,
).join('');
$('slide-index').addEventListener('click', (event) => {
  const link = event.target.closest('a[data-slide]');
  if (!link) return;
  event.preventDefault();
  goTo(Number(link.dataset.slide));
  dialog.close();
});
$('previous').addEventListener('click', () => goTo(nextIndex(index, -1, SLIDES.length)));
$('next').addEventListener('click', () => goTo(nextIndex(index, 1, SLIDES.length)));
$('contents').addEventListener('click', openIndex);
$('presenter-view').addEventListener('click', openPresenter);
$('close-index').addEventListener('click', () => dialog.close());
$('notes-toggle').addEventListener('click', toggleNotes);
$('fullscreen').addEventListener('click', fullscreen);
document.addEventListener('fullscreenchange', () => {
  $('fullscreen').textContent = document.fullscreenElement ? 'Salir de pantalla completa' : 'Pantalla completa';
});
$('scenario-next').addEventListener('click', advanceDemo);
$('motion-toggle').addEventListener('click', () => {
  if (!motion || busy || reducedMotion) return;
  if (motion.state === 'playing') motion.pause();
  else if (motion.state === 'paused') motion.resume();
  else motion.start();
});
$('motion-once').addEventListener('click', () => {
  if (motion && !busy && !reducedMotion) motion.start({ repeat: false });
});
$('motion-speed').addEventListener('click', () => motion?.setSpeed(motion.speed === 1 ? 2 : 1));
window.addEventListener('message', (event) => {
  if (
    event.origin === location.origin &&
    event.source === presenterWindow &&
    event.data?.type === 'presenter-ready' &&
    event.data.session === presenterSession
  ) {
    syncPresenter();
  }
});
motionPreference.addEventListener('change', (event) => {
  reducedMotion = event.matches;
  if (reducedMotion) motion?.stop();
  renderMotionControls();
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) motion?.pause();
});
$('scenario-reset').addEventListener('click', () => {
  generation++;
  animator?.cancel();
  busy = false;
  step = 0;
  renderFrame();
});
window.addEventListener('hashchange', () => {
  index = slideIndex(location.hash, SLIDES);
  step = 0;
  render();
});
document.addEventListener('keydown', (event) => {
  if (
    isDemoAdvanceShortcut(event, {
      hasScenario: Boolean(CASES[SLIDES[index].scenario]),
      dialogOpen: dialog.open,
      interactive: Boolean(
        event.target.closest(
          'button, a, input, textarea, select, summary, audio[controls], video[controls], [contenteditable]:not([contenteditable="false"]), [role="button"], [role="link"], [role="textbox"], [role="checkbox"], [role="radio"], [role="switch"], [role="slider"], [role="spinbutton"], [role="combobox"], [role="listbox"], [role="menuitem"], [role="tab"]',
        ),
      ),
    })
  ) {
    event.preventDefault();
    if (!event.repeat) advanceDemo();
    return;
  }
  if (
    event.defaultPrevented ||
    event.ctrlKey ||
    event.metaKey ||
    event.altKey ||
    dialog.open ||
    event.target.closest('input, textarea, select, [contenteditable="true"]')
  )
    return;
  const key = event.key.toLowerCase();
  if (['arrowright', 'pagedown', 'arrowleft', 'pageup', 'home', 'end', 'i', 'n', 'f'].includes(key))
    event.preventDefault();
  if (key === 'arrowright' || key === 'pagedown') goTo(nextIndex(index, 1, SLIDES.length));
  if (key === 'arrowleft' || key === 'pageup') goTo(nextIndex(index, -1, SLIDES.length));
  if (key === 'home') goTo(0);
  if (key === 'end') goTo(SLIDES.length - 1);
  if (key === 'i') openIndex();
  if (key === 'n') toggleNotes();
  if (key === 'f') fullscreen();
});

async function initScene() {
  try {
    const [{ SceneManager }, { KubeView }, { PacketAnimator }] = await Promise.all([
      import('../scene/SceneManager.js'),
      import('./KubeView.js'),
      import('../scene/PacketAnimator.js'),
    ]);
    manager = new SceneManager($('kube-viewport'));
    view = new KubeView(manager);
    animator = new PacketAnimator(manager, view);
    animator.showLabels = false;
    motion = new MotionPlayer({
      animator: new PacketAnimator(manager, view),
      getPlan: (cycle) => motionPlan({ ...SLIDES[index], frame: currentFrame() }, cycle),
      onPlan(plan) {
        view.setActivity(plan);
        $('motion-readout').hidden = false;
        $('motion-readout').dataset.tone = plan.tone;
        $('motion-readout').title = plan.detail;
        $('motion-label').textContent = plan.label;
        $('motion-detail').textContent = plan.detail;
      },
      onChange: renderMotionControls,
      onError(error) {
        console.error('No se pudo reproducir el recorrido visual.', error);
        announce('No se ha podido reproducir el recorrido. Puedes continuar con las diapositivas o reiniciar la demo.');
      },
    });
    motion.animator.showLabels = false;
    render();
    manager.start();
    $('kube-viewport')
      .querySelector('canvas')
      .setAttribute('aria-label', 'Diagrama 3D ilustrativo. Su explicación textual aparece debajo.');
  } catch (error) {
    console.error('No se pudo iniciar el diagrama 3D de la presentación.', error);
    $('scene-fallback').hidden = false;
    $('kube-viewport').hidden = true;
    document.querySelector('.motion-controls').hidden = true;
  }
}

render();
initScene();
