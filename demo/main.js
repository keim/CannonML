var gl, cml, ctrl, enemyActor, playerActor, playerGeomBase, playerGeom;
class Control {
  constructor() {this._ = [];this.enabled=true;}
  onKeyDown(keyCode) { if (this.enabled) this._[keyCode] = true; }
  onKeyUp(keyCode)   { if (this.enabled) this._[keyCode] = false; }
  get dx() {return this._[37]?-1:this._[39]?1:0;}
  get dy() {return this._[40]?-1:this._[38]?1:0;}
  get shift() {return this._[16];}
  get ctrl() {return this._[17];}
  get Z() {return this._[90];}
  get X() {return this._[88];}
}

function runscript(e) {
  const seq = cml.sequence(document.getElementById('cmlscript').value);
  if (enemyActor) enemyActor.runner.destroy(0);
  enemyActor = new Actor(2, cml.runner(0,0,0, seq));
  return false;
}

function stopscript(e) {
  if (enemyActor) enemyActor.runner.destroy(0);
  return false;
}

var dv = new THREE.Vector3(0.125, 0.25, 0.5);

function playerMove() {
  const p = playerGeom.getAttribute("position");
  for (let i=0; i<playerGeomBase.length; i++) {
    const r = playerGeomBase[i];
    const v = r.p;
    p.array[i*3] = v.x;
    p.array[i*3+1] = v.y;
    p.array[i*3+2] = v.z;
  }
  p.needsUpdate = true;
  playerGeom.computeVertexNormals();

  playerActor.runner.setVelocity(ctrl.dx*5, ctrl.dy*5);
}


window.onload = ()=>{
  ctrl = new Control();
  cml = new CannonML();
  gl = new Ptolemy({width:480, height:480,
    onInitialize:()=>{
      const floor = new THREE.Mesh(new THREE.PlaneBufferGeometry(480, 480), new THREE.MeshLambertMaterial({color: 0xffffff}));
      floor.position.z = -10;
      floor.receiveShadow = true;
      gl.scene.add(floor);
    },
    onUpdate:dt=>{
      cml.update();
      playerMove();
    }
  });

  playerGeom = new THREE.IcosahedronBufferGeometry(20, 1);
  playerGeom.getAttribute("position").dynamic = true;
  playerGeom.getAttribute("normal").dynamic = true;

  Actor.scene = gl.scene;
  Actor.avatars = [
    {geometory:new THREE.ConeBufferGeometry(10, 20, 4), material:new THREE.MeshLambertMaterial({color: 0x8888cc, flatShading:true})},
    {geometory:playerGeom, material:new THREE.MeshLambertMaterial({color: 0xcc8888, flatShading:true})},
    {geometory:new THREE.TorusBufferGeometry(15, 5, 4, 8 ), material:new THREE.MeshLambertMaterial({color: 0xffffff})}
  ];
  const array = playerGeom.getAttribute("position").clone().array;
  playerGeomBase = [];
  for (let i=0; i<array.length; i+=3) {
    const p = new THREE.Vector3(array[i], array[i+1], array[i+2]),
          d = p.clone().normalize(), a = d.clone().max(d.negate()),
          s = (a.x>a.y)?((a.x>a.z)?a.x:a.z):((a.y>a.z)?a.y:a.z);
    playerGeomBase.push({p, d, s});
  } 

  playerActor = new Actor(1, cml.runner(0, -160, 0));
  playerActor.runner.scopeEnabled = false;
  cml.setDefaultTarget(playerActor.runner);
  cml.setScreenSize(400,400,0);

  document.getElementById('container').appendChild(gl.domElement);
  document.getElementById('cmlscript').value = "py100{i60vx-3~[vx0~vx6~vx0~vx-6~]}\n[w10[$x<0?bm2,5f2:bm3,50f10]]";
  document.getElementById('runscript').addEventListener('click', runscript);
  document.getElementById('stopscript').addEventListener('click', stopscript);

  document.getElementById('cmlscript').addEventListener('focus', e=>{ctrl.enabled=false});
  document.getElementById('cmlscript').addEventListener('focusout', e=>{ctrl.enabled=true});

  document.body.addEventListener('keydown', e=>{
    if (e.ctrlKey && e.key == 's') {
      e.preventDefault();
      return runscript();
    }
    ctrl.onKeyDown(e.keyCode);
  });
  document.body.addEventListener('keyup', e=>ctrl.onKeyUp(e.keyCode));

  gl.start();
};

