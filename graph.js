const initSettings = canvas => {
  // get a square for the canvas window
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight - 116;
  const boxSide = Math.min(screenWidth, screenHeight);
  let offset = 0;
  // if height is shorter and width, center the graph box
  if (screenWidth > screenHeight) {
    const diff = screenWidth - screenHeight;
    document
      .getElementById("styles")
      .append(
        "#map-canvas {transform: translate(" +
          offset.toString() +
          "px, 0);} #details { margin-left: " +
          offset.toString() +
          "px;}"
      );
      offset = parseInt(diff / 2);
  }
  canvas.width = boxSide;
  canvas.height = boxSide;

  document
    .getElementById("styles")
    .append(
      "#details { width: " + (boxSide - 6).toString() + "px; display: block; }"
    );
  document
    .getElementById("styles")
    .append(
      ".flex { margin-left: " +
        offset.toString() +
        "px; width: " +
        boxSide.toString() +
        "px;}"
    );
  document
    .getElementById("styles")
    .append(
      "#zoom {transform: translate(" +
        (canvas.width + offset - 30).toString() +
        "px, " +
        0 +
        "px);}"
    );
  // use for calculating the the values of the epxressions, from -xScale to +xScales
  // init canvas background
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // set fill to white for the graph lines
  ctx.fillStyle = "white";
  return ctx;
}

