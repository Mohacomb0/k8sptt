export class MotionPlayer {
  constructor({ animator, getPlan, onPlan, onChange, onError }) {
    this.animator = animator;
    this.getPlan = getPlan;
    this.onPlan = onPlan;
    this.onChange = onChange;
    this.onError = onError;
    this.state = 'idle';
    this.cycles = 0;
    this.speed = 1;
    this.generation = 0;
  }

  start({ repeat = true } = {}) {
    this.stop();
    this.state = 'playing';
    this.animator.speed = this.speed;
    this.onChange(this);
    this.#run(this.generation, repeat);
  }

  pause() {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    this.animator.speed = 0;
    this.onChange(this);
  }

  resume() {
    if (this.state !== 'paused') return;
    this.state = 'playing';
    this.animator.speed = this.speed;
    this.onChange(this);
  }

  stop() {
    this.generation++;
    this.animator.cancel();
    this.animator.speed = this.speed;
    this.state = 'idle';
    this.cycles = 0;
    this.onChange(this);
  }

  setSpeed(speed) {
    if (speed !== 1 && speed !== 2) throw new Error(`Velocidad no admitida: ${speed}`);
    this.speed = speed;
    this.animator.speed = this.state === 'paused' ? 0 : speed;
    this.onChange(this);
  }

  async #run(generation, repeat) {
    try {
      while (this.generation === generation) {
        const plan = this.getPlan(this.cycles);
        this.onPlan(plan);
        const completed = plan.tracks.length ? await this.animator.play(plan.tracks) : await this.animator.wait(1.2);
        if (this.generation !== generation) return;
        if (!completed) throw new Error('El recorrido contiene una conexión que no se puede reproducir.');
        this.cycles++;
        if (!repeat) {
          this.state = 'idle';
          this.onChange(this);
          return;
        }
        this.onChange(this);
        if (!(await this.animator.wait(0.7))) return;
      }
    } catch (error) {
      if (this.generation === generation) this.stop();
      this.onError(error);
    }
  }
}
