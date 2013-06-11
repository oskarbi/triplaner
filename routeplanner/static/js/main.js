/**
 * Class that encapsulates all the functionality of Triplaner.
 */

var TRIPLANER = function() {

    var icon_mini_blue = '/static/img/mm_20_blue.png';
    var icon_mini_green = '/static/img/mm_20_green.png';
    var icon_mini_red = '/static/img/mm_20_red.png';
    var icon_mini_yellow = '/static/img/mm_20_yellow.png';
    var icon_mini_transparent_blue = '/static/img/mm_20_blue_trans.png';

    var init = function() {
        $("#map").text("Loading map...");
        theMap = loadMap();
        loadStops();
        centerMap();
    }

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
            scaleControl: false,
            zoomControl: true,
            zoomControlOptions: {
                style: google.maps.ZoomControlStyle.SMALL
            },
            streetViewControl: false,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        var theMap = new google.maps.Map($("#map")[0], mapOptions);

        google.maps.event.addListener(theMap, 'click', function() {
            if (window.openedInfoWindow !== undefined) {
                openedInfoWindow.close();
            }
        });
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
                icon: icon_mini_blue,
                // Triplaner properties
                stopId: stop.stop_id,
                stopName: stop.stop_name
            });

            var infoWindow = new google.maps.InfoWindow();
            var infoWindowHtml = getInfoWindowHtml(stopMarker.stopId,
                                                   stopMarker.stopName);
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
            if (window.openedInfoWindow !== undefined) {
                openedInfoWindow.close();
            }
            infoWindow.open(theMap, marker);
            openedInfoWindow = infoWindow;
        };
    };

    /**
     * Return the InfoWindow HTML code for a given Stop.
     *
     * This InfoWindow allows to select the Stop as the origin, if not defined yet.
     * In other case allows to select the Stop as the destination.
     */
    var getInfoWindowHtml = function(stopId, stopName) {
        var html = "";
        html += "<strong>Stop " + stopId + ":</strong> " + stopName + "<br/><br/>";

        html += "<button onclick='TRIPLANER.selectOriginStop(\"" + stopId + "\");'>";
        html += "Select as origin";
        html += "</button>"
        html += "<button onclick='TRIPLANER.selectDestinationStop(\"" + stopId + "\");'>";
        html += "Select as destination";
        html += "</button>";
        html += "<br/>";
        html += "<button onclick='TRIPLANER.showConnectedStops(\"" + stopId + "\");'>";
        html += "Show connected stops";
        html += "</button>"

        return html;
    };

    /**
     * Set a given Stop as the origin of the route.
     */
    var selectOriginStop = function(stopId) {
        if (window.originStop !== undefined) {
            markers[window.originStop].setIcon(icon_mini_blue);
        }
        markers[stopId].setIcon(icon_mini_green);

        window.originStop = stopId;
        infoWindows[stopId].close();
        calculateTrip();
    };

    /**
     * Set a given Stop as the destination of the route.
     */
    var selectDestinationStop = function(stopId) {
        if (window.destinationStop !== undefined) {
            markers[window.destinationStop].setIcon(icon_mini_blue);
        }
        markers[stopId].setIcon(icon_mini_red);

        window.destinationStop = stopId;
        infoWindows[stopId].close();
        calculateTrip();
    };

    /**
     * Change the icon of of a given marker to a yellow one after timeToDrop
     * miliseconds.
     * The change is made with a DROP animation.
     */
    var dropYellowMarker = function(marker, timeToDrop) {
        setTimeout(function() {
            marker.setAnimation(google.maps.Animation.DROP);
            marker.setIcon(icon_mini_yellow);
            }, timeToDrop);
    }

    /**
     * Ask the python Router to calculate the shortest path between
     * the stops selected as origin and destination, and draw the result.
     */
    var calculateTrip = function() {
        if (window.originStop === undefined
            || window.destinationStop === undefined) {
            return;
        }

        var ajax_params = {origin: window.originStop,
                           destination: window.destinationStop};
        var ajax_callback = function(json) {
            if (json.result_code > 0) {
                alert(json.response);
                return;
            }

            // Make the non-included markers semitransparent
            for (stopId in markers) {
                if (stopId !== window.originStop
                    && stopId !== window.destinationStop) {
                    markers[stopId].setIcon(icon_mini_transparent_blue);
                }
            }

            var positionArray = [];
            var timeToDrop = 0;
            for (i in json.response.path) {
                var stopId = json.response.path[i];
                // Yellow icon for the stops in the path
                positionArray[i] = markers[stopId].position;

                if (stopId !== window.originStop
                    && stopId !== window.destinationStop) {
                    dropYellowMarker(markers[stopId], timeToDrop*75);
                    timeToDrop++;
                }
            }

            if (window.polyline === undefined) {
                window.polyline = new google.maps.Polyline({
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

    /**
     * Show the stops connected to a given stop_id.
     */
    var showConnectedStops = function(stop_id) {
        var ajax_params = {stop_id: stop_id};
        var ajax_callback = function(json) {
            if (json.result_code > 0) {
                alert(json.response);
                return;
            }

            // Make the non-included markers semitransparent
            for (stopId in markers) {
                if (stopId !== stop_id) {
                    markers[stopId].setIcon(icon_mini_transparent_blue);
                }
            }

            for (i in json.response.connected_stops) {
                var stopId = json.response.connected_stops[i];
                // Yellow icon for the stops in the connected_stops list
                if (stopId !== window.originStop
                    && stopId !== window.destinationStop) {
                    markers[stopId].setIcon(icon_mini_yellow);
                }
            }

            if (window.polyline !== undefined) {
                window.polyline.setMap(null);
                window.polyline = undefined;
                window.originStop = undefined;
                window.destinationStop = undefined;
            }

        };
        $.getJSON("/connected-stops/", ajax_params, ajax_callback);
    };

    return {
        init: init,
        selectOriginStop: selectOriginStop,
        selectDestinationStop: selectDestinationStop,
        showConnectedStops: showConnectedStops
    };

}();

$(document).ready(function() {
    TRIPLANER.init();
});
