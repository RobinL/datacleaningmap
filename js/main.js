//https://github.com/Leaflet/Leaflet.markercluster
//http://consumerinsight.which.co.uk/maps/hygiene
//


var FSA_APP = {}



//Make sure we're looking in the right place for icons


$(function() {

    setCSSSize()
    createMap()

    $(window).resize(setCSSSize);

    $(".checkbox").change(function() {
        showHideLayers(this)
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


    d3.csv("data/data/alldata.csv", function(data) {

        addToMap(data, "latitude", "longitude", "original")
        addToMap(data, "DPA_lng", "DPA_lat", "DPA")
        addToMap(data, "LPI_lng", "LPI_lat", "LPI")

        showHideLayers()

    });



    function addToMap(data, lat_key, lng_key, layerName) {

        var markerArray = [];

        var source = $("#popup-template").html();

        var template = Handlebars.compile(source)

        for (var i = 0; i < data.length; i++) {


            d = data[i]
            //lat = Math.random() * 0.00002 + Number(d[lat_key])
            lat = d[lat_key]
            lng = d[lng_key]
            rating = d["ratingvalue"]
            businessname = d["businessname"]

            template_data = {}
            template_data["businessname"] = d["businessname"]
            template_data["ratingvalue"] = d["ratingvalue"]

            if (layerName == "original") {
                template_data["address"] = d["full_address"] 
                  }

            if (layerName == "DPA") {
                template_data["address"] = d["DPA_ADDRESS"]
            }

            if (layerName == "LPI") {
                template_data["address"] = d["LPI_ADDRESS"]
            }



            // if (d["DPA_MATCH"] < 1) {
            //     continue
            // }

            if (typeof lat === 'undefined' || typeof lng === 'undefined') {
                continue
            };

            //Convert to numeric
            function getFillColour(rating) {

                if (layerName == "original") {
                    $("#Original").parent().css("color","#0693C8")
                    return "#0693C8"
                }

                if (layerName == "DPA") {
                    $("#DPA").parent().css("color","#58CC02")
                    return "#58CC02"
                }

                if (layerName == "LPI") {
                    $("#LPI").parent().css("color","#CE0005")
                    return "#CE0005"
                }



            }

            style = {

                "weight": 0,
                "fillColor": getFillColour(rating, layerName),
                "fillOpacity": 0.6,
                "radius": 8,
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

            });
            m.on("mouseout", function() {

                this.setStyle({
                    "weight": 0,
                    "radius": 8,
                    "fillOpacity": 0.9
                })
                this.closePopup();
            })
            


            m.__layerParent = layerName
            m.__address = template_data["address"] 
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
        
        $("#overlapping").html($("#overlapping").html() + "<p>"+  marker2.__address + "</p>")
        }
     })
   
}


function showHideLayers(click_object) {

    layersArr = []

    layersArr.push({
        "selector": "#Original",
        "layer": FSA_APP.layers.original
    })

    layersArr.push({
        "selector": "#DPA",
        "layer": FSA_APP.layers.DPA
    })

    layersArr.push({
        "selector": "#LPI",
        "layer": FSA_APP.layers.LPI
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