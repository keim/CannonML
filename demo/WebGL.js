class WebGL {
  constructor(width, height) {
    // member valiables
    this.paused = false;
    this.prevtime = 0;
    
    // create basic instance
    this.camera   = new THREE.PerspectiveCamera(30, 1, 0.1, 10000);
    this.scene    = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer();

    // other
    this.screenCenter = new THREE.Vector3();
    this.cameraDistance = 0;

    // start
    this.setSize(width, height);
    this.prevtime = performance.now();
    this.setup();
    this._loop();
  }

  get domElement() {
    return this.renderer.domElement;
  }

  _loop() {
    const now = performance.now();
    if (!this.paused) this.draw((now - this.prevtime) / 1000);
    this.prevtime = now;
    this.renderer.setAnimationLoop(this._loop.bind(this));
  }

  setSize(width, height) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  getSize() { return this.renderer.getSize(); }

  setup() {
    this.renderer.gammaOutput = true;
    this.renderer.physicallyCorrectLights = true;
    this.renderer.sortObjects = false;
    this.renderer.shadowMap.enabled = false;

    this.cameraDistance = this.renderer.getSize().height * 0.5 / Math.tan(this.camera.fov * 0.5 * Math.PI / 180);

    this.light = new THREE.DirectionalLight( 0xffffff, 0.5 );
    this.scene.add(this.light);
    this.scene.add(this.light.target);

    const geom = new THREE.BoxBufferGeometry(10, 10, 10);
    const mat  = new THREE.MeshStandardMaterial({color:0xffff00});
    const mesh = new THREE.Mesh(geom, mat);

    this.scene.add(this.camera);
    this.scene.add(mesh);

    this.camera.position.set(0, 0, -this.cameraDistance);
    this.camera.lookAt(this.screenCenter);

    this.light.position.set(0, 0, -1);
  }

  draw(deltaTime) {
    this.renderer.render(this.scene, this.camera);
  }
}


