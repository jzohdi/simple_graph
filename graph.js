var canvas = document.getElementById('map-canvas')

// get a square for the canvas window
var screenWidth = window.innerWidth;
var screenHeight = (window.innerHeight - 116);
var boxSide = Math.min(screenWidth, screenHeight);
// console.log(boxSide);
// if height is shorter and width, center the graph box
if (screenWidth > screenHeight){

  var diff = screenWidth - screenHeight;
  var offset = parseInt(diff/2);

  document.getElementById('styles').append('#map-canvas {transform: translate(' + offset.toString() +  'px, 0);} #details { margin-left: ' + offset.toString() + 'px;}');
}
else {
  var offset = 0;
}

canvas.width = boxSide;
canvas.height = boxSide;

document.getElementById('styles').append('#details { width: ' + (boxSide - 6).toString() + 'px; display: block; }')
document.getElementById('styles').append('.flex { margin-left: ' + offset.toString() + 'px; width: ' + boxSide.toString() + 'px;}');

var canWidth = canvas.width;
var canvasoffsetTop = $('#map-canvas').offset().top;
document.getElementById('styles').append('#zoom {transform: translate(' + (canWidth + offset - 30).toString() + 'px, ' + 0 + 'px);}')
var pOff = (canWidth/2);

var device;

if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
    device = "mobile";
}
else{
  device = "desk"
}
if (device == 'mobile'){
  document.getElementById('styles').append('#details { font-sixe: 14px }')
}
// use for calculating the the values of the epxressions, from -xScale to +xScales
var xScale = (canWidth/2);
var xMax = 10;
// init canvas background
var ctx = canvas.getContext("2d");

ctx.fillStyle = "black";

ctx.fillRect(0, 0, canWidth, canvas.height);

// set fill to white for the graph lines
ctx.fillStyle = 'white';

