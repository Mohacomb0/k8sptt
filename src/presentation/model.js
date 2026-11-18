export function slideIndex(hash, slides) {
  const id = hash.replace(/^#/, '');
  const index = slides.findIndex((slide) => slide.id === id);
  return index < 0 ? 0 : index;
}

export function nextIndex(index, delta, length) {
  return Math.max(0, Math.min(length - 1, index + delta));
}

export function presenterState(slides, index) {
  const slide = slides[index];
  if (!slide) throw new RangeError(`Diapositiva desconocida: ${index}`);
  return {
    type: 'presenter-state',
    index: index + 1,
    total: slides.length,
    chapter: slide.chapter,
    title: slide.title,
    notes: slide.notes,
    nextTitle: slides[index + 1]?.title.replace('\n', ' '),
  };
}

export function isDemoAdvanceShortcut(event, { hasScenario, interactive = false, dialogOpen = false }) {
  return (
    event.key === ' ' &&
    hasScenario &&
    !interactive &&
    !dialogOpen &&
    !event.defaultPrevented &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.altKey &&
    !event.shiftKey
  );
}

const pod = (label, node, state = 'ready') => ({ label, node, state });
const initialPods = () => [pod('api · v1', 'worker1'), pod('api · v1', 'worker2')];

export const CASES = {
  deploy: [
    {
      title: 'El código es el punto de partida',
      text: 'Un cambio revisado entra en Git. Todavía no hay nada nuevo ejecutándose en el clúster.',
      pods: [],
    },
    {
      title: 'Jenkins construye y comprueba',
      text: 'El pipeline ejecuta pruebas y genera una imagen. Si una comprobación falla, el pipeline debe detenerse.',
      path: ['git', 'jenkins'],
      pods: [],
    },
    {
      title: 'Una imagen versionada en el registry',
      text: 'Jenkins publica la imagen. Un digest identifica exactamente el artefacto que queremos desplegar.',
      path: ['jenkins', 'registry'],
      pods: [],
    },
    {
      title: 'Declaramos el estado deseado',
      text: 'La fase de despliegue actualiza la referencia de imagen mediante la API, con permisos y contexto del entorno.',
      path: ['jenkins', 'control'],
      pods: [],
    },
    {
      title: 'Los nodos descargan y arrancan',
      text: 'El scheduler asigna los pods. Cada kubelet pide al runtime descargar la imagen del registry.',
      paths: [
        ['registry', 'worker1'],
        ['registry', 'worker2'],
      ],
      pods: [pod('api · v2', 'worker1', 'starting'), pod('api · v2', 'worker2', 'starting')],
    },
    {
      title: 'Readiness habilita el tráfico',
      text: 'Los pods pasan a Ready. El Service puede enviarlos a sus endpoints; Jenkins no atiende las peticiones de los usuarios.',
      pods: [pod('api · v2', 'worker1'), pod('api · v2', 'worker2')],
    },
  ],
  traffic: [
    {
      title: 'El usuario hace una petición',
      text: 'Ejemplo HTTP con Ingress. Su controlador debe estar instalado y configurado; no aparece por crear un clúster.',
      pods: initialPods(),
    },
    {
      title: 'Entrada HTTP/HTTPS',
      text: 'El controlador de Ingress aplica las reglas de host/ruta y, según la configuración, termina TLS.',
      path: ['browser', 'ingress'],
      pods: initialPods(),
    },
    {
      title: 'Un punto de acceso estable',
      text: 'El Service selecciona endpoints de pods preparados. El dibujo representa el flujo lógico; el dataplane depende de la instalación.',
      path: ['ingress', 'service'],
      pods: initialPods(),
    },
    {
      title: 'Una réplica procesa la petición',
      text: 'La petición llega a un pod Ready. El nombre y la IP de ese pod pueden cambiar sin cambiar el Service.',
      path: ['service', 'worker2'],
      pods: initialPods(),
    },
  ],
  rollout: [
    {
      title: 'Dos réplicas de la versión actual',
      text: 'Partimos de dos pods Ready. Esta demo usa RollingUpdate con maxSurge: 1 y maxUnavailable: 0.',
      pods: initialPods(),
    },
    {
      title: 'Se crea una réplica nueva',
      text: 'La versión v2 arranca sin retirar aún las réplicas disponibles. Se necesita capacidad extra en el clúster.',
      pods: [...initialPods(), pod('api · v2', 'worker1', 'starting')],
    },
    {
      title: 'Primero Ready; después retirar',
      text: 'Cuando v2 supera readiness, puede retirarse un pod v1. Readiness no garantiza por sí sola que no haya errores funcionales.',
      pods: [pod('api · v2', 'worker1'), pod('api · v1', 'worker2')],
    },
    {
      title: 'Se renueva la segunda réplica',
      text: 'Otro pod v2 arranca mientras la versión anterior sigue disponible. El controlador repite el proceso.',
      pods: [pod('api · v2', 'worker1'), pod('api · v1', 'worker2'), pod('api · v2', 'worker2', 'starting')],
    },
    {
      title: 'Despliegue completado',
      text: 'Todas las réplicas son v2. Revisamos rollout, métricas y errores; la reversión requiere una revisión compatible y datos compatibles.',
      pods: [pod('api · v2', 'worker1'), pod('api · v2', 'worker2')],
    },
  ],
  node: [
    {
      title: 'Dos nodos, dos réplicas',
      text: 'Distribución ilustrativa. Para garantizar separación hay que declarar topology spread o reglas de afinidad apropiadas.',
      pods: initialPods(),
    },
    {
      title: 'Un nodo deja de estar disponible',
      text: 'Tras detectar el fallo, el nodo pasa a NotReady. No es instantáneo: intervienen heartbeats, condiciones y timeouts.',
      down: 'worker1',
      pods: [pod('api · v1', 'worker1', 'lost'), pod('api · v1', 'worker2')],
    },
    {
      title: 'El servicio conserva una réplica sana',
      text: 'Al propagarse los cambios de endpoints, el tráfico se dirige al pod preparado. Puede haber errores durante la detección y menos capacidad.',
      down: 'worker1',
      path: ['service', 'worker2'],
      pods: [pod('api · v1', 'worker1', 'lost'), pod('api · v1', 'worker2')],
    },
    {
      title: 'El controlador busca recuperar las réplicas',
      text: 'Tras los tiempos de tolerancia/evicción, se crea un sustituto. Solo puede programarse si hay recursos y las restricciones lo permiten.',
      down: 'worker1',
      pods: [pod('api · v1', 'worker2'), pod('api · v1', 'worker2', 'starting')],
    },
    {
      title: 'Se recupera el número de réplicas',
      text: 'El nuevo pod pasa a Ready en el nodo sano. No se ha movido el pod original ni se ha reparado el nodo; tampoco implica recuperar sus datos locales.',
      down: 'worker1',
      pods: [pod('api · v1', 'worker2'), pod('api · v1', 'worker2')],
    },
  ],
  pull: [
    {
      title: 'El manifiesto referencia una imagen',
      text: 'El pod ha sido asignado a un nodo. Su runtime necesita acceder al registry para obtener la imagen.',
      pods: [pod('api · v2', 'worker1', 'starting')],
    },
    {
      title: 'La descarga falla',
      text: 'ImagePullBackOff: se reintenta con espera creciente. Ejemplo: tag inexistente; también puede ser autenticación, certificados, DNS o red.',
      path: ['registry', 'worker1'],
      error: true,
      pods: [pod('api · v2', 'worker1', 'error')],
    },
    {
      title: 'Recogemos evidencias',
      text: 'Describe y Events muestran el motivo concreto. Revisamos referencia de imagen, acceso e imagePullSecrets sin imprimir credenciales.',
      pods: [pod('api · v2', 'worker1', 'error')],
    },
    {
      title: 'Corregimos la causa mediante el flujo acordado',
      text: 'Tras corregir la referencia en Git y desplegar una imagen accesible, el nuevo pod puede arrancar. Reiniciar por reflejo no arregla un tag inexistente.',
      pods: [pod('api · v2', 'worker1')],
    },
  ],
};

export function caseFrame(id, step) {
  const frames = CASES[id];
  if (!frames) throw new Error(`Demostración desconocida: ${id}`);
  return frames[nextIndex(step, 0, frames.length)];
}
