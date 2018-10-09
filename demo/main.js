import CannonML from "../src/CannonML.js"
const gl, cml;

window.onload = ()=>{
  gl = new WebGL(document.getElementById('container'));
  cml = new CannonML();
  
};

