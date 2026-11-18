const hop = (from, to, kind = 'request') => ({ from, to, kind, ms: 45 });
const track = (path, kind) => path.slice(1).map((to, i) => hop(path[i], to, kind));
const readyWorkers = (frame) => [
  ...new Set(frame.pods.filter((pod) => pod.state === 'ready' && pod.node !== frame.down).map((pod) => pod.node)),
];

export function motionPlan({ visual, scenario, frame }, cycle) {
  const ready = readyWorkers(frame);
  const workers = ['worker1', 'worker2'].filter((id) => id !== frame.down);
  if (visual === 'traffic') {
    if (!ready.length)
      return {
        label: 'Sin endpoints preparados',
        detail: 'No enviamos peticiones a pods que no están Ready.',
        tone: 'error',
        focus: ['service'],
        tracks: [],
      };
    const target = ready[cycle % ready.length];
    return {
      label: `Petición → ${target === 'worker1' ? 'Worker 01' : 'Worker 02'} → respuesta`,
      detail: 'Azul: ida. Verde: respuesta. Solo participan réplicas Ready; reparto alterno ilustrativo.',
      tone: 'request',
      focus: [target],
      tracks: [
        [
          ...track(['browser', 'ingress', 'service', target], 'request'),
          ...track([target, 'service', 'ingress', 'browser'], 'response'),
        ],
      ],
    };
  }

  if (scenario === 'deploy' || scenario === 'pull') {
    const paths = frame.paths ?? (frame.path ? [frame.path] : []);
    const failed = frame.pods.some((pod) => pod.state === 'error');
    const tone = failed || frame.error ? 'error' : paths.some((path) => path[0] === 'registry') ? 'query' : 'request';
    return {
      label: frame.title,
      detail: failed
        ? 'Rojo: descarga fallida. El movimiento no corrige la imagen ni cambia el estado del pod.'
        : 'Repetición visual de este paso; no avanza el despliegue ni modifica los pods.',
      tone,
      focus: paths.length
        ? []
        : failed
          ? ['registry', 'worker1']
          : ready.length
            ? ready
            : [scenario === 'deploy' ? 'git' : 'registry'],
      tracks: paths.map((path) => track(path, tone)),
    };
  }

  if (visual === 'observe') {
    const target = workers[cycle % workers.length];
    const phases = [
      {
        label: 'Prometheus consulta métricas',
        detail: 'Consulta al exporter y respuesta con métricas. Prometheus no está recogiendo logs.',
        tone: 'query',
        tracks: [[hop('prometheus', target), hop(target, 'prometheus', 'reply')]],
      },
      {
        label: 'Logs → recolector → Loki (opcional)',
        detail:
          'Violeta: salida de logs enviada mediante un recolector. Loki es una opción, no una instalación confirmada.',
        tone: 'query',
        tracks: [[hop(target, 'loki', 'query')]],
      },
      {
        label: 'Grafana consulta sus fuentes',
        detail: 'Grafana consulta métricas en Prometheus y, si está configurado, logs en Loki.',
        tone: 'response',
        tracks: ['prometheus', 'loki'].map((source) => [hop('grafana', source), hop(source, 'grafana', 'response')]),
      },
    ];
    return { ...phases[cycle % phases.length], focus: [] };
  }

  if (visual === 'cluster') {
    const target = workers[cycle % workers.length];
    return {
      label: 'API ↔ kubelet · reconciliación',
      detail: 'Ámbar: intercambio lógico de estado. El kubelet consulta la API e informa; no es tráfico de usuarios.',
      tone: 'dns',
      focus: [target],
      tracks: [[hop(target, 'control', 'dns'), hop('control', target, 'dns')]],
    };
  }

  if (visual === 'pipeline') {
    const phases = [
      {
        label: 'Código → Jenkins',
        detail: 'El pipeline comprueba y construye el código revisado.',
        paths: [['git', 'jenkins']],
        tone: 'request',
      },
      {
        label: 'Imagen → registry',
        detail: 'Se publica un artefacto versionado. Publicar no despliega por sí solo.',
        paths: [['jenkins', 'registry']],
        tone: 'query',
      },
      {
        label: 'Estado deseado → API',
        detail: 'La fase de despliegue declara la versión que se quiere ejecutar.',
        paths: [['jenkins', 'control']],
        tone: 'dns',
      },
      {
        label: 'Asignación y ejecución',
        detail: 'Relación lógica: scheduler asigna; kubelet y runtime ejecutan.',
        paths: workers.map((id) => ['control', id]),
        tone: 'dns',
      },
      {
        label: 'Los nodos obtienen la imagen',
        detail: 'Petición al registry y descarga de imagen; no es tráfico de los usuarios.',
        paths: workers.map((id) => [id, 'registry', id]),
        tone: 'query',
      },
    ];
    const phase = phases[cycle % phases.length];
    return { ...phase, focus: [], tracks: phase.paths.map((path) => track(path, phase.tone)) };
  }

  throw new Error(`No hay recorrido visual para la topología: ${visual}`);
}
