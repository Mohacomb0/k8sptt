const layer = (label, kind) => `<div class="foundation-layer foundation-layer--${kind}">${label}</div>`;
const guest = (name, ...layers) => `<div class="foundation-guest"><strong>${name}</strong>${layers.join('')}</div>`;
const stack = (title, description, ...layers) =>
  `<div class="foundation-stack" role="img" aria-label="${description}"><p class="foundation-title">${title}</p>${layers.join('')}</div>`;
const need = (title, detail) => `<div class="foundation-need"><strong>${title}</strong><span>${detail}</span></div>`;
const milestone = (date, title, detail) =>
  `<li class="foundation-milestone"><span>${date}</span><div><strong>${title}</strong><p>${detail}</p></div></li>`;

export const FOUNDATION_DIAGRAMS = {
  baremetal: stack(
    'SERVIDOR FÍSICO',
    'La aplicación y sus dependencias se ejecutan sobre el sistema operativo de un servidor físico.',
    layer('Aplicación + dependencias', 'app'),
    layer('Sistema operativo', 'os'),
    layer('Hardware · CPU, memoria, disco y red', 'host'),
  ),
  vms: stack(
    'UN SERVIDOR · VARIOS SISTEMAS',
    'Dos máquinas virtuales, cada una con su aplicación y sistema operativo invitado, sobre un hipervisor y hardware compartido.',
    `<div class="foundation-guests">${guest('VM 01', layer('Aplicación A', 'app'), layer('SO invitado', 'os'))}${guest('VM 02', layer('Aplicación B', 'app'), layer('SO invitado', 'os'))}</div>`,
    layer('Hipervisor', 'runtime'),
    layer('Hardware compartido', 'host'),
  ),
  containers: stack(
    'UN HOST · UN KERNEL COMPARTIDO',
    'Dos contenedores con su aplicación y dependencias, sin un kernel propio. El runtime utiliza el kernel del sistema operativo del host, que puede ser físico o virtual.',
    `<div class="foundation-guests">${guest('Contenedor A', layer('App + dependencias', 'app'))}${guest('Contenedor B', layer('App + dependencias', 'app'))}</div>`,
    layer('Runtime de contenedores', 'runtime'),
    layer('SO del host · kernel compartido', 'os'),
    layer('Host físico o máquina virtual', 'host'),
  ),
  coordination: `
    <div class="foundation-overview">
      <p class="foundation-title">CUANDO CRECE LA ESCALA</p>
      <div class="foundation-focus"><span>EL RETO</span><strong>Coordinar la ejecución</strong></div>
      <div class="foundation-needs">
        ${need('Desplegar', 'Publicar versiones')}
        ${need('Escalar', 'Ajustar réplicas')}
        ${need('Supervisar', 'Detectar fallos')}
        ${need('Actualizar', 'Renovar con control')}
      </div>
    </div>`,
  history: `
    <div class="foundation-overview">
      <p class="foundation-title">TRES HITOS DE UN PROYECTO ABIERTO</p>
      <ol class="foundation-timeline" aria-label="Origen de Kubernetes">
        ${milestone('ORIGEN', 'Google', 'Experiencia con sistemas como Borg')}
        ${milestone('2014', 'Código abierto', 'Publicación de Kubernetes')}
        ${milestone('2015', 'CNCF', 'El proyecto se incorpora a la fundación')}
      </ol>
    </div>`,
};
