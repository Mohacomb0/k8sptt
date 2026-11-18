import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { createDevice } from '../scene/devices.js';
import { PACKET_COLORS } from '../scene/theme.js';

const node = (id, kind, label, detail, x, z) => ({ id, kind, label, detail, x, z });
const workers = [
  node('worker1', 'server', 'Worker 01', 'kubelet + runtime', -3.5, 3.2),
  node('worker2', 'server', 'Worker 02', 'kubelet + runtime', 5, 3.2),
];
const control = node('control', 'balancer', 'Control plane', 'API · scheduler · controllers', 1, -4.5);
const registry = node('registry', 'database', 'Registry', 'imágenes · tags · digests', -7.5, -4.5);
const service = node('service', 'balancer', 'Service', 'endpoints de pods Ready', 1, -1.5);

const TOPOLOGIES = {
  pipeline: {
    nodes: [
      node('git', 'browser', 'Git', 'código fuente', -9, -4.5),
      node('jenkins', 'server', 'Jenkins', 'test · build · deploy', -3.5, -4.5),
      node('registry', 'database', 'Registry', 'imágenes versionadas', 2, -4.5),
      node('control', 'balancer', 'API Kubernetes', 'estado deseado', 8, -4.5),
      ...workers,
    ],
    links: [
      ['git', 'jenkins'],
      ['jenkins', 'registry'],
      ['jenkins', 'control'],
      ['registry', 'worker1'],
      ['registry', 'worker2'],
      ['control', 'worker1'],
      ['control', 'worker2'],
    ],
  },
  cluster: {
    nodes: [registry, control, ...workers],
    links: [
      ['control', 'worker1'],
      ['control', 'worker2'],
      ['registry', 'worker1'],
      ['registry', 'worker2'],
    ],
  },
  traffic: {
    nodes: [
      node('browser', 'browser', 'Usuario', 'HTTPS', -8.5, -4.5),
      node('ingress', 'ingress', 'Ingress', 'controlador HTTP', -4, -4.5),
      service,
      ...workers,
    ],
    links: [
      ['browser', 'ingress'],
      ['ingress', 'service'],
      ['service', 'worker1'],
      ['service', 'worker2'],
    ],
  },
  observe: {
    nodes: [
      node('dashboard', 'browser', 'Dashboard', 'estado + eventos · API', -8, -5),
      node('prometheus', 'database', 'Prometheus', 'métricas', -2.5, -5),
      node('grafana', 'browser', 'Grafana', 'consulta fuentes', 3, -5),
      node('loki', 'database', 'Loki · opcional', 'logs vía recolector', 8.5, -5),
      ...workers,
    ],
    links: [
      ['worker1', 'prometheus'],
      ['worker2', 'prometheus'],
      ['prometheus', 'grafana'],
      ['loki', 'grafana'],
      ['worker1', 'loki'],
      ['worker2', 'loki'],
    ],
  },
};

const key = (a, b) => [a, b].sort().join('|');
const podColors = { ready: '#8dd8b1', starting: '#e5b967', error: '#f37f83', lost: '#f37f83' };
const podLabels = { ready: 'Ready', starting: 'Arrancando', error: 'Pull fallido', lost: 'No disponible' };

