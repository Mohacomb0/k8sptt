# k8sptt · Del código al clúster

Presentación interactiva de la **Unitat de Recursos d’Informàtica de Gestió GrupMed** para desarrollo, sistemas y responsables.

**Web:** https://mohacomb0.github.io/k8sptt/

## Contenido

23 diapositivas en español para explicar el recorrido **Git → Jenkins → registry → Kubernetes → observabilidad**, con cinco casos guiados:

- Construcción, publicación y despliegue de una versión.
- Tráfico de una aplicación: Ingress, Service y pods Ready.
- Actualización progresiva con RollingUpdate.
- Pérdida de un nodo y recuperación de réplicas.
- Imagen inaccesible y diagnóstico de ImagePullBackOff.

Los diagramas 3D muestran tráfico, actividad y estados de pods. El contenido distingue métricas con Prometheus, visualización con Grafana y logs centralizados con un backend como Loki.

La base de la sesión es `intro_nodos_kubernetes_grupmed.pdf`. **Esta versión pública no incluye el PDF, nombres de máquinas, versiones ni cifras del inventario interno.** No se conecta a Jenkins, al clúster ni a las herramientas de observabilidad. Las URLs, accesos, namespaces, fuentes y procedimientos reales deben confirmarse con sistemas.

## Uso local

Requiere Node.js 20.19+ o 22.12+; GitHub Actions utiliza Node.js 22.

```bash
npm ci
npm run dev
```

Abrir http://localhost:5192/.

## Presentar

| Control                  | Acción                                                                                              |
| ------------------------ | --------------------------------------------------------------------------------------------------- |
| ← / →                    | Cambiar de diapositiva                                                                              |
| Inicio / Fin             | Ir a la primera o última diapositiva                                                                |
| I                        | Abrir el índice                                                                                     |
| F                        | Pantalla completa                                                                                   |
| N                        | Mostrar/ocultar notas sobre la diapositiva; son visibles para el público                            |
| Vista ponente            | Abrir una ventana separada con notas sincronizadas, siguiente diapositiva y temporizador            |
| Espacio / Siguiente paso | Avanzar la demo sin cambiar de diapositiva                                                          |
| Iniciar movimiento       | Reproducir el flujo visual; se puede pausar, reanudar, ejecutar un recorrido o cambiar la velocidad |

Para proyectar, usa el escritorio extendido y deja la **Vista ponente** en tu pantalla. Las diapositivas admiten enlaces directos como `#pipeline`, `#trafico` o `#nodo-caido`.

El movimiento no avanza los pasos ni modifica sus estados. Solo los pods Ready reciben tráfico, y los nodos caídos quedan excluidos. Se detiene al cambiar de diapositiva o paso y se pausa al abrir el índice o dejar la pestaña en segundo plano. Respeta la preferencia del sistema de movimiento reducido.

## Publicar mejoras

Trabaja en la copia pública `k8sptt`, cuyo `origin` es `https://github.com/Mohacomb0/k8sptt.git`. Cada push a `main` ejecuta **Deploy**: comprueba la configuración de Pages, formato, lint, tests y build, y publica únicamente `dist/`. Si falla una comprobación, no se publica esa versión.

```bash
git add <archivos-revisados>
git commit -m "Describe la mejora"
git push origin main
```

En **Settings → Pages → Build and deployment**, la fuente debe ser **GitHub Actions**. Consulta el resultado en **Actions → Deploy**, donde también puede lanzarse con **Run workflow**. Mantén fuera el PDF y los datos del inventario interno.

## Desarrollo

JavaScript con módulos ES, Three.js y Vite, sin framework.

```text
index.html               Presentación pública
presenter.html           Vista del ponente
src/presentation/        Diapositivas, casos Kubernetes, navegación y movimiento
src/scene/               Motor 3D, modelos reutilizados y animador de paquetes
tests/                   Pruebas de navegación, escenarios y movimiento
```

| Comando                | Propósito                              |
| ---------------------- | -------------------------------------- |
| `npm test`             | Pruebas de la presentación y sus casos |
| `npm run lint`         | ESLint                                 |
| `npm run format:check` | Comprobar formato                      |
| `npm run build`        | Generar la web en `dist/`              |
| `npm run preview`      | Revisar el build localmente            |

## Atribución y licencia

Los modelos low-poly, el motor de escena y el animador de paquetes se adaptan de [Request Journey 3D](https://github.com/arnaucanet/request-journey), de arnaucanet. Se reutiliza su base visual, no su aplicación ni sus escenarios originales.

Se conserva la [licencia MIT y su atribución](LICENSE).
