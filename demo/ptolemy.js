class Ptolemy {
  constructor(option) {
    option = option || {};
    // member valiables
    this.paused = false;
    this.prevtime = 0;
    this.starttime = 0;
    this.time = 0;
    
    // create basic instance
    this.camera   = new THREE.PerspectiveCamera(30, 1, 0.1, 10000);
    this.scene    = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer();

    // other
    this.screenCenter = new THREE.Vector3(0,0,0);

    // start
    this.setSize(option.width || window.innerWidth, option.height || window.innerHeight);
    this.onUpdate = option.onUpdate;
    this.onInitialize = option.onInitialize;
  }

  get domElement() { return this.renderer.domElement; }

  get cameraDistance() { return this.renderer.getSize().height * 0.5 / Math.tan(this.camera.fov * 0.008726646259971648); } 

  start() {
    this.starttime = this.prevtime = performance.now();
    this.setup();
    this._loop();
  }

  _loop() {
    const now = performance.now();
    this.time = (now - this.starttime) / 1000;
    if (!this.paused) this.draw((now - this.prevtime) / 1000);
    this.prevtime = now;
    requestAnimationFrame(this._loop.bind(this));
  }

  setSize(width, height) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  setup() {
    this.renderer.gammaOutput = true;
    this.renderer.physicallyCorrectLights = true;
    this.renderer.shadowMap.enabled = true;

    this.light = new THREE.PointLight( 0xffffff, 0.7, 700);
    this.light.castShadow = true; 
    this.light.shadow.camera.near = 150;
    this.light.shadow.camera.far = 700;
    this.light.shadow.camera.updateProjectionMatrix();
    this.light.position.set(0, 200, 200);
    this.scene.add(this.light);
    this.amb = new THREE.AmbientLight( 0xffffff, 0.7 );
    this.scene.add(this.amb);
    this.scene.add(this.camera);
    this.camera.position.set(0, 0, this.cameraDistance);
    this.camera.lookAt(this.screenCenter);

    if (this.onInitialize) this.onInitialize();
  }

  draw(deltaTime) {
    if (this.onUpdate) this.onUpdate(deltaTime);
    this.renderer.render(this.scene, this.camera);
  }
}


