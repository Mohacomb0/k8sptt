const cards = (...items) =>
  `<div class="cards">${items.map(([title, text]) => `<article class="info-card"><h2>${title}</h2><p>${text}</p></article>`).join('')}</div>`;
const commands = (text) =>
  `<pre class="commands"><code>${text.replaceAll('<', '&lt;').replaceAll('>', '&gt;')}</code></pre>`;
const tags = (...items) => `<div class="tags">${items.map((item) => `<span>${item}</span>`).join('')}</div>`;

export const SLIDES = [
  {
    id: 'inicio',
    chapter: 'El punto de partida',
    kicker: 'DEVELOPERS × PLATAFORMA',
    title: 'Del código\nal clúster.',
    description: 'Una misma ruta para construir, desplegar y entender nuestras aplicaciones.',
    content:
      tags('Jenkins', 'Registry', 'Kubernetes', 'Observabilidad') +
      '<div class="audience"><strong>18 developers. Un lenguaje común.</strong><span>Desarrollo, sistemas y responsables, en la misma página.</span></div>',
    takeaway: 'No se trata de memorizar comandos. Se trata de entender qué pasa después de un push.',
    source: 'Base: intro_nodos_kubernetes_grupmed.pdf · Recorrido sugerido: 45–60 min + ejercicio.',
    visual: 'pipeline',
    visualTitle: 'EL RECORRIDO COMPLETO',
    notes:
      'Abrir con una pregunta al público: cuando una versión falla, ¿sabemos en qué etapa buscar? Presentar el objetivo para responsables: repetibilidad, trazabilidad y diagnóstico seguro. No prometer que las integraciones mostradas estén ya configuradas.',
  },
  {
    id: 'mapa',
    chapter: 'El punto de partida',
    kicker: 'QUÉ NOS LLEVAMOS HOY',
    title: 'Tres preguntas.\nUn recorrido.',
    description: 'Primero el modelo mental. Después el flujo de entrega. Por último, cómo observar y diagnosticar.',
    content: cards(
      ['01 · ¿Dónde corre?', 'Clúster, nodos, pods y estado deseado.'],
      ['02 · ¿Cómo llega?', 'Git → Jenkins → registry → despliegue.'],
      ['03 · ¿Cómo lo entendemos?', 'Dashboard, métricas, eventos y logs.'],
    ),
    takeaway: 'Un despliegue no termina al publicar una imagen: termina al comprobar que funciona.',
    source: 'PDF · págs. 2–4 y 8–12. Ampliación: flujo CI/CD y observabilidad.',
    visual: 'pipeline',
    visualTitle: 'CÓDIGO → ARTEFACTO → EJECUCIÓN',
    notes:
      'La sesión sirve tanto para leer una arquitectura como para trabajar con ella. Los escenarios son simulaciones locales, no consultas al clúster real.',
  },
  {
    id: 'origen',
    chapter: 'Modelo mental',
    kicker: 'UN POCO DE CONTEXTO',
    title: 'De Google.\nPara todos.',
    description:
      'Kubernetes nació en Google, inspirado por la experiencia de sistemas como Borg. Se publicó como open source en 2014 y pasó a la CNCF en 2015.',
    content: cards(
      ['Contenedores', 'Empaquetan una aplicación y sus dependencias.'],
      ['Kubernetes', 'Orquesta su ejecución en un conjunto de máquinas.'],
      ['No es magia', 'No construye tu código ni resuelve automáticamente errores, datos o seguridad.'],
    ),
    takeaway: 'Un contenedor es una pieza. Kubernetes coordina el conjunto.',
    source: 'Contexto adicional · kubernetes.io/docs/concepts/overview/',
    visual: 'cluster',
    visualTitle: 'UNA PLATAFORMA, VARIAS MÁQUINAS',
    notes:
      'Evitar una clase de historia. Explicar en un minuto la diferencia entre ejecutar un contenedor y operar muchas aplicaciones. Kubernetes no exige que los nodos estén en una nube pública.',
  },
  {
    id: 'unidades',
    chapter: 'Modelo mental',
    kicker: 'EL VOCABULARIO MÍNIMO',
    title: 'Clúster ≠ nodo\n≠ pod.',
    description: 'Kubernetes reparte cargas de trabajo sobre la capacidad disponible.',
    content: cards(
      ['Clúster', 'El conjunto de máquinas y componentes que funciona como plataforma.'],
      ['Nodo', 'Máquina física o virtual: aporta CPU, memoria, red y almacenamiento.'],
      ['Pod', 'Unidad mínima desplegable; agrupa uno o varios contenedores.'],
    ),
    takeaway: 'Los pods son reemplazables. No te apoyes en su nombre, su IP o su nodo como identidad permanente.',
    source: 'PDF · pág. 2.',
    visual: 'cluster',
    visualTitle: 'PODS SOBRE NODOS',
    notes:
      'Señalar el límite de cada worker y los bloques que representan pods. Un namespace es una separación lógica, no una máquina ni una garantía de aislamiento de red.',
  },
  {
    id: 'control',
    chapter: 'Modelo mental',
    kicker: 'QUIÉN DECIDE · QUIÉN EJECUTA',
    title: 'El control plane\ncoordina.',
    description: 'Los nodos de trabajo ejecutan. Los roles no implican necesariamente máquinas separadas.',
    content: cards(
      ['Control plane', 'API server: entrada · etcd: estado · scheduler: ubicación · controllers: reconciliación.'],
      [
        'En cada worker',
        'Kubelet: mantiene los pods · runtime: ejecuta contenedores · CNI: red · kube-proxy o equivalente: Services.',
      ],
    ),
    takeaway: 'El scheduler asigna un nodo. El kubelet y el runtime hacen que los contenedores se ejecuten.',
    source: 'PDF · pág. 3. La distribución real depende de la instalación y sus taints.',
    visual: 'cluster',
    visualTitle: 'CONTROL Y EJECUCIÓN',
    notes:
      'No deducir el rol de una máquina por su nombre. El diagrama muestra roles conceptuales; el PDF no acredita que el inventario pertenezca a un único clúster ni cuántos control planes hay.',
  },
  {
    id: 'estado-deseado',
    chapter: 'Modelo mental',
    kicker: 'LA IDEA QUE LO CONECTA TODO',
    title: 'Declaras el qué.\nSe reconcilia el cómo.',
    description:
      '“Quiero dos réplicas de esta imagen”. Los controladores comparan continuamente esa intención con lo que existe.',
    content:
      commands(
        'apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: mi-api\nspec:\n  replicas: 2\n  # Fragmento didáctico, no aplicable por sí solo',
      ) + tags('API valida y guarda', 'Controller crea', 'Scheduler asigna', 'Kubelet ejecuta'),
    takeaway: 'No es una orden de una sola vez: es un bucle continuo de reconciliación.',
    source: 'PDF · pág. 4. Fragmento incompleto deliberadamente; no ejecutar.',
    visual: 'cluster',
    visualTitle: 'ESTADO DESEADO: 2 RÉPLICAS',
    notes:
      'Explicar Deployment → ReplicaSet → Pod. Si borramos un pod gestionado, el controlador puede recrearlo; por eso borrar no equivale a arreglar la causa.',
  },
  {
    id: 'inventario',
    chapter: 'Nuestra plataforma',
    kicker: 'INVENTARIO · ACCESO AUTORIZADO',
    title: 'Inventario.\nUna foto a validar.',
    description:
      'El inventario ayuda a situar la plataforma. Los datos operativos se consultan en el entorno autorizado.',
    content: cards(
      ['Estado de los nodos', 'Comprueba disponibilidad y versión con las fuentes autorizadas.'],
      ['Carga de trabajo', 'Contrasta los totales y el detalle antes de tomar decisiones.'],
      ['Capacidad', 'Distingue CPU y memoria totales, asignables y realmente utilizadas.'],
    ),
    takeaway: 'El estado cambia. Valida el inventario con sistemas antes de operar.',
    source: 'PDF · págs. 5–6. Datos operativos reservados; confirmar con sistemas.',
    visual: 'cluster',
    visualTitle: 'ESQUEMA CONCEPTUAL · NO ES EL INVENTARIO',
    notes:
      'Consultar el inventario original con sistemas. Contrastar cabeceras y filas; distinguir capacidad total, asignable y libre. No inferir roles, topología o aislamiento por los nombres de las máquinas.',
  },
  {
    id: 'recursos',
    chapter: 'Nuestra plataforma',
    kicker: 'CAPACIDAD NO ES SOLO CONTAR PODS',
    title: 'Reservar.\nLimitar. Medir.',
    description:
      'Un nodo puede ejecutar muchas aplicaciones. La planificación debe tener en cuenta sus recursos y restricciones.',
    content: cards(
      [
        'Requests → ubicación',
        'El scheduler considera las peticiones declaradas y la capacidad asignable. No son una medida del consumo actual.',
      ],
      ['Limits → techo', 'CPU: puede haber throttling. Memoria: superar el límite puede causar OOMKilled.'],
      [
        'Uso real → métricas',
        'Se observa con metrics-server o Prometheus. Un nodo con pocos pods también puede estar saturado.',
      ],
    ),
    takeaway: 'Un pod Pending puede necesitar capacidad o una restricción distinta, no un reinicio.',
    source: 'PDF · págs. 6–7.',
    visual: 'cluster',
    visualTitle: 'RECURSOS COMPARTIDOS',
    notes:
      'No presentar request como dedicación física exclusiva. Hablar de requests por contenedor, presión del nodo y allocatable. El número de pods por sí solo no permite comparar carga entre servidores. Tras confirmar contexto y permisos: kubectl top nodes; kubectl top pods -n mi-equipo; kubectl describe node mi-nodo. Sustituir los nombres de ejemplo. Los comandos top requieren la API de métricas, normalmente servida por metrics-server; confirmar su disponibilidad con sistemas, sin asumir que esté instalado. describe node muestra condiciones, capacidad asignable, recursos solicitados y eventos; no mide el consumo real.',
  },
  {
    id: 'pipeline',
    chapter: 'Del código al despliegue',
    kicker: 'DEMO PASO A PASO',
    title: 'Un push no es\nun despliegue.',
    description: 'Recorramos la cadena completa: código revisado, comprobaciones, artefacto y estado deseado.',
    content:
      tags('01 Git', '02 Jenkins', '03 Registry', '04 API Kubernetes', '05 Pods Ready') +
      cards([
        'Cada etapa deja una evidencia',
        'Commit → ejecución de pipeline → digest de imagen → revisión desplegada.',
      ]),
    takeaway: 'Publicar una imagen en el registry no actualiza los pods por sí solo.',
    source: 'PDF · pág. 4 + ampliación CI/CD. Flujo propuesto, a adaptar al Jenkinsfile y permisos reales.',
    visual: 'pipeline',
    visualTitle: 'EL VIAJE DE UNA VERSIÓN',
    scenario: 'deploy',
    notes:
      'Avanzar con el botón de la demo; las flechas del teclado cambian diapositiva. No asumir despliegue directo por Jenkins: el mecanismo podría ser GitOps u otro flujo, y hay que concretarlo con sistemas.',
  },
  {
    id: 'responsabilidades',
    chapter: 'Del código al despliegue',
    kicker: 'UN CONTRATO ENTRE EQUIPOS',
    title: 'Cada pieza tiene\nsu responsabilidad.',
    description: 'Separar construcción, almacenamiento y ejecución facilita saber dónde investigar.',
    content: cards(
      [
        'Jenkins · automatiza',
        'Pruebas, build, publicación y fase de despliegue según el pipeline acordado. No es el runtime.',
      ],
      [
        'Registry · almacena',
        'Imágenes y versiones. Los nodos necesitan conectividad, confianza TLS y permisos de lectura.',
      ],
      ['Kubernetes · ejecuta', 'Reconciliación, planificación, réplicas y actualizaciones. No sustituye a la CI.'],
    ),
    takeaway: 'Misma imagen promovida entre entornos; configuración y secretos separados del artefacto.',
    source: 'Ampliación CI/CD sobre el flujo de despliegue de la pág. 4.',
    visual: 'pipeline',
    visualTitle: 'CONSTRUIR ≠ PUBLICAR ≠ EJECUTAR',
    notes:
      'Acordar con sistemas: URL del registry, credenciales gestionadas, convenciones de tags/digests, namespaces y permisos. Nunca incluir secretos en la imagen, el repositorio o las diapositivas.',
  },
  {
    id: 'trafico',
    chapter: 'Del código al despliegue',
    kicker: 'DEMO · EL CAMINO DE UNA PETICIÓN',
    title: 'Los usuarios no\nllaman a Jenkins.',
    description: 'El tráfico de la aplicación sigue otro camino: entrada HTTP, Service y un pod preparado.',
    content: cards(
      ['Ingress', 'Reglas HTTP/HTTPS, implementadas por un controlador instalado.'],
      ['Service', 'Un acceso estable a un conjunto cambiante de pods seleccionados.'],
      ['Readiness', 'Indica si el pod está preparado para recibir tráfico a través del Service.'],
    ),
    takeaway: 'Los pods cambian. El punto de acceso de la aplicación debe mantenerse estable.',
    source: 'PDF · págs. 4 y 12. Recorrido lógico simplificado; la implementación de red puede variar.',
    visual: 'traffic',
    visualTitle: 'TRÁFICO DE APLICACIÓN',
    scenario: 'traffic',
    notes:
      'Distinguir tráfico de despliegue de tráfico de usuarios. El Service es una abstracción de red, no necesariamente un proceso o un salto físico. Ingress no es la única alternativa posible para publicar aplicaciones.',
  },
  {
    id: 'rollout',
    chapter: 'Casos que vamos a encontrar',
    kicker: 'CASO 01 · NUEVA VERSIÓN',
    title: 'Cambiar la versión.\nSin saltar al vacío.',
    description:
      'Un RollingUpdate sustituye réplicas progresivamente. La disponibilidad depende de la configuración y de la aplicación.',
    content:
      tags('maxSurge: 1', 'maxUnavailable: 0', 'readinessProbe') +
      commands(
        'kubectl rollout status deployment/mi-api -n mi-equipo\nkubectl rollout history deployment/mi-api -n mi-equipo',
      ),
    takeaway: 'Arrancar no es estar preparado. Estar Ready tampoco demuestra que el negocio funcione bien.',
    source: 'PDF · pág. 4 + ampliación de actualizaciones. Los comandos consultan; adaptar nombres y contexto.',
    visual: 'cluster',
    visualTitle: 'ROLLING UPDATE · V1 → V2',
    scenario: 'rollout',
    notes:
      'Avanzar la demo. Se presupone capacidad para un pod adicional. Liveness reinicia ante fallo; readiness controla disponibilidad; startup protege arranques lentos. Un rollback no deshace migraciones de base de datos.',
  },
  {
    id: 'nodo-caido',
    chapter: 'Casos que vamos a encontrar',
    kicker: 'CASO 02 · NODO NO DISPONIBLE',
    title: 'Se pierde un nodo.\nNo la intención.',
    description:
      'El Deployment sigue queriendo dos réplicas. Recuperarlas requiere detección, tiempo y capacidad compatible.',
    content: cards(
      ['Durante el incidente', 'Puede quedar menos capacidad y haber errores hasta que se detecta y propaga el fallo.'],
      ['Después', 'Se crean pods nuevos. Volúmenes, afinidades y recursos pueden impedir que queden Ready.'],
    ),
    takeaway: 'La autorrecuperación no es instantánea ni garantiza por sí sola continuidad o recuperación de datos.',
    source: 'PDF · págs. 2, 6 y 9. Simulación sin escala temporal real.',
    visual: 'traffic',
    visualTitle: 'NOTREADY → RECONCILIACIÓN',
    scenario: 'node',
    notes:
      'Señalar que el pod no se teletransporta. La eliminación/evicción y el reemplazo dependen de tolerations, estado del nodo y controlador. Una réplica por nodo debe configurarse; no se garantiza por pedir dos réplicas.',
  },
  {
    id: 'imagen',
    chapter: 'Casos que vamos a encontrar',
    kicker: 'CASO 03 · IMAGEN INACCESIBLE',
    title: 'El pipeline pasó.\nEl pod no arranca.',
    description: 'ImagePullBackOff sitúa la investigación entre la referencia de imagen, el nodo y el registry.',
    content:
      commands('kubectl describe pod mi-pod -n mi-equipo\nkubectl get events -n mi-equipo --sort-by=.lastTimestamp') +
      tags('Nombre / digest / tag', 'Permisos', 'DNS / red', 'Certificados'),
    takeaway: 'Busca el motivo en Events. Borrar el pod no corrige una imagen que no existe.',
    source: 'PDF · págs. 8–9.',
    visual: 'pipeline',
    visualTitle: 'DEL REGISTRY AL NODO',
    scenario: 'pull',
    notes:
      'Diferenciar credenciales de publicación de Jenkins y credenciales de lectura de los nodos/pods. No mostrar tokens ni contenido de Secrets al público.',
  },
  {
    id: 'observabilidad',
    chapter: 'Ver antes de tocar',
    kicker: 'TRES VENTANAS COMPLEMENTARIAS',
    title: 'Estado.\nMétricas. Logs.',
    description: 'Cada herramienta contesta una pregunta distinta. Ninguna cuenta toda la historia por sí sola.',
    content: cards(
      ['Dashboard · ¿qué hay?', 'Recursos, estado, ubicación y eventos mediante una interfaz con acceso controlado.'],
      [
        'Prometheus + Grafana · ¿cómo va?',
        'Prometheus recoge y almacena métricas. Grafana consulta y visualiza esas series.',
      ],
      [
        'Logs · ¿qué ocurrió?',
        'kubectl logs permite leer salida de contenedores. Centralizar y retener requiere otro backend, por ejemplo Loki.',
      ],
    ),
    takeaway:
      'Prometheus no es un sistema de logs. Grafana puede consultar métricas y logs si existen fuentes configuradas.',
    source: 'PDF · págs. 7–9 + ampliación de observabilidad. Loki es una opción, no una instalación confirmada.',
    visual: 'observe',
    visualTitle: 'SEÑALES, NO SUPOSICIONES',
    notes:
      'Confirmar qué dashboard y qué stack se han instalado realmente. No prometer retención, alertas o consultas a logs históricos hasta verificar backends y recolectores. No exponer paneles sin autenticación y RBAC.',
  },
  {
    id: 'paneles',
    chapter: 'Ver antes de tocar',
    kicker: 'QUÉ MIRAR EN CADA PANTALLA',
    title: 'Del síntoma\nal contexto.',
    description: 'Un pico de CPU aislado dice poco. Correlaciona la aplicación, la versión, el namespace y el momento.',
    content: cards(
      [
        'Vista de servicio',
        'Tasa de peticiones, errores y latencia. Requiere instrumentación y una fuente de métricas adecuada.',
      ],
      ['Vista de Kubernetes', 'Réplicas Ready, reinicios, Pending, CPU, memoria y presión de nodo.'],
      ['Eventos y logs', 'Fallos de scheduling o pull; mensajes de arranque, excepciones y dependencias.'],
    ),
    takeaway: 'Empieza por impacto y tiempo; después sigue la evidencia hasta el pod y su nodo.',
    source: 'PDF · págs. 7–9. Paneles propuestos; no son métricas reales de la plataforma.',
    visual: 'observe',
    visualTitle: 'APLICACIÓN → POD → NODO',
    notes:
      'Proponer etiquetas estables: aplicación, entorno, namespace y versión. No convertir IDs de usuario/petición en etiquetas de Prometheus de alta cardinalidad. Logs sin datos sensibles.',
  },
  {
    id: 'diagnostico',
    chapter: 'Ver antes de tocar',
    kicker: 'LA SECUENCIA SEGURA',
    title: 'Primero evidencias.\nDespués cambios.',
    description: 'Delimita contexto e impacto antes de reiniciar o modificar recursos.',
    content: commands(
      'kubectl config current-context\nkubectl get nodes -o wide\nkubectl get pods -n mi-equipo -o wide\nkubectl get events -n mi-equipo --sort-by=.lastTimestamp\nkubectl describe pod mi-pod -n mi-equipo\nkubectl logs mi-pod -n mi-equipo --all-containers --tail=200\nkubectl logs mi-pod -n mi-equipo -c mi-contenedor --previous',
    ),
    takeaway: 'Contexto → namespace → recurso → evidencia. Los permisos pueden limitar lo que puedes consultar.',
    source: 'PDF · págs. 8 y 10. Sustituir nombres; --previous requiere un contenedor anterior disponible.',
    visual: 'cluster',
    visualTitle: 'DIAGNÓSTICO SIN MODIFICAR RECURSOS',
    notes:
      'El PDF usa -A para inventario global; aquí se prioriza el namespace del equipo. Las consultas globales requieren RBAC. En pods multicontenedor, elegir -c para --previous. No pegar comandos de cambio en producción.',
  },
  {
    id: 'senales',
    chapter: 'Ver antes de tocar',
    kicker: 'LEER LAS PISTAS',
    title: 'Un estado no es\nun diagnóstico.',
    description: 'Confirma siempre con detalle, eventos y logs; no con el nombre del síntoma.',
    content:
      '<div class="signal-list"><div><code>Pending</code><span>Recursos, taints, afinidad, PVC u otras restricciones.</span></div><div><code>CrashLoopBackOff</code><span>Fallo repetido: logs actuales/previos, configuración y dependencias.</span></div><div><code>ImagePullBackOff</code><span>Referencia de imagen, autenticación, DNS, red o TLS.</span></div><div><code>OOMKilled</code><span>Investigar límite, consumo y presión de memoria.</span></div><div><code>NotReady</code><span>Condiciones del nodo, kubelet, red y presión de recursos.</span></div></div>',
    takeaway: 'Muchos reinicios son una señal: comprueba también probes y dependencias inestables.',
    source: 'PDF · pág. 9. Estas señales mezclan condiciones, razones y estados de espera; no todas son fases de Pod.',
    visual: 'cluster',
    visualTitle: 'SÍNTOMA → EVIDENCIA → HIPÓTESIS',
    notes:
      'Pending no significa únicamente falta de CPU. OOMKilled puede relacionarse con límites o presión de memoria; confirmar en el estado del contenedor y el nodo. No subir límites sin comprobar capacidad e impacto.',
  },
  {
    id: 'seguridad',
    chapter: 'Trabajar como equipo',
    kicker: 'REGLAS DE ORO',
    title: 'Producción no es\nel laboratorio.',
    description: 'Un cambio pequeño, trazable y reversible vale más que una sucesión de reinicios sin explicación.',
    content: cards(
      [
        'Desarrollo',
        'Imagen reproducible, configuración explícita, probes y recursos revisados; logs útiles sin secretos.',
      ],
      ['Sistemas / plataforma', 'Accesos, capacidad, red, certificados, políticas y disponibilidad de la plataforma.'],
      ['En conjunto', 'Criterios de promoción, aprobación, impacto, ventana y plan de reversión.'],
    ),
    takeaway:
      'Antes de modificar: confirma contexto, permisos, impacto y rollback. Documenta causa, solución y prevención.',
    source: 'PDF · pág. 10. Reparto orientativo de responsabilidades, a acordar por el equipo.',
    visual: 'pipeline',
    visualTitle: 'TRAZABILIDAD DE EXTREMO A EXTREMO',
    notes:
      'Evitar crear silos: responsabilidades compartidas con puntos de contacto claros. Las acciones de cambio deben seguir el procedimiento interno; esta presentación no concede permisos.',
  },
  {
    id: 'preparacion',
    chapter: 'Trabajar como equipo',
    kicker: 'CHECKLIST · ANTES DE USAR EL ENTORNO',
    title: 'Primero, confirmar\ncon sistemas.',
    description: 'Todos estos puntos están por confirmar. La presentación no acredita accesos ni instalaciones.',
    content: cards(
      ['01 · Entorno y accesos', 'Por confirmar: contexto y namespace autorizados; acceso a Jenkins y al registry.'],
      ['02 · Entrega y reversión', 'Por confirmar: pipeline real, aprobación de cambios y procedimiento de rollback.'],
      ['03 · Observabilidad', 'Por confirmar: dashboard, fuentes de Grafana y backend y retención de logs.'],
    ),
    takeaway: 'Sin entorno y permisos de lectura confirmados, el ejercicio se hace con los casos simulados.',
    source: 'PDF · pág. 10 + checklist operativa propuesta. Pendiente de validar con sistemas.',
    visual: 'observe',
    visualTitle: 'PENDIENTES · NO ES UNA CONFIGURACIÓN REAL',
    notes:
      'Completar con sistemas antes de usar el entorno: contexto y namespace autorizados, accesos de mínimo privilegio a Jenkins y registry, pipeline realmente utilizado, quién aprueba cambios y cómo se revierte. Confirmar dashboard y fuentes configuradas en Grafana: Prometheus para métricas; para logs, backend y retención reales, con Loki solo como opción. No inventar URLs, accesos, arquitectura ni instalaciones. No mostrar credenciales. Para el ejercicio basta lectura autorizada; no ejecutar pipelines, despliegues ni rollback.',
  },
  {
    id: 'ejercicio',
    chapter: 'Trabajar como equipo',
    kicker: '15–20 MIN · SIN CAMBIAR RECURSOS',
    title: 'Ahora, seguir\nuna evidencia.',
    description:
      'En parejas, con acceso de lectura al entorno autorizado. Si no hay un pod reiniciándose, analizad uno sano.',
    content: cards(
      [
        '01 · Localizar',
        'Identificad contexto y namespace. Elegid un pod, su Deployment/controlador y el nodo donde corre.',
      ],
      [
        '02 · Investigar',
        'Consultad estado, Events y logs. Si hay reinicios, revisad logs anteriores cuando estén disponibles.',
      ],
      ['03 · Explicar', 'Resumid síntoma, evidencia, hipótesis y siguiente paso seguro. No hace falta tocar nada.'],
    ),
    takeaway: 'Éxito = explicar lo observado y proponer cómo comprobar la hipótesis sin poner en riesgo el servicio.',
    source: 'PDF · pág. 11. Nueve parejas para los 18 desarrolladores.',
    visual: 'cluster',
    visualTitle: 'OBSERVAR · RELACIONAR · EXPLICAR',
    notes:
      'Sistemas valida contexto y permisos antes del ejercicio. Si no hay acceso, usar los casos simulados. No forzar fallos ni borrar recursos para conseguir un ejemplo. Pedir a dos parejas un resumen de un minuto.',
  },
  {
    id: 'cierre',
    chapter: 'Trabajar como equipo',
    kicker: 'LO QUE QUEREMOS RECORDAR',
    title: 'Entregar con confianza.\nInvestigar con criterio.',
    description:
      'Jenkins automatiza. El registry conserva el artefacto. Kubernetes reconcilia. Las señales nos permiten comprobar.',
    content:
      '<div class="closing-list"><span>01 <strong>Una versión trazable.</strong></span><span>02 <strong>Un despliegue verificable.</strong></span><span>03 <strong>Un diagnóstico seguro.</strong></span></div>',
    takeaway: 'No necesitamos saberlo todo de Kubernetes para empezar; sí saber qué mirar y cuándo pedir ayuda.',
    source: 'Base principal: intro_nodos_kubernetes_grupmed.pdf · Material ampliado para onboarding del equipo.',
    visual: 'pipeline',
    visualTitle: 'DEL CÓDIGO AL CLÚSTER',
    notes:
      'Cerrar confirmando los pendientes operativos: URLs autorizadas, acceso al Jenkins y registry, namespaces por equipo, pipeline real, dashboard, fuentes de Grafana, retención de logs y procedimiento de rollback.',
  },
  {
    id: 'referencias',
    chapter: 'Material de consulta',
    kicker: 'PARA VOLVER DESPUÉS',
    title: 'Un mapa para\nseguir aprendiendo.',
    description:
      'Glosario mínimo y referencias oficiales. Esta presentación no reemplaza el procedimiento operativo del equipo.',
    content:
      '<div class="glossary"><p><strong>Namespace</strong> · separación lógica de recursos.</p><p><strong>Deployment</strong> · réplicas y actualizaciones declaradas.</p><p><strong>Service / Ingress</strong> · acceso estable / reglas de entrada HTTP.</p><p><strong>Probe</strong> · comprobación de arranque, disponibilidad o vida.</p></div><div class="reference-links"><a href="https://kubernetes.io/docs/concepts/" target="_blank" rel="noopener">Conceptos de Kubernetes ↗</a><a href="https://kubernetes.io/docs/reference/kubectl/cheatsheet/" target="_blank" rel="noopener">Referencia de kubectl ↗</a><a href="https://kubernetes.io/docs/tasks/debug/debug-application/debug-pods/" target="_blank" rel="noopener">Diagnóstico de pods ↗</a><a href="https://www.jenkins.io/doc/book/pipeline/" target="_blank" rel="noopener">Jenkins Pipeline ↗</a><a href="https://prometheus.io/docs/introduction/overview/" target="_blank" rel="noopener">Prometheus ↗</a><a href="https://grafana.com/docs/" target="_blank" rel="noopener">Grafana y Loki ↗</a></div>',
    takeaway: 'El inventario del PDF es histórico; verifica siempre la realidad antes de operar.',
    source: 'PDF · pág. 12 + documentación de las herramientas añadidas.',
    visual: 'observe',
    visualTitle: 'DOCUMENTACIÓN Y SIGUIENTES PASOS',
    notes:
      'Los modelos low-poly, el motor de escena y el animador de paquetes proceden de Request Journey 3D, de arnaucanet, licencia MIT. La presentación y sus recorridos están adaptados a DevOps y Kubernetes.',
  },
];
