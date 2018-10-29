var gl, cml, enemyActor;

function runscript() {
  const seq = cml.sequence(document.getElementById('cmlscript').value);
  if (enemyActor) enemyActor.runner.destroy(0);
  enemyActor = new Actor(1, cml.runner(0,0,0, seq));
  return false;
}

window.onload = ()=>{
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
    }
  });

  Actor.scene = gl.scene;
  Actor.avatars = [
    {geometory:new THREE.ConeBufferGeometry(10, 20, 4), material:new THREE.MeshLambertMaterial({color: 0x8888cc, flatShading:true})},
    {geometory:new THREE.TorusBufferGeometry(15, 5, 4, 8 ), material:new THREE.MeshLambertMaterial({color: 0xffffff})}
  ];

  const target = new Actor(1, cml.runner(0, -160, 0));
  cml.setDefaultTarget(target.runner);
  cml.setScreenSize(400,400,0);

  document.getElementById('container').appendChild(gl.domElement);
  document.getElementById('cmlscript').value = "py100{i60vx-3~[vx0~vx6~vx0~vx-6~]}\n[w10[?$x<0bm2,5f2:bm3,50f10]]";
  document.getElementById('runscript').addEventListener('click', e=>{
    return runscript();
  });
  document.getElementById('cmlscript').addEventListener('keydown', e=>{
    if (e.ctrlKey && e.key == 's') {
      e.preventDefault();

      return runscript();
    }
    return true;
  });
  gl.start();
};

