//Required vars
var numTimesToSubdivide = 3;

var index = 0;

var pointsArray = [];
var normalsArray = [];


var near = -10;
var far = 10;
var radius = 1.5;
var theta  = 0.0;
var phi    = 0.0;
var dr = 5.0 * Math.PI/180.0;

var left = -3.0;
var right = 3.0;
var ytop =3.0;
var bottom = -3.0;

var va = vec4(0.0, 0.0, -1.0,1);
var vb = vec4(0.0, 0.942809, 0.333333, 1);
var vc = vec4(-0.816497, -0.471405, 0.333333, 1);
var vd = vec4(0.816497, -0.471405, 0.333333,1);

var lightPosition = vec4(1.0, 1.0, 1.0, 0.0 );
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 1.0, 0.0, 1.0, 1.0 );
var materialDiffuse = vec4( 1.0, 0.8, 0.0, 1.0 );
var materialSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );
var materialShininess = 20.0;

var ctm;
var ambientColor, diffuseColor, specularColor;

var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;

var normalMatrix, normalMatrixLoc;

var eye;
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

var gl;
var program;
window.onload = function init()
{
    var canvas = document.getElementById( "gl-canvas" );

    //Needed to keep the draw buffer so our onclick works
    //Otherwise it was returning all 0's for the color
    var ctx = canvas.getContext("experimental-webgl", {preserveDrawingBuffer: true});

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    createObjs();

    //Handles the button clicks on the HTML page
    document.getElementById( "Stop" ).onclick = function () {
        for(var i=0;i<3;i++){
        	objs[i].rotate[1] = 0.0;
        }
    };

    document.getElementById( "Start" ).onclick = function () {
        for(var i=0;i<3;i++){
        	objs[i].rotate[1] = objs[i].rotate[1]!=0.0?0.0:2.0;
        }
    };

    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    gl.enable(gl.DEPTH_TEST);

    //  Load shaders and initialize attribute buffers
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );
    normalMatrixLoc = gl.getUniformLocation( program, "normalMatrix" );
    var ambientProduct = mult(lightAmbient, materialAmbient);
    var diffuseProduct = mult(lightDiffuse, materialDiffuse);
    var specularProduct = mult(lightSpecular, materialSpecular);
    gl.uniform4fv( gl.getUniformLocation(program,
       "ambientProduct"),flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
       "diffuseProduct"),flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
       "specularProduct"),flatten(specularProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
       "lightPosition"),flatten(lightPosition) );
    gl.uniform1f( gl.getUniformLocation(program,
       "shininess"),materialShininess );

    render();

    //Handles the onclick function
    //We changed the opaqueness for each object to determine what we clicked on
    //Cube color[3] is 254
    //Pyramid is 253
    //Sphere is 252
    canvas.addEventListener("mousedown", function(event) {
      var x = event.clientX;
      var y = canvas.height - event.clientY;
      const pixel = new Uint8Array(4);
      gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);

      if(pixel[3]<255&&pixel[3]>251){
    	  var idx=254-pixel[3];
    	  objs[idx].rotate[1] = objs[idx].rotate[1]!=0.0?0.0:2.0;
      }
    });
}
function render() {
	  gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

	  ////////////////////////
	  //      Draw Loop     //
	  ////////////////////////

    eye = vec3(radius*Math.sin(theta)*Math.cos(phi),
        radius*Math.sin(theta)*Math.sin(phi), radius*Math.cos(theta));
    modelViewMatrix = lookAt(eye, at , up);
    projectionMatrix = ortho(left, right, bottom, ytop, near, far);

    // normal matrix only really need if there is nonuniform scaling
    // it's here for generality but since there is
    // no scaling in this example we could just use modelView matrix in shaders

    normalMatrix = [
        vec3(modelViewMatrix[0][0], modelViewMatrix[0][1], modelViewMatrix[0][2]),
        vec3(modelViewMatrix[1][0], modelViewMatrix[1][1], modelViewMatrix[1][2]),
        vec3(modelViewMatrix[2][0], modelViewMatrix[2][1], modelViewMatrix[2][2])
    ];
	  for(i=0;i<objs.length;i++){
	  gl.bindBuffer( gl.ARRAY_BUFFER, objs[i].colorBuffer );
	  /*//vColor
	  var vColor = gl.getAttribLocation( program, "vColor" );
	  gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
	  gl.enableVertexAttribArray( vColor );*/

	  //Vertex buffer
	  gl.bindBuffer( gl.ARRAY_BUFFER, objs[i].pointsBuffer );
	  objs[i].vPosition = gl.getAttribLocation( program, "vPosition" );
	  gl.vertexAttribPointer( objs[i].vPosition, 4, gl.FLOAT, false, 0, 0 );
	  gl.enableVertexAttribArray( objs[i].vPosition );

	  //Get Theta and set to thetaLoc
	  objs[i].thetaLoc = gl.getUniformLocation(program, "theta");

	  //Rotate if rotate[0] is true
	  //Use %360 to reset the variable so it doesn't go out of bounds
	  objs[i].thetaVal[1] = (objs[i].thetaVal[1]+objs[i].rotate[1])%360;

	  //Set theta to shape's theta
	  gl.uniform3fv(objs[i].thetaLoc, objs[i].thetaVal);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix) );
    gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normalMatrix) );
	  //Draw pyramid
	  gl.drawArrays( gl.TRIANGLES, 0, objs[i].points);
	  }

	  //Call render again to make it animated
	  window.requestAnimFrame(render);
	}
