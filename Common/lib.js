"use strict";
var objs=[
    {    //triangle
        vPosition:null,
        pointsBuffer:null,
        colorBuffer:null,
        points:0,
        //x rot,y rot,z rot,x pos,y pos,z pos,x scale,y scale,z scale
        position:[
					8,0,2,
					1,0,0,
					0.5,0.5,0.5
				],
        ambiant:[1.0,0,1.0,1.0],
        diffuse:[1.0,.8,0,1.0],
        specular:[1.0,.8,0,1.0],
        shine:20.0
    },
    {    //square
        vPosition:null,
        pointsBuffer:null,
        colorBuffer:null,
        points:0,
        //x rot,y rot,z rot,x pos,y pos,z pos, x scale, y scale, z scale
        position:[
					8,0,2,
					-1,0,0,
					0.3,0.3,0.3
				],
        ambiant:[1.0,0,1.0,1.0],
        diffuse:[1.0,.8,0,1.0],
        specular:[1.0,.8,0,1.0],
        shine:10.0
    },
    {    //circle
        vPosition:null,
        pointsBuffer:null,
        colorBuffer:null,
        points:0,
        //x rot,y rot,z rot,x pos,y pos,z pos,x scale,y scale,z scale
        position:[
					0,0,0,
					0,0,0,
					2,2,2
				],
        ambiant:[1.0,0,1.0,1.0],
        diffuse:[1.0,.8,0,1.0],
        specular:[1.0,.8,0,1.0],
        shine:5.0
    }
];
var lightpoint;
//Sphere Stuff taken from Chapter 6 ShadedSphere1.js
var index = 0;
var va = vec4(0.0, 0.0, -1.0,5);
var vb = vec4(0.0, 0.942809, 0.333333, 5);
var vc = vec4(-0.816497, -0.471405, 0.333333, 5);
var vd = vec4(0.816497, -0.471405, 0.333333,5);
//temporary shape point buffer.
var tmpPointBuff=[],tmpColorBuff=[];
//function that creates all objects and adds them to the object array
function createObjs(light){
    lightpoint = light
     // Load the data into the GPU

    //Create buffer for pyramid
    colorPrism();
    objs[0].pointsBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER,  objs[0].pointsBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(tmpPointBuff), gl.STATIC_DRAW );
    objs[0].points=tmpPointBuff.length;
    //Pyramid color buffer
    objs[0].colorBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, objs[0].colorBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(tmpColorBuff), gl.STATIC_DRAW );

    //Create buffer for cube
    tmpPointBuff=[];
    tmpColorBuff=[];
    colorCube();
    objs[1].pointsBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER,  objs[1].pointsBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(tmpPointBuff), gl.STATIC_DRAW );
    objs[1].points=tmpPointBuff.length;
    //Cube's color
    objs[1].colorBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, objs[1].colorBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(tmpColorBuff), gl.STATIC_DRAW );

    //Create buffer for sphere
    tmpPointBuff=[];
    tmpColorBuff=[];
    tetrahedron(va, vb, vc, vd, 3);
    objs[2].pointsBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER,  objs[2].pointsBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(tmpPointBuff), gl.STATIC_DRAW );
    objs[2].points=tmpPointBuff.length;
    //Fill the sphere with colors
    //Pushes 3 of the same color, then goes up one so each triangle is a different color
    var colorIndex = 0;
    for (var i = 0; i < tmpPointBuff.length; i++) {
        if (i % 3 == 0 && i > 0) colorIndex = (colorIndex + 1) % 8;
      tmpColorBuff.push(getColor(colorIndex, 0.990,tmpPointBuff[i]));
    }
    // Color
    objs[2].colorBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, objs[2].colorBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(tmpColorBuff), gl.STATIC_DRAW );
}

//Returns what color we want
//Used this to return color with a custom alpha
function getColor(index, alpha, point) {
  var color;
  //Determine ambient color
  if (index == 0) color = vec3( 0.0, 0.0, 0.0);      // black
  if (index == 1) color = vec3( 1.0, 0.0, 0.0);      // red
  if (index == 2) color = vec3( 1.0, 1.0, 0.0);      // yellow
  if (index == 3) color = vec3( 0.0, 1.0, 0.0);      // green
  if (index == 4) color = vec3( 0.0, 0.0, 1.0);      // blue
  if (index == 5) color = vec3( 1.0, 0.0, 1.0);      // magenta
  if (index == 6) color = vec3( 0.858, 1.0, 0.768);  // white
  if (index == 7) color = vec3( 0.0, 1.0, 1.0);      // cyan

  //TODO replace with proper shine
  var shine = 1;

  var tolight = normalize(subtract(lightpoint,point));
  var vnorm = normalize(point);

  var cos = dot(vnorm, tolight);

  cos = clamp(cos, 0.0, 1.0);
  var diffuse = scale(cos,color);
  var reflect = normalize(subtract(scale(2.0, scale(dot(vnorm, tolight),vnorm )), tolight));
  var cam = normalize(scale(-1.0,point));

  cos = dot(reflect,cam);
  cos = clamp(cos,0.0, 1.0);
  cos = Math.pow(cos,shine);
  var spec;
  if (cos > 0.0){
    spec = scale(cos,vec3( 0.858, 1.0, 0.768)) //TODO replace vec3 with color of light source
    diffuse = scale((1.0-cos),diffuse);
  } else {
    spec = vec3(0.0,0.0,0.0);
  }
  color = add(add(color , diffuse) ,spec);
  return vec4(color,alpha);
}