// maping of pixels to axis
function mapVals(num, in_min, in_max, out_min, out_max) {
  return (num - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}


/*
// each graph input saved as an object, so then can call methods on the separate graphs.
* the function object calculates its own tangent line, the canvas coordinates
* are held within coordinates and must be calculated again if the canvas
* is zoomed in or out.
*
*/
function FunctionObject(title, string, points, express){
  this.title = title;
  this.coordinates = JSON.parse(JSON.stringify(points));

  this.express = express;
  this.cursor = { 'x' : 0,
                    'y': 0};
  this.mouse = [];
  this.intersections = [];
  this.canvasIntersects = []
  this.tangent = '';
  this.slope = math.derivative(string, 'x');

  this.update = function(num){
      var y = 0;
      for (var x = 0; x < this.coordinates.length; x++){
        var px = this.coordinates[x][0];
        var py = this.coordinates[x][1];
        ctx.fillRect(px, py, 1, 1);
      }

      ctx.beginPath();
      ctx.strokeStyle = 'white'
      for (var x = 0; x < window.functionArray.length; x++){
        if (window.functionArray[x].title !== this.title){
          if (Math.abs(parseFloat(window.functionArray[x].cursor['y']) - parseFloat(this.cursor['y'])) <= 0.04){
            ctx.strokeStyle = 'red';
            ctx.fillStyle = "red";
            ctx.font = '20px Arial';
            ctx.fillText('X : ' + this.cursor['x'].toString(), this.mouse[0] + 20, this.mouse[y] - 20)
            ctx.fillStyle = "white";
          }
        }
      }
      ctx.lineWidth = 2;
      ctx.arc(this.mouse[0], this.mouse[1], 5, 0, 2 * Math.PI);
      ctx.stroke();

      var text = '  <b>' + this.title + '</b> --> x: ' + this.cursor['x'].toString() + ' y: ' + parseFloat(this.cursor['y']).toFixed(4) + ';'

      var a = this.cursor.x;

      try {
        var m = this.slope.eval({ 'x' : a });
        var expr = math.simplify(this.express.eval({ 'x' : a }).toFixed(5) + '+' + parseFloat(m).toFixed(5) +'(x - ' + parseFloat(a).toFixed(4) + ')');

        // var tanline = [];
        if (expr.toString().includes('i')){
            text += '<b> Tangent Line: </b>x coordinate out of domain.'
        } else {
            for (var x = -xMax; x <= xMax; x = x + (xMax/10)){
              for (var y = x; y <= x + 0.1; y = y + 0.01){
                var scaleX = mapVals(y, -xMax, xMax, 0, canWidth);
                var yval = expr.eval({ 'x' : y });
                var scaleY = mapVals(yval, -xMax, xMax, canvas.height, 0);
                ctx.fillRect(scaleX, scaleY, 1, 1);
              }
            }
            text += '<b> Tangent Line: </b>' + expr.toString();
         }
      } catch (err) {
          text += '<b> Tangent Line: </b>x coordinate out of domain.'
      }

      text += '<br><b>Derivative: </b> ' + this.slope.toString();
      document.getElementById(num.toString()).innerHTML = text;
  }
}

var functionArray = new Array;

var canvasoffset = $('#map-canvas').offset().left

// event listner to look at where on each graph the mouse X is
if (device == "mobile"){
  // document.getElementById("deviceID").
  canvas.addEventListener("touchmove", calculate, false);
} else {
canvas.addEventListener('mousemove', calculate, false);
}

// calculate tanget line for the user input X
document.getElementById('find-Tan').addEventListener('click', calculateTan);

/*
*
* calculateTan is called upon input x, the line itself
* is draw by the function object within its update method
*
*/
function calculateTan(){

  var input = document.getElementById('inputX').value.replace('pi', Math.PI);
  var inX = parseFloat(input);

  if (inX != NaN){
    var xOnCanvas = mapVals(inX, -xMax, xMax, 0, canWidth);
    for (var i = 0; i < window.functionArray.length; i++){

        var express = window.functionArray[i].express;
        var yFromFunc = express.eval({ 'x' : inX });
        var yOnCanvas = mapVals(yFromFunc, -xMax, xMax, canvas.height, 0);

        window.functionArray[i].cursor['x'] = inX;
        window.functionArray[i].cursor['y'] = yFromFunc;
        window.functionArray[i].mouse = [xOnCanvas, yOnCanvas];

    }
    updateGraph();
  } 
}

function calculateURI() {
  const titles = window.functionArray.map( fn => fn.title );
  let xValue = null;
  if ( window.functionArray.length > 0 ) {
    xValue = window.functionArray[0].cursor.x;
  } 

  return encodeURIComponent( JSON.stringify( { fns: titles, xValue } ) );
}

function parseURI( uri ) {
  return JSON.parse( decodeURIComponent( uri ) );
}

//
// set the mouse coordinates and where the function object will draw its tangent and cursor circle
//
//
//
//
function calculate(event){

  var numExpressions = window.functionArray.length;
  // console.log(event.clientX - window.canvasoffset)

  if (numExpressions > 0){
    if (device == 'mobile'){
      var x  = event.touches[0].clientX;
    } else {
      var x = (event.clientX - window.canvasoffset)
    }

    // console.log(x, canvas.width);
    // console.log(x, xScale);
    var xScaled = mapVals(x, 0, canWidth, -xMax, xMax);
    //
    var xFix = xScaled.toFixed(2)
    for (var n = 0; n < numExpressions; n++){

      var fx = window.functionArray[n].express;
      var yval = fx.eval({'x' : xFix })

      var yCursor = mapVals(yval, -xMax, xMax, canvas.height, 0);
      // console.log(yval)
      window.functionArray[n].mouse = [x, yCursor];
      window.functionArray[n].cursor['x'] = xFix;
      window.functionArray[n].cursor['y'] = yval;
    }
    updateGraph();
  }
}

//
// math js cannot handle ln(x) so  remove and replace, while keeping object between ( )
//
//

function scrubln(ex){

  if ( ex.includes('ln(') ){
    var start = false;
    var middle = [];
    var exBefore;
    var exAfter;
    for (var i = 0; i < ex.length; i++){
      if (ex.charAt(i) == 'l' && ex.charAt(i+1) == 'n'){
        exBefore = ex.slice(0, i);
        middle.push(i + 3);
        start = true;
      }
      if (start == true){
        if (ex.charAt(i) == ')'){
          exAfter = ex.slice(i, ex.length);
          start = false;
          middle.push(i)
        }
      }

    }
    return exBefore + 'log(' + ex.slice(middle[0], middle[1]) + ', 2.71828182846'+ exAfter;
  } else {
    return ex;
  }

}

/*
*
* getFunction is called when the user clicks on the Go button,
* first changing it to all lower case then removing ln and replacing with
* log(x) based e since this is the equivalent function,
* then checking to see if the user has already entered this function previously
* if not then a new object is created that holds the function and associated
* methods
*
*/
function getFunction() {

  var expression = document.getElementById("funct").value.toLowerCase();
  if (expression == ''){
    return console.log("empty function field");
  }
  // replace('ln(x)', 'log(x, 2.71828182846)')
  var finalexpression = scrubln(expression);
  // console.log(finalexpression, expression);
  var alreadyExpressed = false;

  for (var t = 0; t < window.functionArray.length; t++){
    if (window.functionArray[t].title == expression){
      alreadyExpressed = true;
    }
  }

  if (alreadyExpressed == false){
    var node = math.parse(finalexpression);
    var code = node.compile();

    var coords = [];
    // 0.01 is the resolution for the calculated y values
    for (var x = -xMax; x <= xMax; x = x + 0.01){

      // var x = j

      var result = code.eval({'x' : x});

      var canvasX = mapVals(x, -xMax, xMax, 0, canWidth);
      var canvasY = mapVals(result, -xMax, xMax, canvas.height, 0);

      coords.push([parseFloat(canvasX).toFixed(4), parseFloat(canvasY).toFixed(4)]);
    }

    var newExpressionObject = new FunctionObject(expression, finalexpression, coords, code);

    window.functionArray.push(newExpressionObject);

    var len = window.functionArray.length;
    // '<div id="' + len.toString() + '"></div>'
    var newDiv = document.createElement('p');
    newDiv.setAttribute('id', len.toString());
    if (device == 'mobile'){
      newDiv.setAttribute('style', 'height:' + (18*3).toString() + 'px;')
    } else {
      newDiv.setAttribute('style', 'height:' + (18*3).toString() + 'px;')
    }
    document.getElementById('details').appendChild(newDiv);

    for (var j = 0 ; j < coords.length; j++){

      // pOff is the amount you need to add since the canvas top left is 0,0
      var px = coords[j][0]
      var py = coords[j][1]

      ctx.fillRect(px, py, 1, 1);
    }
  }
}

/*
*
* This function is called when the zoom in or zoom out buttons are clicked
* the function iterates through each of the saved function's canvas coordinates
* and recalculates where the points along the graph should be relative to the
* new frame. the page starts at from -10 to 10
*
*/

function setNewCoords(num){
  var newMax = xMax + num;
  for (var j = 0; j < window.functionArray.length; j++){
    var newCoords = [];
    var funct = window.functionArray[j];
    for (var x = -newMax; x <= newMax; x = x + 0.01){

      // var x = j

      var result = funct.express.eval({'x' : x});

      // map the x and y of the function to the dimensions of the canvas
      var canvasX = mapVals(x, -newMax, newMax, 0, canWidth);
      var canvasY = mapVals(result, -newMax, newMax, canvas.height, 0);
      // console.log(canvasX, canvasY)
      newCoords.push([parseFloat(canvasX).toFixed(4), parseFloat(canvasY).toFixed(4)]);
    }
    funct.coordinates = newCoords;
  }
  window.xMax += num;
  document.getElementById('inputX').setAttribute('placeholder', 'input value for x from ' + (-newMax) + ' to ' + newMax);
  updateGraph();
}


document.getElementById('zoom-out').addEventListener("click", function(){
  setNewCoords(1);
});
document.getElementById('zoom-in').addEventListener("click", function(){
  setNewCoords(-1);
});


/*
*
* Below are the are the reused methods to draw the axis,
* clear functions
* and while updateGraph is called, update will be called
* on each function, giving an effect of animation
*
*/
function setAxis(){

  var yAxis = [], xAxis = [];
  var ymid = canWidth/2, xmid = canvas.height/2;
  var ymarkers = canvas.height/20, xmarkers = canWidth/20;

  for (var n = 0; n <= canvas.height; n = n + ymarkers){
    yAxis.push(parseFloat(n.toFixed(2)))
  }
  for (var n = 0; n <= canWidth; n = n + xmarkers){
    xAxis.push(parseFloat(n.toFixed(2)));
  }
  // console.log(yAxis, xAxis)
  for (var i = 0; i < yAxis.length; i++){
    ctx.fillRect(ymid, yAxis[i], 1, 1);
  }
  for (var i = 0; i < xAxis.length; i++){
    ctx.fillRect(xAxis[i], xmid, 1, 1);
  }
}

setAxis();

// clear graph back to just the markers
function clearGraph(){
  window.functionArray = [];

  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canWidth, canvas.height);
  ctx.fillStyle = 'white';

  setAxis();

  document.getElementById('inputX').value = "";
  document.getElementById('details').innerHTML = "";
  var base_address = window.location.href.toString();
  base_address = base_address.slice(0, base_address.indexOf("?"));
  window.history.replaceState(null, null, base_address)
}

