class Actor {
  constructor(avatarid, runner) {
    const avator = Actor.avatars[avatarid];
    this.mesh = new THREE.Mesh(avator.geometory, avator.material);
    this.runner = runner;
    console.log(runner);
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
    this.mesh.position.x = this.runner.x; 
    this.mesh.position.y = this.runner.y; 
    this.mesh.position.z = this.runner.z;
    this.mesh.rotation.x = this.runner.bank;
    this.mesh.rotation.y = this.runner.pitch;
    this.mesh.rotation.z = this.runner.angleOnStage;
  }
}


Actor.avatars = [];
Actor.scene = null;