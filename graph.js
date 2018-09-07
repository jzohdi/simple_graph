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

var device;

if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
    device = "mobile";
}
else{
  device = "desk"
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

// function isArrayItemExists(array , item) {
//     for ( var i = 0; i < array.length; i++ ) {
//         if(JSON.stringify(array[i]) == JSON.stringify(item)){
//             return true;
//         }
//             }
//             return false;
// }

// each graph input saved as an object, so then can call methods on the separate graphs.
function FunctionObject(title, points, express){
  this.title = title;
  this.coordinates = JSON.parse(JSON.stringify(points));

  this.express = express;
  this.cursor = { 'x' : 0,
                    'y': 0};
  this.mouse = [];
  this.intersections = [];
  this.canvasIntersects = []
  this.tangent = '';
  this.slope = math.derivative(title, 'x');
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

      // for (var m = 0; m < this.canvasIntersects.length; m++){
      //   ctx.beginPath();
      //   ctx.strokeStyle = 'red';
      //   ctx.arc(this.canvasIntersects[m][0], this.canvasIntersects[m][1], 5, 0, 2*Math.PI);
      //   ctx.stroke();
      // }
      var text = '  <b>' + this.title + '</b> --> x: ' + this.cursor['x'].toString() + ' y: ' + parseFloat(this.cursor['y']).toFixed(4) + ';'

      var a = this.cursor.x;

      try {
        var m = this.slope.eval({ 'x' : a });
        var expr = math.simplify(this.express.eval({ 'x' : a }).toString() + '+' + m.toString() +'(x - ' + a.toString() + ')');

        // var tanline = [];
        if (expr.toString().includes('i')){
            text += '<b> Tangent Line: </b>x coordinate out of domain.'
        } else {
            for (var x = -xMax; x <= xMax; x = x + 1){
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
      // if (this.intersections.length > 0){
      //   text += '<b> Intersections:</b> '
      //   for (var x = 0; x < this.intersections.length; x++){
      //     text += 'x: ' + this.intersections[x][0] + ' y: ' + this.intersections[x][1] + ' /';
      //   }
      // }
      // text += '<b> Tangent Line: </b>' + expr.toString();

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

function calculateTan(){

  var input = document.getElementById('inputX').value;

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
      // try {

        // var m = window.functionArray[i].slope.eval({ 'x' : inX });
        // var expr = math.simplify(window.functionArray[i].express.eval({ 'x' : inX }).toString() + '+' + m.toString() + '(x - ' + inX.toString() + ')');
        //
        // for (var x = -xMax; x <= xMax; x = x + 1){
        //     for (var y = x; y <= x + 0.1; y = y + 0.01){
        //       var scaleX = mapVals(y, -xMax, xMax, 0, canWidth);
        //       var yval = expr.eval({ 'x' : y });
        //       var scaleY = mapVals(yval, -xMax, xMax, canvas.height, 0);
        //       ctx.fillRect(scaleX, scaleY, 1, 1);
        //     }
        //   }
        // var text = '<b> Tangent Line: </b>' + expr.toString();
        // var id = (i + 1).toString();
        // document.getElementById(id).innerHTML = text;
        // } catch (err){
        //     console.log('Out of Domain')
        // }
    }
    updateGraph();
  }


}

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
// math js cannot handle ln(x) so  remove and replace, while keeping object between ( )
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

// calculate [x, y] values that represent epxression given, save expression, and values as an object, append to array
function getFunction() {
  var expression = document.getElementById("funct").value.replace('X', 'x');
  // replace('ln(x)', 'log(x, 2.71828182846)')
  expression = scrubln(expression);

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

    // var Fraction = algebra.Fraction;
    // var Expression = algebra.Expression;
    // var Equation = algebra.Equation;

    // iterate over past expressions and evaluate any intersects
    // if (window.functionArray.length >= 1){
    //       var exp1 = new Expression(expression)
    //       exp1 = exp1.simplify();
    //       exp1 = algebra.parse(expression);
    //       console.log(exp1.toString())
    //       for (var n = 0; n < window.functionArray.length; n++){
    //         var exp2 = new Expression(window.functionArray[n].title)
    //         exp2 = exp2.simplify();
    //         exp2 = algebra.parse(window.functionArray[n].title);
    //         console.log(exp2.toString)
    //         var eq = new Equation(exp1, exp2);
    //         var solutions = eq.solveFor('x');
    //
    //         for (var m = 0; m < solutions.length; m++){
    //           var xCoord = solutions[m]['numer'];
    //           var yCoord = code.eval({ 'x' : xCoord});
    //           newExpressionObject.intersections.push([xCoord, yCoord]);
    //
    //           var forCanvasX = mapVals(xCoord, -xMax, xMax, 0, canWidth);
    //           var forCanvasY = mapVals(yCoord, -xMax, xMax, canvas.height, 0);
    //
    //           newExpressionObject.canvasIntersects.push([forCanvasX, forCanvasY]);
    //         }
    //       }
    // }

    window.functionArray.push(newExpressionObject);

    var len = window.functionArray.length;
    // '<div id="' + len.toString() + '"></div>'
    var newDiv = document.createElement('p');
    newDiv.setAttribute('id', len.toString());
    document.getElementById('details').appendChild(newDiv);

    for (var j = 0 ; j < coords.length; j++){

      // pOff is the amount you need to add since the canvas top left is 0,0
      var px = coords[j][0]
      var py = coords[j][1]

      ctx.fillRect(px, py, 1, 1);
    }
    if (device == 'mobile'){
      var detailsP = document.getElementById('details')

      details.setAttribute('style', 'height:' + (len*17*3).toString() + 'px;')
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