function updateGraph(){

  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canWidth, canvas.height);
  ctx.fillStyle = 'white';
  setAxis();

  for (var x = 0; x < window.functionArray.length; x++){
    window.functionArray[x].update((x + 1));
  }
  // zoomButton.update();
}

function readURI(){

  var encoded_URI = window.location.href;

  if (encoded_URI.includes("?")){

    var function_strings = [];
    var x_coordinate = [];
    var start_slice, end_slice;
    encoded_URI = encoded_URI.slice(encoded_URI.indexOf("?") + 1);

    encoded_URI = decodeURIComponent(encoded_URI);
    var re  = /\(([^)]+)\)/g;

    while (m = re.exec(encoded_URI)) {
      function_strings.push(m[1]);
    }

    if(encoded_URI.includes("!")){
      var index_coord = encoded_URI.indexOf("!"),
            index_fx = encoded_URI.lastIndexOf("(");
      if (index_coord < index_fx){
          var x_for_input = encoded_URI.slice(index_coord + 1, index_fx);
      } else {
        var x_for_input = encoded_URI.slice(index_coord + 1);
      }
    }

    for (var each_func = 0; each_func < function_strings.length; each_func++){
      var expression = function_strings[each_func];
      document.getElementById("funct").value = expression;
      document.getElementById("buttn1").click();
    }

    if (x_for_input){
      document.getElementById("inputX").value = x_for_input;
      document.getElementById("find-Tan").click();
      }

  }

}
readURI();
