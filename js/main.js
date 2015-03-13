//https://github.com/Leaflet/Leaflet.markercluster
//http://consumerinsight.which.co.uk/maps/hygiene
//


var FSA_APP = {}


L.Icon.Default.imagePath = "images/"
//Make sure we're looking in the right place for icons


$(function() {

    setCSSSize()
    createMap()

    $(window).resize(setCSSSize);

    $(".checkbox").change(function() {
        showHideLayers(this)
    })

    $("#csvselect").change(function() {
        addLayers()
    })

    //promise1 = $.get('topo_json/topo_lad.json', addGeoJson, 'json');
    //promise2 = createAuthorityLookups()
    //promise3 = addProsecutions()


    //Promise.all([]).then(showHideLayers)
    addLayers()


    // FSA_APP.map.locate({
    //     setView: true,
    //     maxZoom: 30
    // }).on("locationfound", function(e) {
    //     highlightMapCentre()
    // }).on("locationerror", function(e) {
    //     FSA_APP.map.setView([52.53, -0.09], 5);
    //     highlightMapCentre()

    // })




})

function setCSSSize() {


    $("#map").css("width", $(window).width() - 100);
    $("#map").css("height", $(window).height() - 300);



}



function addLayers(lat, lng) {

    _.each(FSA_APP.layers, function(this_layer) {
        this_layer.remove()
    })

    d3.csv("data/data/"+ $("#csvselect").val(), function(data) {

        addToMap(data, "fhrs_lat", "fhrs_lng", "fhrs")
        addToMap(data, "matched_lat", "matched_lng", "matched")

        if (_.has(data[0], "matched_address2")) {
            addToMap(data, "matched_lat2", "matched_lng2", "matched2")
        } 
  
        showHideLayers()

    });



    function addToMap(data, lat_key, lng_key, layerName) {

        var markerArray = [];

        var source = $("#popup-template").html();

        var template = Handlebars.compile(source)

        for (var i = 0; i < data.length; i++) {


            d = data[i]
            
            lat = d[lat_key]
            lng = d[lng_key]

            // if (layerName == "fhrs") {
            //     lat = (Math.random()-0.5) * 0.0002 + parseFloat(lat);
            //     lng = (Math.random()-0.5) * 0.0002 + parseFloat(lng);

            // } 
         

            template_data = {}
            template_data["fhrs_address"] = d["fhrs_address"]
            template_data["matched_address"] = d["matched_address"]

            if (_.has(d,"matched_address2")) {
                template_data["matched_address2"] = d["matched_address2"]
            }
            else {
                template_data["matched_address2"] = ""
            }

        

            



            // if (d["DPA_MATCH"] < 1) {
            //     continue
            // }

            if (typeof lat === 'undefined' || typeof lng === 'undefined') {
                continue
            };

            //Convert to numeric
            function getFillColour() {

                if (layerName == "fhrs") {
                    $("#fhrs").parent().css("color","#0693C8")
                    return "#0693C8"
                }

                if (layerName == "matched") {
                    $("#matched").parent().css("color","#58CC02")
                    return "#58CC02"
                }

                if (layerName == "matched2") {
                    $("#matched2").parent().css("color","#CE0005")
                    return "#CE0005"
                }



            }

            style = {

                "weight": 0,
                "fillColor": getFillColour(layerName),
                "fillOpacity": 1,
                "radius": 6,
                "draggable": 'true'

            };

            var m = L.circleMarker([lat, lng], style)

            var html = template(template_data)

            m.bindPopup(html, {
                "offset": L.point(0, -10)
            })

            m.on("mouseover", function() {
                this.openPopup();
                this.setStyle({
                    "weight": 4,
                    "radius": 14,
                    "fillOpacity": 1
                })
                
                list_overlapping(this)
                add_line(this)

            });
            m.on("mouseout", function() {

                this.setStyle({
                    "weight": 0,
                    "radius": 8,
                    "fillOpacity": 0.9
                })
                this.closePopup();
                remove_line()
            })
            


            m.__layerParent = layerName
            m.__fhrs_address = d["fhrs_address"] 
            m.__fhrs_lat = d["fhrs_lat"] 
            m.__fhrs_lng = d["fhrs_lng"] 


            m.__matched_address = d["matched_address"] 
            m.__matched_lat = d["matched_lat"] 
            m.__matched_lng = d["matched_lng"] 

            m.__matched_address2 = d["matched_address2"] 
            m.__matched_lat2 = d["matched_lat2"] 
            m.__matched_lng2 = d["matched_lng2"] 

            markerArray.push(m);
         
        };

        FSA_APP.layers[layerName] = L.featureGroup(markerArray).addTo(map)

        FSA_APP.map.fitBounds(FSA_APP.layers[layerName].getBounds())


    }


}

