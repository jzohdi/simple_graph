var canvas = document.getElementById('map-canvas')
var screenWidth = window.innerWidth;
var screenHeight = window.innerHeight;
canvas.width = 400;
canvas.height = 400;

var ctx = canvas.getContext("2d");
ctx.fillStyle = "black";
ctx.fillRect(0, 0, canvas.width, canvas.height);

ctx.fillStyle = 'white';

function getFunction() {
  var expression = document.getElementById("funct").value.replace('ln(x)', '2.303log(x)');

  var node = math.parse(expression);
  var code = node.compile();
  var coords = [];
  for (var j = -10; j <= 10; j = j + 0.1){
    var x = parseFloat(j.toFixed(4))
    // console.log(x)
    var result = code.eval({'x' : x});
    // var y  = (result *-20) + 200;
    coords.push([x, result]);
  }
  // var start = coords.shift();
  // var sx = (start[0] * 20) + 200;
  // var sy = (start[1] * -20) + 200;
  // console.log(sx, sy)
  // console.log(coords)
  for (var j = 0 ; j < coords.length; j++){
    var px = (coords[j][0] * 20) + 200;
    var py = (coords[j][1] * -20) + 200;
    ctx.fillRect(px, py, 1, 1);
  }
  // ctx.beginPath();
  // ctx.moveTo(sx, sy);
  // for (var j = 0; j < coords.length; j++){
  //     var px = (coords[j][0] * 20) + 200;
  //     var py = (coords[j][1] * -20) + 200;
  //   ctx.lineTo(px, py);
  // }
  // ctx.stroke();

}

function setAxis(){
  var yAxis = [], xAxis = [];
  var ymid = canvas.width/2, xmid = canvas.height/2;
  var ymarkers = canvas.height/20, xmarkers = canvas.width/20;

  for (var n = 0; n <= canvas.height; n = n + ymarkers){
    yAxis.push(parseFloat(n.toFixed(2)))
  }
  for (var n = 0; n <= canvas.width; n = n + xmarkers){
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

function clearGraph(){
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'white';
  setAxis();
}