class App {
  constructor() {
    this.canvas = document.getElementById("map-canvas");
    this.canvasoffset = $("#map-canvas").offset().left;
    this.ctx = initSettings(this.canvas);
    this.device = 
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) ? "mobile": "desk";
    if (this.device == "mobile") {
      document.getElementById("styles").append("#details { font-sixe: 14px }");
    }      
    this.xScale = canWidth / 2;
    this.xMax = 10;
    this.xMin = -10;
    this.pOff = canWidth / 2;
    this.resolution = 0.005;
    this.functionArray = [];
  }
  // maping of pixels to axis
  mapVals(num, in_min, in_max, out_min, out_max) {
    return ((num - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min;
  }

  functionAlreadyExists(newExpression) {
    const findExpression = this.functionArray.filter(expression => {
       return expression == newExpression;
    })
    return findExpression.length > 0;
  }

  getExpressionValues(code) {
    let coords = []
    // resolution is the resolution for the calculated y values
    for (const x = xMin; x <= xMax; x = x + resolution) {

      const result = code.eval({ x: x });
      const canvasX = mapVals(x, xMin, xMax, 0, canWidth);
      const canvasY = mapVals(result, xMin, xMax, canvas.height, 0);

      coords.push([
        parseFloat(canvasX).toFixed(4),
        parseFloat(canvasY).toFixed(4)
      ]);
    }
    return coords;
  }
 /*
  * getFunction is called when the user clicks on the Go button,
  * first changing it to all lower case then removing ln and replacing with
  * log(x) based e since this is the equivalent function,
  * then checking to see if the user has already entered this function previously
  * if not then a new object is created that holds the function and associated
  * methods
  */
  getFunction() {
    const expression = document.getElementById("funct").value.toLowerCase();
    if (expression == "") {
      console.log("empty function field");
      return;
    }
    // replace('ln(x)', 'log(x, 2.71828182846)')
    const finalexpression = scrubln(expression);
    // console.log(finalexpression, expression);

    if (this.functionAlreadyExists(expression)) {
      const node = math.parse(finalexpression);
      const code = node.compile();

      const coords = this.getExpressionValues(code);
      this.functionArray.push(new FunctionObject(
        expression,
        finalexpression,
        coords,
        code,
        this
      ));
      this.addFunctionDetailsDiv();
      this.drawFunctionValuesToGraph(coords)
    }
  }
  drawFunctionValuesToGraph(coords){
    for (const j = 0; j < coords.length; j++) {
      // pOff is the amount you need to add since the canvas top left is 0,0
      const px = coords[j][0];
      const py = coords[j][1];
      ctx.fillRect(px, py, 1, 1);
    }
  }
  
  addFunctionDetailsDiv(){
    const len = this.functionArray.length;
    // '<div id="' + len.toString() + '"></div>'
    const newDiv = document.createElement("p");
    newDiv.setAttribute("id", len.toString());
    if (device == "mobile") {
      newDiv.setAttribute("style", "height:" + (18 * 3).toString() + "px;");
    } else {
      newDiv.setAttribute("style", "height:" + (18 * 3).toString() + "px;");
    }
    document.getElementById("details").appendChild(newDiv);
  }

}
/*
// each graph input saved as an object, so then can call methods on the separate graphs.
* the function object calculates its own tangent line, the canvas coordinates
* are held within coordinates and must be calculated again if the canvas
* is zoomed in or out.
*
*/
class FunctionObject {
  constructor(title, string, points, express, app) {
    this.parentApp = app;
    this.title = title;
    this.coordinates = JSON.parse(JSON.stringify(points));

    this.express = express;
    this.cursor = {
      x: 0,
      y: 0
    };
    this.mouse = [];
    this.intersections = [];
    this.canvasIntersects = [];
    this.tangent = "";
    this.slope = math.derivative(string, "x");
  }
  drawCoordinateValues(coordinateArray) {
    const parentApp = this.parentApp;
    coordinateArray.forEach(coordinate => {
      parentApp.ctx.fillRect(coordinate[0], coordinate[1], 1, 1);
    })
  }
  drawYValueIndicator() {
    const app = this;
    const parentApp = this.parentApp;
    parentApp.ctx.beginPath();
    parentApp.ctx.strokeStyle = "white";
 
    this.parentApp.functionArray.forEach(expression => {
      if(expression.title !== app.title && app.yValuesAreWithinThreshold(expression.cursor["y"])){
        parentApp.ctx.strokeStyle = "red";
        parentApp.ctx.fillStyle = "red";
        parentApp.ctx.font = "20px Arial";
        parentApp.ctx.fillText(
          "X : " + this.cursor["x"].toString(),
          this.mouse[0] + 20,
          this.mouse[y] - 20
        );
        parentApp.ctx.fillStyle = "white";
      }
    })
    parentApp.ctx.lineWidth = 2;
    parentApp.ctx.arc(this.mouse[0], this.mouse[1], 5, 0, 2 * Math.PI);
    parentApp.ctx.stroke();
  }
  yValuesAreWithinThreshold(otherExpressionYValue){
    return Math.abs(parseFloat(otherExpressionYValue) - parseFloat(this.cursor["y"])) <= 0.04
  }
  takeDerivative(){
    const a = this.cursor.x;
    try {
      const m = this.slope.eval({ x: a });
      const expr = math.simplify(
        this.express.eval({ x: a }).toFixed(5) +
          "+" +
          parseFloat(m).toFixed(5) +
          "(x - " +
          parseFloat(a).toFixed(4) +
          ")"
      );
      return expr;
    } catch(error){
      return null;
    }
  }
  update(num) {
    const y = 0;
    this.drawCoordinateValues(this.coordinates);
    this.drawYValueIndicator();

    const derivative = this.takeDerivative(); 
    if (derivative == null || derivative.toString().includes("i")) {
      this.writeFunctionDetails("<b> Tangent Line: </b>x coordinate out of domain.");
      return;
    }
    this.drawTangentLine(derivative);   
    this.writeFunctionDetails("<b> Tangent Line: </b>" + expr.toString(), num)
  };
  drawTangentLine(derivative){
    for (const x = this.parentApp.xMin; x <= this.parentApp.xMax; x = x + this.parentApp.xMax / 10) {
      for (const y = x; y <= x + 0.1; y = y + this.parentApp.resolution) {
        const scaleX = mapVals(y, this.parentApp.xMin, this.parentApp.xMax, 0, this.parentApp.canvas.width);
        const yval = derivative.eval({ x: y });
        const scaleY = mapVals(yval, this.parentApp.xMin, this.parentApp.xMax, canvas.height, 0);
        ctx.fillRect(scaleX, scaleY, 1, 1);
      }
    }
  }
  writeFunctionDetails(tangentLineMessage, num){
    const text =
    `  <b>${this.title}</b> --> x: ${this.cursor["x"].toString()} y: ${parseFloat(this.cursor["y"]).toFixed(4)};` +
    tangentLineMessage + "<br><b>Derivative: </b> " + this.slope.toString();
    document.getElementById(num.toString()).innerHTML = text;
  }
}

// event listner to look at where on each graph the mouse X is
if (device == "mobile") {
  // document.getElementById("deviceID").
  canvas.addEventListener("touchmove", calculate, false);
} else {
  canvas.addEventListener("mousemove", calculate, false);
}

// calculate tanget line for the user input X
document.getElementById("find-Tan").addEventListener("click", calculateTan);

/*
 *
 * calculateTan is called upon input x, the line itself
 * is draw by the function object within its update method
 *
 */
function calculateTan() {
  const input = document.getElementById("inputX").value.replace("pi", Math.PI);
  const inX = parseFloat(input);

  if (inX != NaN) {
    const xOnCanvas = mapVals(inX, xMin, xMax, 0, canWidth);
    for (const i = 0; i < window.functionArray.length; i++) {
      const express = window.functionArray[i].express;
      const yFromFunc = express.eval({ x: inX });
      const yOnCanvas = mapVals(yFromFunc, xMin, xMax, canvas.height, 0);

      window.functionArray[i].cursor["x"] = inX;
      window.functionArray[i].cursor["y"] = yFromFunc;
      window.functionArray[i].mouse = [xOnCanvas, yOnCanvas];
    }
    updateGraph();
  }
}

//
// set the mouse coordinates and where the function object will draw its tangent and cursor circle
//
//
//
//
function calculate(event) {
  const numExpressions = window.functionArray.length;
  // console.log(event.clientX - window.canvasoffset)

  if (numExpressions > 0) {
    if (device == "mobile") {
      const x = event.touches[0].clientX;
    } else {
      const x = event.clientX - window.canvasoffset;
    }

    // console.log(x, canvas.width);
    // console.log(x, xScale);
    const xScaled = mapVals(x, 0, canWidth, xMin, xMax);
    //
    const xFix = xScaled.toFixed(2);
    for (const n = 0; n < numExpressions; n++) {
      const fx = window.functionArray[n].express;
      const yval = fx.eval({ x: xFix });

      const yCursor = mapVals(yval, xMin, xMax, canvas.height, 0);
      // console.log(yval)
      window.functionArray[n].mouse = [x, yCursor];
      window.functionArray[n].cursor["x"] = xFix;
      window.functionArray[n].cursor["y"] = yval;
    }
    updateGraph();
  }
}

//
// math js cannot handle ln(x) so  remove and replace, while keeping object between ( )
//
//

function scrubln(ex) {
  if (ex.includes("ln(")) {
    const start = false;
    const middle = [];
    const exBefore;
    const exAfter;
    let countParens = 0;
    for (const i = 0; i < ex.length; i++) {
      if (ex.charAt(i) == "l" && ex.charAt(i + 1) == "n") {
        exBefore = ex.slice(0, i);
        middle.push(i + 3);
        start = true;
      }
      if (start == true) {
        if (ex.charAt(i) == "(") {
          countParens += 1;
        }
        if (ex.charAt(i) == ")") {
          if (countParens == 1) {
            exAfter = ex.slice(i, ex.length);
            start = false;
            middle.push(i);
          } else {
            countParens -= 1;
          }
        }
      }
    }
    return (
      exBefore +
      "log(" +
      ex.slice(middle[0], middle[1]) +
      ", 2.71828182846" +
      exAfter
    );
  } else {
    return ex;
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
document
  .getElementById("map-canvas")
  .addEventListener("onmouseleave", function() {
    console.log("yes");
  });
function setNewCoords(num) {
  const newMax = xMax + num;
  const newMin = xMin + num;
  for (const j = 0; j < window.functionArray.length; j++) {
    const newCoords = [];
    const funct = window.functionArray[j];
    for (const x = newMin; x <= newMax; x = x + resolution) {
      // const x = j

      const result = funct.express.eval({ x: x });

      // map the x and y of the function to the dimensions of the canvas
      const canvasX = mapVals(x, newMin, newMax, 0, canWidth);
      const canvasY = mapVals(result, newMin, newMax, canvas.height, 0);
      // console.log(canvasX, canvasY)
      newCoords.push([
        parseFloat(canvasX).toFixed(4),
        parseFloat(canvasY).toFixed(4)
      ]);
    }
    funct.coordinates = newCoords;
  }
  window.xMax += num;
  window.xMin += num;
  document
    .getElementById("inputX")
    .setAttribute(
      "placeholder",
      "input value for x from " + newMin + " to " + newMax
    );
  updateGraph();
}

// document.getElementById("zoom-out").addEventListener("click", function() {
//   setNewCoords(1);
// });
// document.getElementById("zoom-in").addEventListener("click", function() {
//   setNewCoords(-1);
// });

/*
 *
 * Below are the are the reused methods to draw the axis,
 * clear functions
 * and while updateGraph is called, update will be called
 * on each function, giving an effect of animation
 *
 */
function setAxis() {
  const yAxis = [],
    xAxis = [];
  const ymid = canWidth / 2,
    xmid = canvas.height / 2;
  const ymarkers = canvas.height / 20,
    xmarkers = canWidth / 20;

  for (const n = 0; n <= canvas.height; n = n + ymarkers) {
    yAxis.push(parseFloat(n.toFixed(2)));
  }
  for (const n = 0; n <= canWidth; n = n + xmarkers) {
    xAxis.push(parseFloat(n.toFixed(2)));
  }
  // console.log(yAxis, xAxis)
  for (const i = 0; i < yAxis.length; i++) {
    ctx.fillRect(ymid, yAxis[i], 1, 1);
  }
  for (const i = 0; i < xAxis.length; i++) {
    ctx.fillRect(xAxis[i], xmid, 1, 1);
  }
}

setAxis();

// clear graph back to just the markers
function clearGraph() {
  window.functionArray = [];

  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canWidth, canvas.height);
  ctx.fillStyle = "white";

  setAxis();

  document.getElementById("inputX").value = "";
  document.getElementById("details").innerHTML = "";
  const base_address = window.location.href.toString();
  let end_uri = base_address.indexOf("?");
  if (end_uri > -1) base_address = base_address.slice(0, end_uri);
  window.history.replaceState(null, null, base_address);
}

function updateGraph() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canWidth, canvas.height);
  ctx.fillStyle = "white";
  setAxis();

  for (const x = 0; x < window.functionArray.length; x++) {
    window.functionArray[x].update(x + 1);
  }
  // zoomButton.update();
}
/*
 * Functions for URI handlings and reading from the current graph objects
 *
 *
 */

document.getElementById("buttn1").addEventListener("click", replaceURI);

function replaceURI() {
  let uri_comp = calculateURI();
  window.history.replaceState(null, null, "?" + uri_comp);
}

function calculateURI() {
  const titles = window.functionArray.map(fn => fn.title);
  let xValue = null;
  if (window.functionArray.length > 0) {
    xValue = window.functionArray[0].cursor.x;
  }

  return encodeURIComponent(JSON.stringify({ fns: titles, xValue }));
}

function parseURI(uri) {
  return JSON.parse(decodeURIComponent(uri));
}

const readURI = () => {
  let address = window.location.href;
  let uri_index = address.indexOf("?");
  if (uri_index > -1) {
    let funcElement = document.getElementById("funct");
    let goButton = document.getElementById("buttn1");

    address = address.slice(uri_index + 1);
    let components = parseURI(address);
    components.fns.forEach(function(el) {
      funcElement.value = el;
      goButton.click();
    });
    document.getElementById("inputX").value = components.xValue;
    document.getElementById("find-Tan").click();
  }
}
readURI();
setAxis();