export class KubeView {
  constructor(manager) {
    this.manager = manager;
    this.root = new THREE.Group();
    this.podRoot = new THREE.Group();
    manager.scene.add(this.root, this.podRoot);
    // Navy instead of near-black: projectors render deep black as washed-out grey.
    manager.scene.background = new THREE.Color('#10203a');
    manager.scene.fog = new THREE.Fog('#10203a', 40, 90);
    manager.floor?.material.color.set('#1c3358');
    if (manager.grid) {
      manager.grid.material.transparent = true;
      manager.grid.material.opacity = 0.35;
    }
    this.devices = new Map();
    this.links = new Map();
    this.pods = [];
    this.activity = null;
    this.activityTime = 0;
    this.activityPaused = false;
    new ResizeObserver(() => this.#fitCamera()).observe(manager.container);
    manager.onUpdate((dt) => {
      for (const device of this.devices.values()) {
        if (!this.activityPaused) device.flash = Math.max(0, device.flash - dt * 2);
        const active = this.activity?.nodes.has(device.config.id);
        const pulse = active ? 0.5 + Math.sin(this.activityTime * 3) * 0.5 : 0;
        device.materials.accent.emissiveIntensity = 0.25 + device.flash + pulse * 0.4;
        device.materials.body.emissiveIntensity = active ? 0.12 + pulse * 0.1 : 0;
        device.halo.material.opacity = active ? 0.15 + pulse * 0.15 : 0;
        device.halo.scale.setScalar(1 + pulse * 0.15);
      }
      if (this.activity && !this.activityPaused) this.activityTime += dt;
      for (const { mesh, pod } of this.pods) {
        const active = this.activity?.nodes.has(pod.node) && pod.state !== 'lost';
        mesh.material.emissiveIntensity = active ? 0.25 + Math.sin(this.activityTime * 3) * 0.12 : 0.12;
      }
    });
  }

  setTopology(type) {
    const topology = TOPOLOGIES[type];
    if (!topology) throw new Error(`Topología desconocida: ${type}`);
    this.#clear(this.root);
    this.#clear(this.podRoot);
    this.devices.clear();
    this.links.clear();
    this.pods = [];
    this.activity = null;
    for (const config of topology.nodes) this.#device(config);
    for (const [a, b] of topology.links) this.#link(a, b);
    this.#fitCamera();
  }

  #fitCamera() {
    const { camera } = this.manager;
    const distance = THREE.MathUtils.clamp(
      11.25 / (Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect),
      12,
      45,
    );
    this.manager.focusOn(new THREE.Vector3(0, 0, -0.5), distance);
  }

