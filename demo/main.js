var gl, cml;

window.onload = ()=>{
  gl = new WebGL(480, 320);
  cml = new CannonML();
  document.getElementById('container').appendChild(gl.domElement);
  //window.addEventListener('resize', e=>gl.adjustScreen());
};

