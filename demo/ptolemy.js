class Ptolemy {
  constructor(option) {
    option = option || {};
    // member valiables
    this.paused = false;
    this.prevtime = 0;
    
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
    this.prevtime = performance.now();
    this.setup();
    this._loop();
  }

  _loop() {
    const now = performance.now();
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

    this.light = new THREE.SpotLight( 0xffffff, 1, 1000, Math.PI/3, 0.3, 2);
    this.light.castShadow = true; 
//    this.light.shadow.camera.near = this.light.shadow.camera.left  = this.light.shadow.camera.bottom = -240;
//    this.light.shadow.camera.far  = this.light.shadow.camera.right = this.light.shadow.camera.top = 240;

    this.light.shadow.camera.near = 200;
    this.light.shadow.camera.far = 400;
    this.light.shadow.camera.updateProjectionMatrix();
    this.light.position.set(0, 300, 300);
    this.light.target.position.set(0,0,0);
    this.scene.add(this.light);
    this.amb = new THREE.AmbientLight( 0xffffff, 0.3 );
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


