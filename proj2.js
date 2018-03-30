//Required vars
var gl;
var program;

var near = -4;
var far = 4;

var left = -2.0;
var right = 2.0;
var ytop = 2.0;
var bottom = -2.0;

var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;

var fColor;

var eye, at, up;
var light;

var m;

window.onload = function init()
{
    var canvas = document.getElementById( "gl-canvas" );

    //Needed to keep the draw buffer so our onclick works
    //Otherwise it was returning all 0's for the color
    var ctx = canvas.getContext("experimental-webgl", {preserveDrawingBuffer: true});

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    gl.enable(gl.DEPTH_TEST);

    light = lightSource.position;

    m = mat4();
    m[3][3] = 0;
    m[3][1] = -.5/light[1];

    at = vec3(0.0, 0.0, 0.0);
    up = vec3(0.0, 1.0, 0.0);
    eye = vec3(0.0, 1.0, 1.0);

    var len=createObjs();
    //console.log(len);
    var tmpColor=[];
    for(var i=0;i<len;i++){
    	tmpColor.push(vec4( 0.0, 0.0, 0.0,1.0));
    }
    fColor = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, fColor );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(tmpColor), gl.STATIC_DRAW );

    //  Load shaders and initialize attribute buffers
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );

    projectionMatrix = ortho(left, right, bottom, ytop, near, far);
    gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(projectionMatrix) );

    render();
}

function render() {
  gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

  ////////////////////////
  //      Draw Loop     //
  ////////////////////////
  for(i = 0; i < 3; i++) {
    modelViewMatrix = lookAt(eye, at, up);
    gl.bindBuffer( gl.ARRAY_BUFFER, objs[i].normalsBuffer );
	  var vNormal = gl.getAttribLocation( program, "vNormal" );
	  gl.vertexAttribPointer( vNormal, 3, gl.FLOAT, false, 0, 0 );
	  gl.enableVertexAttribArray( vNormal );

//	  gl.bindBuffer( gl.ARRAY_BUFFER, objs[i].colorBuffer );
	  //vColor
//	  var vColor = gl.getAttribLocation( program, "vColor" );
//	  gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
//	  gl.enableVertexAttribArray( vColor );

	  //Vertex buffer
	  gl.bindBuffer( gl.ARRAY_BUFFER, objs[i].pointsBuffer );
	  objs[i].vPosition = gl.getAttribLocation( program, "vPosition" );
	  gl.vertexAttribPointer( objs[i].vPosition, 4, gl.FLOAT, false, 0, 0 );
	  gl.enableVertexAttribArray( objs[i].vPosition );

	  // //Get Theta and set to thetaLoc
	  // objs[i].thetaLoc = gl.getUniformLocation(program, "theta");
    //
	  // //Rotate if rotate[0] is true
	  // //Use %360 to reset the variable so it doesn't go out of bounds
	  // objs[i].thetaVal[1] = (objs[i].thetaVal[1]+objs[i].rotate[1])%360;
    //
	  // //Set theta to shape's theta
	  // gl.uniform3fv(objs[i].thetaLoc, objs[i].thetaVal);

	modelViewMatrix = mult(modelViewMatrix, translate(objs[i].position[3], objs[i].position[4], objs[i].position[5]));

    modelViewMatrix = mult(modelViewMatrix, rotateX(objs[i].position[0]));
    modelViewMatrix = mult(modelViewMatrix, rotateY(objs[i].position[1]));
    modelViewMatrix = mult(modelViewMatrix, rotateZ(objs[i].position[2]));

    modelViewMatrix = mult(modelViewMatrix, scalem(objs[i].position[6], objs[i].position[7], objs[i].position[8]));

    gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten(modelViewMatrix) );

	  var ambientProduct = mult(lightSource.ambient, objs[i].ambient);
	  var diffuseProduct = mult(lightSource.diffuse, objs[i].diffuse);
	  var specularProduct = mult(lightSource.specular, objs[i].specular);

	   gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"),
		       flatten(ambientProduct));
	   gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"),
		       flatten(diffuseProduct) );
	   gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"),
		       flatten(specularProduct) );
	   gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"),
		       flatten(lightSource.position) );

	   gl.uniform1f(gl.getUniformLocation(program,
		       "shininess"),objs[i].shine);
	  //Draw pyramid
	  gl.drawArrays( gl.TRIANGLES, 0, objs[i].points);

	   gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"),
		       [0,0,0,0]);
	   gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"),
			   [0,0,0,0]);
	   gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"),
			   [0,0,0,0]);
	   gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"),
			   [0,0,0,0]);
    // model-view matrix for shadow then render

    modelViewMatrix = mult(modelViewMatrix, translate(light[0], light[1], light[2]));
    modelViewMatrix = mult(modelViewMatrix, m);
    modelViewMatrix = mult(modelViewMatrix, translate(-light[0], -light[1], -light[2]));

    // send color and matrix for shadow

    gl.bindBuffer( gl.ARRAY_BUFFER, fColor);
	  //vColor
	 var vColor = gl.getAttribLocation( program, "vColor" );
	 gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
	 gl.enableVertexAttribArray( vColor );
	if(i==0){var test =9;}
	else if(i==1){var test =6;}
	else{var test=768;}

    gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    // gl.uniform4fv(fColor, vec4(0.0, 0.0, 0.0, 1.0));
    gl.drawArrays(gl.TRIANGLES, 0, test);
	 }

	 //Call render again to make it animated
	 //window.requestAnimFrame(render);
}
