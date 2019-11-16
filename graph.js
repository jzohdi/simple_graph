const initSettings = canvas => {
  // get a square for the canvas window
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight - 116;
  const boxSide = Math.min(screenWidth, screenHeight);
  let offset = 0;
  // if height is shorter and width, center the graph box
  if (screenWidth > screenHeight) {
    const diff = screenWidth - screenHeight;
    offset = parseInt(diff / 2);
    document
      .getElementById("styles")
      .append(
        "#map-canvas {transform: translate(" +
          offset.toString() +
          "px, 0);} #details { margin-left: " +
          offset.toString() +
          "px;}"
      );
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
};

class App {
  constructor() {
    this.canvas = document.getElementById("map-canvas");
    this.ctx = initSettings(this.canvas);
    this.canvasoffset = $("#map-canvas").offset().left;
    this.device = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )
      ? "mobile"
      : "desk";
    if (this.device == "mobile") {
      document.getElementById("styles").append("#details { font-sixe: 14px }");
    }
    this.xScale = this.canvas.width / 2;
    this.xMax = 10;
    this.xMin = -10;
    this.pOff = this.canvas.width / 2;
    this.resolution = 0.005;
    this.functionArray = [];
  }
  // maping of pixels to axis
  mapVals(num, in_min, in_max, out_min, out_max) {
    return ((num - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min;
  }

  functionAlreadyExists(newExpression) {
    let foundExpression = false;
    this.functionArray.forEach(expression => {
      if (expression.title === newExpression) {
        foundExpression = true;
      }
    });
    return foundExpression;
  }

  getExpressionValues(code) {
    let coords = [];
    // resolution is the resolution for the calculated y values
    for (let x = this.xMin; x <= this.xMax; x = x + this.resolution) {
      const result = code.eval({ x: x });
      const canvasX = this.mapVals(
        x,
        this.xMin,
        this.xMax,
        0,
        this.canvas.width
      );
      const canvasY = this.mapVals(
        result,
        this.xMin,
        this.xMax,
        this.canvas.height,
        0
      );

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
    const finalexpression = this.scrubln(expression).trim();
    // console.log(finalexpression, expression);

    if (!this.functionAlreadyExists(expression)) {
      try {
        const node = math.parse(finalexpression);
        const code = node.compile();

        const coords = this.getExpressionValues(code);

        this.functionArray.push(
          new FunctionObject(expression, finalexpression, coords, code, this)
        );
        this.addFunctionDetailsDiv();
        this.drawFunctionValuesToGraph(coords);
      } catch (err) {
        console.log("input created a problem...");
        console.log(err);
      }
    }
    console.log("expression alreadu input");
  }
  drawFunctionValuesToGraph(coords) {
    for (let j = 0; j < coords.length; j++) {
      // pOff is the amount you need to add since the canvas top left is 0,0
      const px = coords[j][0];
      const py = coords[j][1];
      this.ctx.fillRect(px, py, 1, 1);
    }
  }

  addFunctionDetailsDiv() {
    const len = this.functionArray.length;
    // '<div id="' + len.toString() + '"></div>'
    const newDiv = document.createElement("p");
    newDiv.setAttribute("id", len.toString());
    if (this.device == "mobile") {
      newDiv.setAttribute("style", "height:" + (18 * 3).toString() + "px;");
    } else {
      newDiv.setAttribute("style", "height:" + (18 * 3).toString() + "px;");
    }
    document.getElementById("details").appendChild(newDiv);
  }

  // set the mouse coordinates and where the function object will draw its tangent and cursor circle
  calculate(event) {
    if (this.functionArray.length > 0) {
      const x =
        this.device == "mobile"
          ? event.touches[0].clientX
          : event.clientX - this.canvasoffset;

      const xScaled = this.mapVals(
        x,
        0,
        this.canvas.width,
        this.xMin,
        this.xMax
      ).toFixed(2);
      this.updateFunctionCursor(x, xScaled);
      this.updateGraph();
    }
  }
  /*
   * calculateTan is called upon input x, the line itself
   * is draw by the function object within its update method
   */
  calculateTan() {
    const input = document
      .getElementById("inputX")
      .value.replace("pi", Math.PI);
    const inX = parseFloat(input);

    if (inX != NaN) {
      const xOnCanvas = this.mapVals(
        inX,
        this.xMin,
        this.xMax,
        0,
        this.canvas.width
      );
      this.updateFunctionCursor(xOnCanvas, inX);
      this.updateGraph();
    }
  }
  updateFunctionCursor(x, xValue) {
    this.functionArray.forEach(expression => {
      const fx = expression.express;
      const yValue = fx.eval({ x: xValue });
      const yCursor = this.mapVals(
        yValue,
        this.xMin,
        this.xMax,
        this.canvas.height,
        0
      );
      expression.mouse = [x, yCursor];
      expression.cursor["x"] = xValue;
      expression.cursor["y"] = yValue;
    });
  }

  // updateGraph, covers canvas with black background and then
  // redraws the axis and functions.
  updateGraph() {
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = "white";
    this.setAxis();

    this.functionArray.forEach((funct, index) => {
      funct.update(index + 1);
    });
    // zoomButton.update();
  }
  // setAxis draws the x and y axis dotted lines.
  setAxis() {
    const yMidPoint = this.canvas.width / 2,
      xMidPoint = this.canvas.height / 2;
    const ymarkers = this.canvas.height / 20,
      xmarkers = this.canvas.width / 20;

    for (let n = 0; n <= this.canvas.height; n = n + ymarkers) {
      this.ctx.fillRect(yMidPoint, parseFloat(n.toFixed(2)), 1, 1);
    }
    for (let n = 0; n <= this.canvas.width; n = n + xmarkers) {
      this.ctx.fillRect(parseFloat(n.toFixed(2)), xMidPoint, 1, 1);
    }
  }
  // clear graph back to just the markers
  clearGraph() {
    this.functionArray = [];

    this.ctx.fillStyle = "black";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = "white";
    this.setAxis();

    document.getElementById("inputX").value = "";
    document.getElementById("details").innerHTML = "";
    let base_address = window.location.href.toString();
    let end_uri = base_address.indexOf("?");
    if (end_uri > -1) base_address = base_address.slice(0, end_uri);
    window.history.replaceState(null, null, base_address);
  }

  readURI() {
    let address = window.location.href;
    let uri_index = address.indexOf("?");
    if (uri_index > -1) {
      let funcElement = document.getElementById("funct");
      let goButton = document.getElementById("buttn1");

      address = address.slice(uri_index + 1);
      let components = this.parseURI(address);
      components.fns.forEach(function(el) {
        funcElement.value = el;
        goButton.click();
      });
      document.getElementById("inputX").value = components.xValue;
      document.getElementById("find-Tan").click();
    }
  }

  calculateURI() {
    const titles = this.functionArray.map(fn => fn.title);
    const xValue =
      this.functionArray.length > 0 ? this.functionArray[0].cursor.x : null;
    return encodeURIComponent(JSON.stringify({ fns: titles, xValue }));
  }

  parseURI(uri) {
    return JSON.parse(decodeURIComponent(uri));
  }

  replaceURI() {
    const uri_comp = this.calculateURI();
    window.history.replaceState(null, null, "?" + uri_comp);
  }

  setEventListeners() {
    const app = this;
    // event listner to look at where on each graph the mouse X is
    if (this.device === "mobile") {
      this.canvas.addEventListener("touchmove", function(event) {
        app.calculate(event);
      });
    } else {
      this.canvas.addEventListener("mousemove", function() {
        app.calculate(event);
      });
    }

    document.getElementById("buttn1").addEventListener("click", function() {
      app.getFunction();
    });

    document.getElementById("buttn").addEventListener("click", function() {
      app.clearGraph();
    });
    // calculate tanget line for the user input X
    document.getElementById("find-Tan").addEventListener("click", function() {
      app.calculateTan();
    });
    //adding function to url when go user adds a new function.
    document.getElementById("buttn1").addEventListener("click", function() {
      app.replaceURI();
    });
  }

  // math js cannot handle ln(x) so  remove and replace, while keeping object between ( )
  scrubln(ex) {
    if (!ex.includes("ln(")) {
      return ex;
    }
    let start = false;
    const middle = [];
    let exBefore;
    let exAfter;
    let countParens = 0;
    for (let i = 0; i < ex.length; i++) {
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
    return `${exBefore}log(${ex.slice(
      middle[0],
      middle[1]
    )}, 2.71828182846${exAfter}`;
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
    this.intersectionThreshold = 0.04;
  }
  drawCoordinateValues(coordinateArray) {
    const parentApp = this.parentApp;
    coordinateArray.forEach(coordinate => {
      parentApp.ctx.fillRect(coordinate[0], coordinate[1], 1, 1);
    });
  }
  drawYValueIndicator() {
    const app = this;
    const parentApp = this.parentApp;
    parentApp.ctx.beginPath();
    parentApp.ctx.strokeStyle = "white";

    this.parentApp.functionArray.forEach(expression => {
      if (
        expression.title !== app.title &&
        app.yValuesAreWithinThreshold(expression.cursor["y"])
      ) {
        parentApp.ctx.strokeStyle = "red";
        parentApp.ctx.fillStyle = "red";
        parentApp.ctx.font = "20px Arial";
        parentApp.ctx.fillText(
          "X : " + this.cursor["x"].toString(),
          this.mouse[0] + 20,
          this.mouse[0] - 20
        );
        parentApp.ctx.fillStyle = "white";
      }
    });
    parentApp.ctx.lineWidth = 2;
    parentApp.ctx.arc(this.mouse[0], this.mouse[1], 5, 0, 2 * Math.PI);
    parentApp.ctx.stroke();
  }
  yValuesAreWithinThreshold(otherExpressionYValue) {
    return (
      Math.abs(
        parseFloat(otherExpressionYValue) - parseFloat(this.cursor["y"])
      ) <= this.intersectionThreshold
    );
  }
  takeDerivative() {
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
    } catch (error) {
      return null;
    }
  }
  update(num) {
    const y = 0;
    this.drawCoordinateValues(this.coordinates);
    this.drawYValueIndicator();

    const derivative = this.takeDerivative();
    if (derivative == null || derivative.toString().includes("i")) {
      this.writeFunctionDetails(
        "<b> Tangent Line: </b>x coordinate out of domain.",
        num
      );
      return;
    }
    this.drawTangentLine(derivative);
    this.writeFunctionDetails(
      "<b> Tangent Line: </b>" + derivative.toString(),
      num
    );
  }

  drawTangentLine(derivative) {
    const app = this.parentApp;
    for (let x = app.xMin; x <= app.xMax; x = x + app.xMax / 10) {
      for (let y = x; y <= x + 0.1; y = y + app.resolution) {
        const scaleX = app.mapVals(y, app.xMin, app.xMax, 0, app.canvas.width);
        const yval = derivative.eval({ x: y });
        const scaleY = app.mapVals(
          yval,
          app.xMin,
          app.xMax,
          app.canvas.height,
          0
        );
        app.ctx.fillRect(scaleX, scaleY, 1, 1);
      }
    }
  }
  writeFunctionDetails(tangentLineMessage, num) {
    const text =
      `  <b>${this.title}</b> --> x: ${this.cursor[
        "x"
      ].toString()} y: ${parseFloat(this.cursor["y"]).toFixed(4)};` +
      tangentLineMessage +
      "<br><b>Derivative: </b> " +
      this.slope.toString();
    document.getElementById(num.toString()).innerHTML = text;
  }
}

const app = new App();
app.setEventListeners();
app.setAxis();
app.readURI();

// document.getElementById("map-canvas").addEventListener("onmouseleave", function() {
//     console.log("yes");
// });

/*
 * This function is called when the zoom in or zoom out buttons are clicked
 * the function iterates through each of the saved function's canvas coordinates
 * and recalculates where the points along the graph should be relative to the
 * new frame. the page starts at from -10 to 10
 */
function setNewCoords(num) {
  const newMax = xMax + num;
  const newMin = xMin + num;
  for (const j = 0; j < window.functionArray.length; j++) {
    const newCoords = [];
    const funct = window.functionArray[j];
    for (let x = newMin; x <= newMax; x = x + resolution) {
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
