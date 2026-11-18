import './presenter.css';

const params = new URLSearchParams(location.search);
const session = params.get('session');
const status = document.getElementById('connection-status');

if (!session || !window.opener) {
  status.textContent = 'Abre esta vista desde el botón «Vista del ponente» de la presentación.';
} else {
  window.addEventListener('message', ({ data, origin, source }) => {
    if (origin !== location.origin || source !== window.opener || data?.session !== session) return;
    if (data.type === 'presenter-state') {
      document.getElementById('slide-count').textContent = `${String(data.index).padStart(2, '0')} / ${data.total}`;
      document.getElementById('chapter').textContent = data.chapter;
      document.getElementById('current-title').textContent = data.title;
      document.getElementById('speaker-notes').textContent = data.notes;
      document.getElementById('next-title').textContent = data.nextTitle ?? 'Fin de la presentación';
      status.dataset.connected = 'true';
    }
  });
  window.opener.postMessage({ type: 'presenter-ready', session }, location.origin);
}

let elapsed = 0;
let timer;

function renderTime() {
  const minutes = Math.floor(elapsed / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (elapsed % 60).toString().padStart(2, '0');
  document.getElementById('elapsed').textContent = `${minutes}:${seconds}`;
}

function startTimer() {
  if (timer) return;
  timer = setInterval(() => {
    elapsed++;
    renderTime();
  }, 1000);
  document.getElementById('timer-toggle').textContent = 'Pausar tiempo';
  document.getElementById('timer-toggle').setAttribute('aria-pressed', 'true');
}

function pauseTimer() {
  clearInterval(timer);
  timer = undefined;
  document.getElementById('timer-toggle').textContent = 'Reanudar tiempo';
  document.getElementById('timer-toggle').setAttribute('aria-pressed', 'false');
}

document.getElementById('timer-toggle').addEventListener('click', () => (timer ? pauseTimer() : startTimer()));
document.getElementById('timer-reset').addEventListener('click', () => {
  elapsed = 0;
  renderTime();
  if (!timer) startTimer();
});
renderTime();
startTimer();
