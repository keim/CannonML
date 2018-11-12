class Actor {
  constructor(avatarid, runner) {
    const avator = Actor.avatars[avatarid];
    this.mesh = new THREE.Mesh(avator.geometory, avator.material);
    this.mesh.rotation.reorder("ZYX");
    this.mesh.castShadow = true;
    this.runner = runner;
    Actor.scene.add(this.mesh);
    
    this.onCreateNewRunner = this.onCreateNewRunner.bind(this);
    this.onDestroy = this.onDestroy.bind(this);
    this.onUpdate = this.onUpdate.bind(this);
    runner.setCallbackFunctions(this);
  }

  onCreateNewRunner(runner) {
    const avatarid = runner.sequence && runner.sequence.getParameter(0) || 0;
    new Actor(avatarid, runner);
  }

  onDestroy() {
    Actor.scene.remove(this.mesh);
  }

  onUpdate() {
    this.mesh.position.copy(this.runner.pos); 
    this.mesh.rotation.x = this.runner.euler.x;
    this.mesh.rotation.y = this.runner.euler.y;
    this.mesh.rotation.z = this.runner.euler.z - Math.PI/2;
  }
}


Actor.avatars = [];
Actor.scene = null;
