var gl, cml;

window.onload = ()=>{
  cml = new CannonML();
  gl = new Ptolemy({width:480, height:480,
    onUpdate:dt=>{
      cml.update();
    }
  });

  Actor.scene = gl.scene;
  Actor.avatars = [
    {geometory:new THREE.TorusBufferGeometry(6, 3, 4, 8 ), material:new THREE.MeshPhongMaterial( {color: 0xffffff} )}
  ];

  const target = new Actor(0, cml.runner(0, -100, 0));
  cml.setDefaultTarget(target);

  const seq = cml.sequence("v1,0ht30f2");
  new Actor(0, cml.runner(0,0,0, seq));

  document.getElementById('container').appendChild(gl.domElement);
};