function list_overlapping(marker) {

  thisLayer = FSA_APP.layers[marker.__layerParent] 
    $("#overlapping").html("")
    _.each(thisLayer._layers, function(marker2) {
        
        latDiff = Math.abs(marker._latlng.lat - marker2._latlng.lat)
        lngDiff = Math.abs(marker._latlng.lng - marker2._latlng.lng)  

        if (Math.pow(Math.pow(latDiff,2) + Math.pow(lngDiff,2),0.5)<0.00003) {
        
        $("#overlapping").html($("#overlapping").html() + "<p>"+  marker2.__fhrs_address + "</p>")
        }
     })
   



    

   
}


var polyline
function add_line(marker) {

 


    var line = []
    var lat = (marker.__matched_lat);
    var lng = (marker.__matched_lng);
    var newLatLng = new L.LatLng(lat, lng);
    line.push(newLatLng)

    var lat = (marker.__fhrs_lat);
    var lng = (marker.__fhrs_lng);
    var newLatLng = new L.LatLng(lat, lng);
    line.push(newLatLng)

    if (_.has(marker, "__matched_lat2")) {
        var lat = (marker.__matched_lat2);
        var lng = (marker.__matched_lng2);
        var newLatLng = new L.LatLng(lat, lng);
        line.push(newLatLng)

    }

    var polyline_options = {
        color: '#000'
      };

    polyline = L.polyline(line, polyline_options).addTo(map);
    
   
}

function remove_line(){
    map.removeLayer(polyline)

}


function showHideLayers(click_object) {

    layersArr = []

    layersArr.push({
        "selector": "#fhrs",
        "layer": FSA_APP.layers.fhrs
    })

    layersArr.push({
        "selector": "#matched",
        "layer": FSA_APP.layers.matched
    })

    layersArr.push({
        "selector": "#matched2",
        "layer": FSA_APP.layers.matched2
    })




    for (var i = 0; i < layersArr.length; i++) {

        try {
            var d = layersArr[i]
            if ($(d["selector"]).is(':checked')) {

                FSA_APP.map.addLayer(d["layer"])
            } else {
                FSA_APP.map.removeLayer(d["layer"])
            }
        } catch (err) {
            console.log(err)
        }
    }


};


function createMap() {

    FSA_APP.map = L.map('map').setView([51.505, -0.09], 10);
    map = FSA_APP.map


    FSA_APP.layers = {}
    //add an OpenStreetMap tile layer


      L.tileLayer('http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
        maxZoom: 18
    }).addTo(map);

    


   


}

function highlightMapCentre() {

    var h = $("#map").height() / 2

    var w = $("#map").width() / 2

    simulateClick(w, h)




}

function simulateClick(x, y) {

    var clickEvent = document.createEvent('MouseEvents');
    clickEvent.initMouseEvent(
        'click', true, true, window, 0,
        0, 0, x, y, false, false,
        false, false, 0, null
    );
    document.elementFromPoint(x, y).dispatchEvent(clickEvent);






}