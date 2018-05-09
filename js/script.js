///////////////////////////////////////////
/// CONSTANTS
///////////////////////////////////////////

var mapMoveClickConstant = 50;
var mapZoomClickConstant = 1.25;
var price = {
    whoppersMaltedMilkBalls: 1.99,
    nutella: 4.99,
    boxedWater: 2.99,
    kitkat: 3.33,
    pringles: 3.49,
    pepperidgeFarmCookies: 3.36,
    pocky: 1.5,
    skinnyPopPopcorn: 3.99
};
var img = new Image();
var minZoom = 0.1;
var maxZoom = 0.5;
var defaultZoom = 0.15;
var maxCenter = [500, 500]; //These values are almost definitely wrong. I'll correct them
var minCenter = [-500, -500]; //once I've got it working and I can test to see nice values
var dropMarkerDeltaMaxSquared = 9;
var markerDistanceSquared = 50000;
var markerRadius = 8;
var markerColor = "red"; //Can also be a rgb(red, green, blue) value or #RRGGBB, etc.
var selectedMarkerColor = "#00ff00";
var wsURL = "ws://127.0.0.1:9002";
var progressBarCurrentColor = "#33ff33";
var dropPoints = [
    [475, 600],
    [375, -975],
    [475, -200],
    [1400, 150],
    [1400, -250],
    [-500,-925],
    [-700,-1100],
    [1400, 400],
    [600,1200],
    [1400,-520],
    [600,870]
];
var dropPointsCoords = [
    [-16.86, 25.08, -1.70],
    [12.43, 23.60, 0],
    [-2.75, 24.78, -1.7],
    [-8.84, 41.75, 0.19],
    [-2.91, 42.35, 1.66],
    [10.92, 12.71, 0.18],
    [15.17, 11.18, -0.47],
    [-14.32, 40.02, 1.70],
    [-26.23, 25.86, -1.68],
    [2.02, 40.70, 1.70],
    [-21.06, 26.07, -1.68]
];

///////////////////////////////////////////
/// GLOBAL VARIABLES
///////////////////////////////////////////

var html = {}; //A list of html elements that are pulled into javascript.
var validLocationSet = false; //Whether or not the user has specified a valid location for pickup.
var userLocation = [0, 0, 0];
var itemSelected = false; //Whether or not the user has selected an item to buy.
var whichItem = null; //Which item the user has selected.
var context;
var center = [];
var mapImageLoaded = false;
var zoom = defaultZoom;
var mouseWheelCalibrationConstant = 53; //The delta value of one "notch" on my personal mouse.
var zoomStep = mapZoomClickConstant; //The factor by which it zooms for each discrete mousemove value.
var mouseLocation = [0, 0];
var oldMouseLocation = [0, 0];
var mouseCanvasCoordinates = [0, 0];
var mouseWorldCoordinates = [0, 0];
var overCanvas = false;
var keys = {};
var mouseButtons = {};
var mouseDownLocation = [0, 0];
var useWebSocket = false;
var ws;
var selectedDropPoint;
var blockScrolling = true;

///////////////////////////////////////////
/// CLASSES
///////////////////////////////////////////



///////////////////////////////////////////
/// FUNCTIONS
///////////////////////////////////////////

