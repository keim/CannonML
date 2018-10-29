var gl, cml;

window.onload = ()=>{
  cml = new CannonML();
  gl = new Ptolemy({width:480, height:480,
    onInitialize:()=>{
      const floor = new THREE.Mesh(new THREE.PlaneBufferGeometry(480, 480), new THREE.MeshLambertMaterial({color: 0xffffff}));
      floor.position.z = -20;
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

  const seq = cml.sequence("{i30[v0,3~v3,0~v0,-3~v-3,0~]}bm9,120,0,5[w50f3]");
  new Actor(1, cml.runner(0,0,0, seq));

  document.getElementById('container').appendChild(gl.domElement);

  gl.start();
};