  #label(title, detail, className = 'kube-label') {
    const element = document.createElement('div');
    element.className = className;
    const heading = document.createElement('strong');
    heading.textContent = title;
    const subtitle = document.createElement('span');
    subtitle.textContent = detail;
    element.append(heading, subtitle);
    return new CSS2DObject(element);
  }

  #device(config) {
    const { id, kind, label, detail, x, z } = config;
    const device = createDevice(kind);
    device.materials.dark.color.set('#283340');
    device.materials.body.roughness = 0.7;
    device.materials.body.metalness = 0.15;
    const worker = id.startsWith('worker');
    if (worker) {
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(6.6, 0.12, 4.8),
        new THREE.MeshStandardMaterial({ color: '#243a43', transparent: true, opacity: 0.6, roughness: 0.8 }),
      );
      base.position.set(x, 0.05, z + 0.5);
      this.root.add(base);
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(base.geometry),
        new THREE.LineBasicMaterial({ color: '#4d8c86', transparent: true, opacity: 0.6 }),
      );
      edges.position.copy(base.position);
      this.root.add(edges);
    }
    device.group.position.set(x, 0.14, z - (worker ? 0.9 : 0));
    this.root.add(device.group);
    const tag = this.#label(label, detail);
    tag.position.set(x, device.height + 0.7, z - (worker ? 0.9 : 0));
    const halo = new THREE.Mesh(
      new THREE.RingGeometry(1.05, 1.24, 48),
      new THREE.MeshBasicMaterial({ color: '#9ce5c5', transparent: true, opacity: 0, depthWrite: false }),
    );
    halo.rotation.x = -Math.PI / 2;
    halo.position.copy(device.group.position).setY(0.14);
    this.root.add(tag, halo);
    this.devices.set(id, { ...device, config, tag, halo, flash: 0 });
  }

  #link(a, b) {
    const port = (id) => {
      const device = this.devices.get(id);
      return device.group.position.clone().add(new THREE.Vector3(0, device.port, 0));
    };
    const start = port(a);
    const end = port(b);
    const middle = start.clone().lerp(end, 0.5);
    middle.y += Math.min(2.5, start.distanceTo(end) * 0.16);
    const curve = new THREE.QuadraticBezierCurve3(start, middle, end);
    const line = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 40, 0.025, 5, false),
      new THREE.MeshStandardMaterial({ color: '#7f9fbd', transparent: true, opacity: 0.55 }),
    );
    this.root.add(line);
    this.links.set(key(a, b), { a, curve, material: line.material });
  }

  pathBetween(from, to) {
    const link = this.links.get(key(from, to));
    return link ? { curve: link.curve, reversed: link.a !== from } : null;
  }

  flash(id) {
    const device = this.devices.get(id);
    if (device) device.flash = 1;
  }

  setFrame(frame) {
    this.clearActivity();
    this.#clear(this.podRoot);
    this.pods = [];
    for (const [id, device] of this.devices) {
      const down = id === frame.down;
      device.materials.body.color.set(down ? '#653a43' : '#536476');
      device.led.material.color.set(down ? '#f37f83' : '#8dd8b1');
      device.tag.element.classList.toggle('is-down', down);
    }
    const positions = new Map();
    for (const pod of frame.pods) {
      const device = this.devices.get(pod.node);
      if (!device) throw new Error(`Nodo no disponible en el diagrama: ${pod.node}`);
      const index = positions.get(pod.node) ?? 0;
      positions.set(pod.node, index + 1);
      const x = device.config.x - 1.3 + index * 2.5;
      const z = device.config.z + 1.6;
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(1.35, 0.85, 1.1),
        new THREE.MeshStandardMaterial({
          color: podColors[pod.state],
          emissive: podColors[pod.state],
          emissiveIntensity: 0.12,
          roughness: 0.45,
          transparent: pod.state === 'lost',
          opacity: pod.state === 'lost' ? 0.3 : 1,
        }),
      );
      box.position.set(x, 0.6, z);
      box.castShadow = true;
      const tag = this.#label(pod.label, podLabels[pod.state], `pod-label pod-label--${pod.state}`);
      tag.position.set(x, 1.45, z);
      this.podRoot.add(box, tag);
      this.pods.push({ mesh: box, tag, pod });
    }
  }

  setActivity(plan) {
    this.clearActivity();
    const nodes = new Set(plan.focus);
    const links = new Map();
    for (const hop of plan.tracks.flat()) {
      if (!this.pathBetween(hop.from, hop.to)) throw new Error(`Conexión no disponible: ${hop.from} → ${hop.to}`);
      nodes.add(hop.from);
      nodes.add(hop.to);
      const id = key(hop.from, hop.to);
      if (!links.has(id)) links.set(id, PACKET_COLORS[hop.kind]);
    }
    this.activity = { nodes };
    const color = PACKET_COLORS[plan.tone];
    for (const [id, device] of this.devices) {
      const active = nodes.has(id);
      device.tag.element.classList.toggle('is-active', active);
      device.halo.material.color.set(color);
      device.materials.body.emissive.set(color);
    }
    for (const [id, link] of this.links) {
      const active = links.has(id);
      link.material.color.set(active ? links.get(id) : '#7f9fbd');
      link.material.emissive.set(active ? links.get(id) : '#000000');
      link.material.emissiveIntensity = active ? 0.4 : 0;
      link.material.opacity = active ? 0.9 : 0.2;
    }
    for (const { tag, pod } of this.pods)
      tag.element.classList.toggle('is-active', nodes.has(pod.node) && pod.state !== 'lost');
  }

  setActivityPaused(paused) {
    this.activityPaused = paused;
  }

  clearActivity() {
    this.activity = null;
    this.activityTime = 0;
    this.activityPaused = false;
    for (const device of this.devices.values()) {
      device.tag.element.classList.remove('is-active');
      device.halo.material.opacity = 0;
      device.materials.body.emissiveIntensity = 0;
      device.materials.accent.emissiveIntensity = 0.25;
      device.flash = 0;
    }
    for (const link of this.links.values()) {
      link.material.color.set('#7f9fbd');
      link.material.emissiveIntensity = 0;
      link.material.opacity = 0.55;
    }
    for (const { tag, mesh } of this.pods) {
      tag.element.classList.remove('is-active');
      mesh.material.emissiveIntensity = 0.12;
    }
  }

  #clear(group) {
    const geometries = new Set();
    const materials = new Set();
    group.traverse((object) => {
      object.element?.remove();
      if (object.geometry) geometries.add(object.geometry);
      const list = Array.isArray(object.material) ? object.material : [object.material];
      list.filter(Boolean).forEach((material) => materials.add(material));
    });
    group.clear();
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
  }
}
