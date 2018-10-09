class WebGL {
  constructor(container) {
    // member valiables
    this.paused = false;
    this.prevtime = 0;
    
    // create basic instance
    this.camera   = new THREE.PerspectiveCamera( 30, window.innerWidth / window.innerHeight, 1, 10000 );
    this.scene    = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer();

    // dom and event
    container.appendChild(this.renderer.domElement);
    container.addEventListener('mousemove', e=>{
      //this.uniforms.mouse.value.x = e.clientX / this.renderer.domElement.width;
      //this.uniforms.mouse.value.y = 1-e.clientY / this.renderer.domElement.height;
    });
    window.addEventListener('resize', e=>this.adjustScreen());

    // start
    this.adjustScreen();
    this.prevtime = performance.now();
    this.init();
    this._loop();
  }

  _loop() {
    const now = performance.now();
    if (!this.paused) this.update((now - this.prevtime) / 1000);
    this.prevtime = now;
    requestAnimationFrame(this._loop.bind(this));
  }

  adjustScreen() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    //this.uniforms.resolution.value.x = this.renderer.domElement.width;
    //this.uniforms.resolution.value.y = this.renderer.domElement.height;
  }

  init() {

  }

  update(deltaTime) {
    this.renderer.render(this.scene, this.camera);
  }
}