//Altered code from RotatingCube.js
//Starts drawing the pyramid
//Uses numbered vertices in a counter-clockwise pattern
//The alpha is the custom alpha to distinguish between each object
//Last number is what color from getColor() we want
function colorPrism() {
  var alpha=0.998;
  tri(0,1,2,alpha,1);
  tri(0,2,3,alpha,2);
  tri(0,3,1,alpha,3);
  tri(1,2,3,alpha,4);
}
function tri(a,b,c,alpha,color) {
  //Positon in which the pyramid shows up
  var vertices = [
      // vec4( 0.655, 0.25, 0.5,   1.0 ), //top
      // vec4( 0.5, 0.0,   0.4,   1.0 ), //yellow-green
      // vec4( 0.6, 0.0,   0.7,   1.0 ), //yellow-red
      // vec4( 0.8, 0.0,   0.5,   1.0 )  //yellow-green

			vec4( 0.2, 0.866, 0.5,   1.0 ), //top
			vec4( 0.0, 0.0,   0.0,   1.0 ),//
			vec4( 0.0, 0.0,   1.0,   1.0 ),//
			vec4( 0.8, 0.0,   0.5,   1.0 )//back
  ];

  //Push the vertex onto prism[] that holds the vertices to be drawn
  tmpPointBuff.push(vertices[a]);
  //Also push a color for the vertex
  tmpColorBuff.push(getColor(color, alpha,vertices[a]));
  tmpPointBuff.push(vertices[b]);
  tmpColorBuff.push(getColor(color, alpha,vertices[b]));
  tmpPointBuff.push(vertices[c]);
  tmpColorBuff.push(getColor(color, alpha,vertices[c]));
}
//Used code from author
function colorCube()
{
    var alpha = 0.993;
    quad( 1, 0, 3, 2, alpha, 1 );
    quad( 2, 3, 7, 6, alpha, 2 );
    quad( 3, 0, 4, 7, alpha, 3 );
    quad( 6, 5, 1, 2, alpha, 4 );
    quad( 4, 5, 6, 7, alpha, 5 );
    quad( 5, 4, 0, 1, alpha, 6 );
}

function quad(a, b, c, d, alpha, color)
{
    var vertices = [
			vec4( -0.5, -0.5,  0.5, 1.0 ),
			vec4( -0.5,  0.5,  0.5, 1.0 ),
			vec4(  0.5,  0.5,  0.5, 1.0 ),
			vec4(  0.5, -0.5,  0.5, 1.0 ),
			vec4( -0.5, -0.5, -0.5, 1.0 ),
			vec4( -0.5,  0.5, -0.5, 1.0 ),
			vec4(  0.5,  0.5, -0.5, 1.0 ),
			vec4(  0.5, -0.5, -0.5, 1.0 )
    ];
    // We need to parition the quad into two triangles in order for
    // WebGL to be able to render it.  In this case, we create two
    // triangles from the quad indices

    //vertex color assigned by the index of the vertex
    var indices = [ a, b, c, a, c, d ];
    for ( var i = 0; i < indices.length; ++i ) {
        tmpPointBuff.push( vertices[indices[i]] );
        tmpColorBuff.push(getColor(color, alpha,vertices[indices[i]]));
    }
}
//Used code from author from ShadedSphere1.js
function triangle(a, b, c) {
    tmpPointBuff.push(a);
    tmpPointBuff.push(b);
    tmpPointBuff.push(c);

     index += 3;
}
function divideTriangle(a, b, c, count) {
      if ( count > 0 ) {

        var ab = mix( a, b, 0.5);
        var ac = mix( a, c, 0.5);
        var bc = mix( b, c, 0.5);

        ab = normalize(ab, true);
        ac = normalize(ac, true);
        bc = normalize(bc, true);

        divideTriangle( a, ab, ac, count - 1 );
        divideTriangle( ab, b, bc, count - 1 );
        divideTriangle( bc, c, ac, count - 1 );
        divideTriangle( ab, bc, ac, count - 1 );
    }
    else {
        triangle( a, b, c );
    }
}
function tetrahedron(a, b, c, d, n) {
    divideTriangle(a, b, c, n);
    divideTriangle(d, c, b, n);
    divideTriangle(a, d, b, n);
    divideTriangle(a, c, d, n);
}
function clamp(x,min,max){
  if (x>max) return max;
  if (x<min) return min;
  return x;
}
