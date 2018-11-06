var cml, ctrl, enemyActor, playerActor, playerGeomBase, playerGeom;

class Control {
  constructor() {this._ = [];this.enabled=true;this.isPlaying=false;}
  onKeyDown(keyCode) { if (this.enabled) this._[keyCode] = true; }
  onKeyUp(keyCode)   { if (this.enabled) this._[keyCode] = false; }
  get dx() {return this._[37]?-1:this._[39]?1:0;}
  get dy() {return this._[40]?-1:this._[38]?1:0;}
  get shift() {return this._[16];}
  get ctrl() {return this._[17];}
  get Z() {return this._[90];}
  get X() {return this._[88];}
  runscript() {
    if (this.isPlaying) {
      if (enemyActor) enemyActor.runner.destroy(0);
    } else {
      const seq = cml.sequence(editor.getValue());
      if (enemyActor) enemyActor.runner.destroy(0);
      enemyActor = new Actor(2, cml.runner(0,0,0, seq));
    }
    this.isPlaying = !this.isPlaying;
    return false;
  }
}


new Ptolemy({
  width:480, 
  height:480,
  containerid:'screen',
  setup:gl=>{
    ctrl = new Control();
    cml = new CannonML();

    const floor = new THREE.Mesh(new THREE.PlaneBufferGeometry(480, 480), new THREE.MeshLambertMaterial({color: 0xffffff}));
    floor.position.z = -10;
    floor.receiveShadow = true;
    gl.scene.add(floor);


    playerGeom = new THREE.IcosahedronBufferGeometry(20, 1);
    playerGeom.getAttribute("position").dynamic = true;
    playerGeom.getAttribute("normal").dynamic = true;
    const array = playerGeom.getAttribute("position").clone().array;
    playerGeomBase = [];
    for (let i=0; i<array.length; i+=3) {
      playerGeomBase.push(new THREE.Vector3(array[i], array[i+1], array[i+2]));
    } 

    Actor.scene = gl.scene;
    Actor.avatars = [
      {geometory:new THREE.ConeBufferGeometry(10, 20, 4), material:new THREE.MeshLambertMaterial({color: 0x8888cc, flatShading:true})},
      {geometory:playerGeom, material:new THREE.MeshLambertMaterial({color: 0xcc8888, flatShading:true})},
      {geometory:new THREE.TorusBufferGeometry(15, 5, 4, 8 ), material:new THREE.MeshLambertMaterial({color: 0xffffff})}
    ];
    playerActor = new Actor(1, cml.runner(0, -160, 0));
    playerActor.runner.scopeEnabled = false;
    cml.setDefaultTarget(playerActor.runner);
    cml.setScreenSize(400,400,0);

    editor = ace.edit("editor");
    editor.setValue("#move{py100{i60~px150i120[~px-150~px150]}}\n&move\n\n[w30[$x>0?bm1,1f10:bm7,120f5]]");
    editor.commands.addCommand({
      name : "play",
      bindKey: {win:"Ctrl-Enter", mac:"Command-Enter"},
      exec: ctrl.runscript.bind(ctrl)
    });
    editor.on('blur', ()=>ctrl.enabled=true);
    editor.on('focus',()=>ctrl.enabled=false);
    document.getElementById('runscript').addEventListener('click', ctrl.runscript.bind(ctrl));
    document.body.addEventListener('keydown', e=>ctrl.onKeyDown(e.keyCode));
    document.body.addEventListener('keyup',   e=>ctrl.onKeyUp(e.keyCode));
  },
  draw:gl=>{
    cml.update();
    playerActor.runner.setVelocity(ctrl.dx*5, ctrl.dy*5);
  
    const p = playerGeom.getAttribute("position");
    for (let i=0; i<playerGeomBase.length; i++) {
      const v = playerGeomBase[i].clone().multiplyScalar(1);
      p.array[i*3] = v.x;
      p.array[i*3+1] = v.y;
      p.array[i*3+2] = v.z;
    }
    p.needsUpdate = true;
    playerGeom.computeVertexNormals();
  }
});

