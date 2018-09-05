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
var canWidth = canvas.width;

var pOff = (canWidth/2);

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

// console.log(mapVals(-8.01, -10, 10, -433, 433));
// function intersect(a, b) {
//     var t;
//     if (b.length > a.length) t = b, b = a, a = t; // indexOf to loop over shorter
//     return a.filter(function (e) {
//         return b.indexOf(e) > -1;
//     }).filter(function (e, i, c) { // extra step to remove duplicates
//         return c.indexOf(e) === i;
//     });
// }

function isArrayItemExists(array , item) {
    for ( var i = 0; i < array.length; i++ ) {
        if(JSON.stringify(array[i]) == JSON.stringify(item)){
            return true;
        }
            }
            return false;
}

// each graph input saved as an object, so then can call methods on the separate graphs.
function FunctionObject(title, points, express){
  this.title = title;
  this.coordinates = JSON.parse(JSON.stringify(points));

  this.express = express;
  this.cursor = { 'x' : 0,
                    'y': 0};
  this.mouse = [];
  this.intersections = [];
  //
  // if (window.functionArray.length > 0) {
  //   for ( var t = 0; t < window.functionArray.length; t++){
  //       var otherExpression = window.functionArray[t].express;
  //       for (var n = -10; n < 10; n=n + 0.01){
  //           var thisY = express.eval({ 'x' : parseFloat(n).toFixed(2) })
  //           var otherY = otherExpression.eval({ 'x' : parseFloat(n).toFixed(2) })
  //           if(thisY == otherY){
  //             this.intersections.push([parseFloat(n).toFixed(2), otherY])
  //           }
  //       }
  //   }
  // }

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
      // if (this.intersections.length > 0){
      //   text += '<b> Intersections:</b> '
      //   for (var x = 0; x < this.intersections.length; x++){
      //     text += 'x: ' + this.intersections[x][0] + ' y: ' + this.intersections[x][1];
      //   }
      // }
      document.getElementById(num.toString()).innerHTML = text;
  }
}

var functionArray = new Array;

var canvasoffset = $('#map-canvas').offset().left

// event listner to look at where on each graph the mouse X is
canvas.addEventListener('mousemove', calculate, false);

function calculate(event){
  var numExpressions = window.functionArray.length;
  // console.log(event.clientX - window.canvasoffset)
  if (numExpressions > 0){
    var x = (event.clientX - window.canvasoffset)
    // console.log(x, canvas.width)
    // console.log(x, xScale)
    var xScaled = mapVals(x, 0, canWidth, -10, 10)
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
// calculate [x, y] values that represent epxression given, save expression, and values as an object, append to array
function getFunction() {
  var expression = document.getElementById("funct").value.replace('X', 'x').replace('ln(x)', '2.303log(x)');
  var alreadyExpressed = false;
  for (var t = 0; t < window.functionArray.length; t++){
    if (window.functionArray[t].title == expression){
      alreadyExpressed = true;
    }
  }
  if (alreadyExpressed == false){
    var node = math.parse(expression);
    var code = node.compile();

    var coords = [];
    // 0.01 is the resolution for the calculated y values
    for (var x = -xMax; x <= xMax; x = x + 0.01){

      // var x = j

      var result = code.eval({'x' : x});

      // map the x and y of the function to the dimensions of the canvas
      var canvasX = mapVals(x, -xMax, xMax, 0, canWidth);
      var canvasY = mapVals(result, -xMax, xMax, canvas.height, 0);
      // console.log(canvasX, canvasY)
      coords.push([parseFloat(canvasX).toFixed(4), parseFloat(canvasY).toFixed(4)]);
    }

    var newExpressionObject = new FunctionObject(expression, coords, code);

    window.functionArray.push(newExpressionObject);

    if (window.functionArray.length >= 2){

    }
    var len = window.functionArray.length;
    // '<div id="' + len.toString() + '"></div>'
    var newDiv = document.createElement('p')
    newDiv.setAttribute('id', len.toString())
    document.getElementById('details').appendChild(newDiv)

    for (var j = 0 ; j < coords.length; j++){

      // pOff is the amount you need to add since the canvas top left is 0,0
      var px = coords[j][0]
      var py = coords[j][1]

      ctx.fillRect(px, py, 1, 1);
    }
  }
}

// initiate the axis markers
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

  document.getElementById('details').innerHTML = "";
}

function updateGraph(){

  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canWidth, canvas.height);
  ctx.fillStyle = 'white';
  setAxis();

  for (var x = 0; x < window.functionArray.length; x++){
    window.functionArray[x].update((x + 1));
  }
}