function setup() {
    console.log("Let's get this started!");

    html.progressBar = {};
    html.progressBar.specifyLocation = document.getElementById("progressBarSpecifyLocation");
    html.progressBar.chooseProduct = document.getElementById("progressBarChooseProduct");
    html.progressBar.pay = document.getElementById("progressBarPay");
    html.progressBar.orderStatus = document.getElementById("progressBarOrderStatus");
    html.specifyLocationContents = document.getElementById("specifyLocationContents");
    html.chooseProductContents = document.getElementById("chooseProductContents");
    html.payContents = document.getElementById("payContents");
    html.orderStatusContents = document.getElementById("orderStatusContents");
    html.paidButton = document.getElementById("paidButton");
    html.controlPanel = {};
    html.controlPanel.up = document.getElementById("controlPanelUp");
    html.controlPanel.left = document.getElementById("controlPanelLeft");
    html.controlPanel.right = document.getElementById("controlPanelRight");
    html.controlPanel.down = document.getElementById("controlPanelDown");
    html.controlPanel.in = document.getElementById("controlPanelIn");
    html.controlPanel.out = document.getElementById("controlPanelOut");
    html.confirmLocation = document.getElementById("confirmLocation");
    html.items = {};
    html.items.whoppersMaltedMilkBallsImage = document.getElementById("whoppersMaltedMilkBallsImage");
    html.items.nutellaImage = document.getElementById("nutellaImage");
    html.items.boxedWaterImage = document.getElementById("boxedWaterImage");
    html.items.pringlesImage = document.getElementById("pringlesImage");
    html.items.kitkatImage = document.getElementById("kitkatImage");
    html.items.pepperidgeFarmCookiesImage = document.getElementById("pepperidgeFarmCookiesImage");
    html.items.pockyImage = document.getElementById("pockyImage");
    html.items.skinnyPopPopcornImage = document.getElementById("skinnyPopPopcornImage");
    html.clearCart = document.getElementById("clearSelectionButton");
    html.buyTheThings = document.getElementById("confirmSelectionButton");
    html.userSelection = document.getElementById("userSelection");
    html.userPrice = document.getElementById("userPrice");
    html.buildingMap = document.getElementById("buildingMap");
    html.numOrdersBeforeYou = document.getElementById("numOrdersBeforeYou");
    html.wholeOrderStatus = document.getElementById("wholeOrderStatus");

    html.paidButton = document.getElementById("paidButton"); //This will be removed once paypal is implemented.
    html.useWebSocket = document.getElementById("useWebSocket"); //This will be removed in later iterations of the front-end

    context = html.buildingMap.getContext("2d");
    context.transform(1, 0, 0, 1, html.buildingMap.width/2, html.buildingMap.height/2); //Put the origin in the center of the canvas.
    context.transform(1, 0, 0, -1, 0, 0); //Flip it so y+ is up.

    img.src = "img/Map.jpg";
    img.addEventListener("load", function() {
        mapImageLoaded = true;
    });

    Array.from(document.getElementsByClassName("controlPanelUnavailableButton")).forEach(function(element) {
        //document.getElementsByClassName(...) returns a HTMLCollection, which an array-like object, but not actually an array.
        //Array.from(...) parses it into an array, so that we can use the forEach method.
        //Array.forEach() calls the supplied function on each element of the array, in this case, adding a click event listener to each one.
        element.addEventListener("click", function() {
            alert("Option not available at this time.");
        });
    });
    html.controlPanel.up.addEventListener("click", mapMove.bind(null, [0, -mapMoveClickConstant]));
    html.controlPanel.left.addEventListener("click", mapMove.bind(null, [-mapMoveClickConstant, 0]));
    html.controlPanel.right.addEventListener("click", mapMove.bind(null, [mapMoveClickConstant, 0]));
    html.controlPanel.down.addEventListener("click", mapMove.bind(null, [0, mapMoveClickConstant]));
    html.controlPanel.in.addEventListener("click", mapZoom.bind(null, mapZoomClickConstant));
    html.controlPanel.out.addEventListener("click", mapZoom.bind(null, 1/mapZoomClickConstant));
    html.confirmLocation.addEventListener("click", confirmLocation);
    html.items.whoppersMaltedMilkBallsImage.addEventListener("click", selectItem.bind(null, "whoppersMaltedMilkBalls"));
    html.items.nutellaImage.addEventListener("click", selectItem.bind(null, "nutella"));
    html.items.boxedWaterImage.addEventListener("click", selectItem.bind(null, "boxedWater"));
    html.items.kitkatImage.addEventListener("click", selectItem.bind(null, "kitkat"));
    html.items.pringlesImage.addEventListener("click", selectItem.bind(null, "pringles"));
    html.items.pepperidgeFarmCookiesImage.addEventListener("click", selectItem.bind(null, "pepperidgeFarmCookies"));
    html.items.pockyImage.addEventListener("click", selectItem.bind(null, "pocky"));
    html.items.skinnyPopPopcornImage.addEventListener("click", selectItem.bind(null, "skinnyPopPopcorn"));
    html.clearCart.addEventListener("click", clearCart);
    html.buyTheThings.addEventListener("click", goToCheckout);

    html.paidButton.addEventListener("click", pretendIPaid); //This will be removed once paypal is implemented.
    html.useWebSocket.addEventListener("click", function() {
        useWebSocket = true;
        setUpWebSocket();
        document.body.removeChild(document.body.childNodes[3]); //Delete the extra <br> tag
        document.body.removeChild(document.body.childNodes[1]); //Delete the <div> tag
        html.useWebSocket = null;
    }); //This will be removed in later iterations of the front-end

    document.addEventListener("wheel", function(event) { wheel(event); });
    document.addEventListener("keydown", function(event) { keydown(event); });
    document.addEventListener("keyup", function(event) { keyup(event); });
    html.buildingMap.addEventListener("mouseenter", function(event) { mouseEnterCanvas(event); });
    html.buildingMap.addEventListener("mouseleave", function(event) { mouseLeaveCanvas(event); });
    document.addEventListener("mousemove", function(event) { mouseMoved(event); });
    html.buildingMap.addEventListener("mousedown", function(event) { mousedown(event); });
    document.addEventListener("mouseup", function(event) { mouseup(event); });

    loadLocationSection();
}
function setUpWebSocket() {
    ws = new WebSocket(wsURL);
    ws.onopen = function() {
        //
    }
    ws.onmessage = function(event) {
        var msg = event.data;
        console.log(msg);
        if(msg == "valid_location") {
            loadItemsSection();
        }
        else if(msg == "item_received") {
            loadPaymentSection();
        }
        else if(msg.split(",")[0] == "payment_received") {
            var pos = Number(msg.split(",")[1]);
            loadOrderStatusSection();
            alert("Thank you! We have received your payment, and your food will be delivered soon.\n" +
                  "We need to fulfil " + String(pos-1) + " order" + (pos == 2 ? "" : "s") + ", and then we will deliver yours.");
            if(pos <= 1) {
                html.wholeOrderStatus.innerHTML = "Your delievery is on its way!";
            }
            else {
                html.numOrdersBeforeYou.innerHTML = Number(msg.split(",")[1]) - 1;
            }
        }
        else if(msg.split(",")[0] == "update_queue_position") {
            var pos = Number(msg.split(",")[1]);
            if(pos <= 1) {
                html.wholeOrderStatus.innerHTML = "Your delievery is on its way!";
            }
            else {
                html.numOrdersBeforeYou.innerHTML = Number(msg.split(",")[1]) - 1;
            }
        }
        else if(msg == "delivery_complete") {
            html.wholeOrderStatus.innerHTML = "Your order has been completed. Thank you!";
            alert("Your order has been completed. Thank you!");
            html.progressBar.orderStatus.style.backgroundColor = null;
        }
    }
    ws.onclose = function() {
        //
    }
}
function keydown(event) {
    //
    keys[String(event.which)] = true;
}
function keyup(event) {
    //
    keys[String(event.which)] = false;
}
function mousedown(event) {
    mouseDownLocation = mouseWorldCoordinates.slice();
    mouseButtons[String(event.which)] = true;
}
function mouseup(event) {
    if(Math.pow(mouseDownLocation[0]-mouseWorldCoordinates[0], 2)+Math.pow(mouseDownLocation[1]-mouseWorldCoordinates[1], 2) < dropMarkerDeltaMaxSquared) {
        selectMarker();
    }
    mouseButtons[String(event.which)] = false;
}
function distanceSquared(a, b) {
    //
    return Math.pow(a[0]-b[0], 2)+Math.pow(a[1]-b[1], 2);
}
function selectMarker() {
    var minMarkerIndex = -1;
    var minMarkerDistanceSquared = Infinity;
    var mouseActualCoordinates = mouseWorldCoordinates.slice();
    mouseActualCoordinates[0] -= center[0];
    mouseActualCoordinates[1] += center[1];
    for(var i=0; i<dropPoints.length; ++i) {
        var d = distanceSquared(mouseActualCoordinates, dropPoints[i]);
        if(d < minMarkerDistanceSquared) {
            minMarkerDistanceSquared = d;
            minMarkerIndex = i;
        }
    }
    console.log(minMarkerDistanceSquared);
    if(minMarkerDistanceSquared > markerDistanceSquared) {
        return;
    }

    clearCanvas();
    drawMap();

    context.beginPath();
    context.arc((center[0]+dropPoints[minMarkerIndex][0])*zoom, (center[1]-dropPoints[minMarkerIndex][1])*zoom, markerRadius, 0, 2*Math.PI);
    context.fillStyle = selectedMarkerColor;
    context.fill();

    userLocation = dropPointsCoords[minMarkerIndex].slice();
    selectedDropPoint = minMarkerIndex;
    validLocationSet = true;
}
function mouseEnterCanvas(e) {
    //
    overCanvas = true;
}
function mouseLeaveCanvas(e) {
    //
    overCanvas = false;
}
function mapMove(amount) {
    console.log("Pan motion: " + amount[0] + "," + amount[1]);
    center[0] += amount[0];
    center[1] += amount[1];
    if(center[0] >= maxCenter[0] || center[0] <= minCenter[0]) {
        center[0] -= amount[0];
    }
    if(center[1] >= maxCenter[1] || center[1] <= minCenter[1]) {
        center[1] -= amount[1];
    }

    clearCanvas();
    drawMap();
}
function mapZoom(amount) {
    console.log("Zoom motion: " + amount + " Zoom before change: " + zoom + " Expected new zoom: " + zoom * amount);
    zoom *= amount;
    if(zoom >= maxZoom || zoom <= minZoom) {
        zoom /= amount;
    }
    clearCanvas();
    drawMap();
}
function wheel(e) {
    if(blockScrolling) {
        e.preventDefault();
        e.returnValue = false;
        console.log(e.deltaY);
        var val;
        if(e.deltaY > 0) {
            val = 1/zoomStep;
        }
        else if(e.deltaY < 0) {
            val = zoomStep;
        }
        else {
            return;
        }
        mapZoom(val);
    }
}
function mouseMoved(event) {
    mouseLocation[0] = event.clientX;
    mouseLocation[1] = event.clientY;

    mouseCanvasCoordinates[0] = ((event.clientX - html.buildingMap.offsetLeft) - (html.buildingMap.width/2));
    mouseCanvasCoordinates[1] = ((html.buildingMap.height/2) - (event.clientY - html.buildingMap.offsetTop));

    mouseWorldCoordinates[0] = mouseCanvasCoordinates[0] / zoom;
    mouseWorldCoordinates[1] = mouseCanvasCoordinates[1] / zoom;

    if(oldMouseLocation.length == 0) {
        for(var i=0; i<mouseLocation.length; ++i) {
            oldMouseLocation[i] = mouseLocation[i];
        }
    }

    var delta = [mouseLocation[0]-oldMouseLocation[0], oldMouseLocation[1]-mouseLocation[1]];
    for(var i=0; i<delta.length; ++i) {
        delta[i] /= zoom;
    }
    //console.log(delta);

    currentlyPanning = mouseButtons["1"] && overCanvas;

    if(currentlyPanning) {
        mapMove([delta[0], -1*delta[1]]);
    }

    for(var i=0; i<mouseLocation.length; ++i) {
        oldMouseLocation[i] = mouseLocation[i];
    }
}
function loadLocationSection() {
    //Load the page section where you select your location.
    html.specifyLocationContents.style.display = "initial";    html.progressBar.specifyLocation.style.backgroundColor = progressBarCurrentColor;
    html.chooseProductContents.style.display = "none";         html.progressBar.chooseProduct.style.backgroundColor = null;
    html.payContents.style.display = "none";                   html.progressBar.pay.style.backgroundColor = null;
    html.orderStatusContents.style.display = "none";           html.progressBar.orderStatus.style.backgroundColor = null;

    clearCanvas();
    center = [0, 0];
    drawMap();
}
function clearCanvas() {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, html.buildingMap.width, html.buildingMap.height);
    context.transform(1, 0, 0, 1, html.buildingMap.width/2, html.buildingMap.height/2); //Put the origin in the center of the canvas.
}
function drawMap() {
    if(mapImageLoaded) {
        context.drawImage(img, (center[0]-img.naturalWidth/2)*zoom, (center[1]-img.naturalHeight/2)*zoom, img.naturalWidth*zoom, img.naturalHeight*zoom);
        drawDropPoints();
    }
    else {
        window.setTimeout(drawMap, 100);
    }
}
function drawDropPoints() {
    for(var i=0; i<dropPoints.length; ++i) {
        context.beginPath();
        context.arc((center[0]+dropPoints[i][0])*zoom, (center[1]-dropPoints[i][1])*zoom, markerRadius, 0, 2*Math.PI);
        context.fillStyle = markerColor;
        context.fill();
    }
}
function loadItemsSection() {
    //Load the page section where you choose your items.
    html.specifyLocationContents.style.display = "none";     html.progressBar.specifyLocation.style.backgroundColor = null;
    html.chooseProductContents.style.display = "initial";    html.progressBar.chooseProduct.style.backgroundColor = progressBarCurrentColor;
    html.payContents.style.display = "none";                 html.progressBar.pay.style.backgroundColor = null;
    html.orderStatusContents.style.display = "none";         html.progressBar.orderStatus.style.backgroundColor = null;

    blockScrolling = false;
}
function loadPaymentSection() {
    //Load the page section where you pay
    html.specifyLocationContents.style.display = "none";    html.progressBar.specifyLocation.style.backgroundColor = null;
    html.chooseProductContents.style.display = "none";      html.progressBar.chooseProduct.style.backgroundColor = null;
    html.payContents.style.display = "initial";             html.progressBar.pay.style.backgroundColor = progressBarCurrentColor;
    html.orderStatusContents.style.display = "none";        html.progressBar.orderStatus.style.backgroundColor = null;
}
function loadOrderStatusSection() {
    //Load the page section where you watch your order status.
    html.specifyLocationContents.style.display = "none";    html.progressBar.specifyLocation.style.backgroundColor = null;
    html.chooseProductContents.style.display = "none";      html.progressBar.chooseProduct.style.backgroundColor = null;
    html.payContents.style.display = "none";                html.progressBar.pay.style.backgroundColor = null;
    html.orderStatusContents.style.display = "initial";     html.progressBar.orderStatus.style.backgroundColor = progressBarCurrentColor;
}
function confirmLocation() {
    if(useWebSocket) {
        if(validLocationSet) {
            console.log("User requests delivery at (" + userLocation[0] + ", " + userLocation[1] + ", " + userLocation[2] + ")");
            ws.send("check_location\n" + userLocation[0] + "," + userLocation[1] + "," + userLocation[2]);
        }
        else {
            alert("Please select a valid location!");
        }
    }
    else {
        if(validLocationSet) {
            console.log("User requests delivery at (" + userLocation[0] + ", " + userLocation[1] + ", " + userLocation[2] + ")");
            loadItemsSection();
        }
        else {
            alert("Please select a valid location!");
        }
    }
}
function selectItem(item) {
    itemSelected = true;
    whichItem = item;
    html.userSelection.innerHTML = item;
    html.userPrice.innerHTML = "$" + price[item];
}
function clearCart() {
    itemSelected = false;
    whichItem = null;
    html.userSelection.innerHTML = "None";
    html.userPrice.innerHTML = "$0.00";
}
function goToCheckout() {
    if(useWebSocket) {
        if(itemSelected) {
            console.log("User is buying " + whichItem);
            console.log("Price: $" + price[whichItem]);
            ws.send("select_item\n" + whichItem);
        }
        else {
            alert("Please select an item you wish to buy.");
        }
    }
    else {
        if(itemSelected) {
            console.log("User is buying " + whichItem);
            console.log("Price: $" + price[whichItem]);
            loadPaymentSection();
        }
        else {
            alert("Please select an item you wish to buy.");
        }
    }
}
function pretendIPaid() {
    if(useWebSocket) {
        ws.send("payment");
    }
    else {
        loadOrderStatusSection();
    }
}

///////////////////////////////////////////
/// EXECUTED CODE
///////////////////////////////////////////

setup();