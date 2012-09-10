$(document).ready(function() {
    $("#map").text("Loading map...");
    theMap = loadMap();
    loadStops();
    centerMap();
});

var blue_icon = new google.maps.MarkerImage(
    '/static/img/circle_blue.png',
    new google.maps.Size(27,22),
    // The origin for this image is 0,0.
    new google.maps.Point(0,0),
    // The anchor for this image is the base of the flagpole at 0,32.
    new google.maps.Point(14,11)
);
var green_icon = new google.maps.MarkerImage(
    '/static/img/marker_green.png'
);
var red_icon = new google.maps.MarkerImage(
    '/static/img/marker_dark_red.png'
);

/**
 * Create and show a GoogleMap in the page.
 */
var loadMap = function() {
    var mapOptions = {
        zoom: 11,
        disableDoubleClickZoom: true,
        center: new google.maps.LatLng(43.325, -2.00),
        tileSize: new google.maps.Size(256, 256),
        panControl: false,
        scaleControl: true,
        zoomControl: true,
        zoomControlOptions: {
            style: google.maps.ZoomControlStyle.SMALL
        },
        streetViewControl: false,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    var theMap = new google.maps.Map($("#map")[0], mapOptions);

    return theMap;
};

/**
 * Load into the map the Stops available in the SimpleRouting graph.
 */
var loadStops = function() {
    markers = [];
    infoWindows = [];

    for (i in geodata) {
        var stop = geodata[i];

        var stopMarker = new google.maps.Marker({
            // GoogleMaps properties
            map: theMap,
            position: new google.maps.LatLng(stop.lat, stop.lon),
            draggable: false,
            icon: blue_icon,
            // Triplaner properties
            stopId: stop.stop_id
        });

        var infoWindow = new google.maps.InfoWindow();
        var infoWindowHtml = getInfoWindowHtml(stopMarker.stopId);
        infoWindow.setContent(infoWindowHtml);
        google.maps.event.addListener(stopMarker, 'click',
            makeInfoWindowEvent(infoWindow, stopMarker));

        markers[stop.stop_id] = stopMarker;
        infoWindows[stop.stop_id] = infoWindow;
    }
};

/**
 * Adjust map's bounds and zoom to fit the list of showed stops.
 */
var centerMap = function() {
    var mapBounds = new google.maps.LatLngBounds();
    for (i in markers) {
        mapBounds.extend(markers[i].position);
    }
    theMap.fitBounds(mapBounds);
};


var makeInfoWindowEvent = function(infoWindow, marker) {
    return function() {
        if (window.lastInfowindow !== undefined) {
            lastInfowindow.close();
        }
        infoWindow.open(theMap, marker);
        lastInfowindow = infoWindow;
    };
};

/**
 * Return the InfoWindow HTML code for a given Stop.
 *
 * This InfoWindow allows to select the Stop as the origin, if not defined yet.
 * In other case allows to select the Stop as the destination.
 */
var getInfoWindowHtml = function(stopId) {
    var html = "";
    html += "<strong>Stop ID:</strong> " + stopId + "<br/>";

    // if (window.originStop === undefined) {
        html += "<button onclick='selectOriginStop(\"" + stopId + "\");'>";
        html += "Select as origin";
        html += "</button>"
    // } else {
        html += "<button onclick='selectDestinationStop(\"" + stopId + "\");'>";
        html += "Select as destination";
    // }

    html += "</button>";
    return html;
};

/**
 * Set a given Stop as the origin of the route.
 */
var selectOriginStop = function(stopId) {
    if (window.originStop !== undefined) {
        markers[originStop].setIcon(blue_icon);
    }
    markers[stopId].setIcon(green_icon);

    originStop = stopId;
    infoWindows[stopId].close();
    ejecuta();
};

/**
 * Set a given Stop as the destination of the route.
 */
var selectDestinationStop = function(stopId) {
    if (window.destinationStop !== undefined) {
        markers[destinationStop].setIcon(blue_icon);
    }
    markers[stopId].setIcon(red_icon);

    destinationStop = stopId;
    infoWindows[stopId].close();
    ejecuta();
};

var ejecuta = function() {
    if (window.originStop === undefined
        || window.destinationStop === undefined) {
        return;
    }

    var ajax_params = {origin: window.originStop,
                       destination: window.destinationStop};
    var ajax_callback = function(json) {
        if (json.result_code > 0) {
            alert(json.result_msg);
            return;
        }

        var positionArray = [];
        for (i in json.response.path) {
            positionArray[i] = markers[json.response.path[i]].position;
        }

        if (window.polyline === undefined) {
            polyline = new google.maps.Polyline({
                map: theMap,
                path: positionArray,
                strokeColor: "#F00"
            });
        } else {
            window.polyline.setPath(positionArray);
        }

    };
    $.getJSON("/route/", ajax_params, ajax_callback);
};
