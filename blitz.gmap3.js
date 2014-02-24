/*****************************************
 *
 * Function BlitzMap()
 * This function initializes the BlitzMap
 *
 *****************************************/
var BlitzMap = new function(){
    var mapObj, mapOptions,  drwManager, infWindow, currentMapIndex;
    var mapOverlays = new Array();
    var isEditable = false;
    var notifyErrors = true;
    var mapContainerId, sideBar, mapDiv, mapStorageId;
    var dirRenderer;
    var dirService;

    /*****************************************
     *
     * Function Init()
     * This function initializes the BlitzMap
     *
     *****************************************/
    this.init = function() {


        var mapOptions = {
            center: new google.maps.LatLng( -31.39893, -64.182129 ),
            zoom: 4,
            mapTypeId: google.maps.MapTypeId.HYBRID
        };

        //create a common infoWindow object
        infWindow = new google.maps.InfoWindow();

        if( isEditable ){
            //initialize a common Drawing Manager object
            //we will use only one Drawing Manager
            drwManager = new google.maps.drawing.DrawingManager({
                drawingControl: true,
                drawingControlOptions: {
                    position: google.maps.ControlPosition.TOP_CENTER,
                    drawingModes: [
                        google.maps.drawing.OverlayType.POLYGON,
                    ]
                },
                polygonOptions: { editable: true }             // polygons created are editable by default
            });
        }


        if( mapDiv ){
            mapObj = new google.maps.Map( mapDiv, mapOptions );

            infWindow.setMap( mapObj );
            if( isEditable ){
                drwManager.setMap( mapObj );
                google.maps.event.addListener( infWindow, "domready", pickColor );
                google.maps.event.addListener( drwManager, "overlaycomplete", overlayDone );

            }

            if( mapStorageId ){
                //mapData is passed in a HTML input as JSON string
                //create overlays using that data
                setMapData( document.getElementById( mapStorageId ).value  );
            }

            //var ctaLayer = new google.maps.KmlLayer('http://possible.in/test3.kml');
            //ctaLayer.setMap(mapObj);
            dirRenderer = new google.maps.DirectionsRenderer();
            dirRenderer.setMap( mapObj );
            dirRenderer.setPanel( document.getElementById( mapContainerId + '_directions' ) );
            dirService = new google.maps.DirectionsService();
            dirTravelMode = google.maps.TravelMode.DRIVING;
            dirAvoidHighways = false;
            dirAvoidTolls = false;
            dirProvideRouteAlternatives = true;
            dirRouteUnit = google.maps.UnitSystem.METRIC;
            dirOptimizeWaypoints = true;
        }



    }



    /**************************************************
     * function setMap()
     * parameters:
     *              divId   : String, Id of HTML DIV element in which the gMap will be created
     *              edit    : Boolean(optional:default=false), tells you if the map objects can be edited or not
     *              inputId : String(optional), Id of HTML element which will be used to store/pass the serialized MAP data
     *
     **************************************************/
    this.setMap = function( divId, edit, inputId ){

        if( typeof divId == "string" ){
            if( document.getElementById( divId ) ){
                mapContainerId = divId;
                mapDiv = document.createElement('div');
                mapDiv.id = divId + "_map";
                setStyle( mapDiv, { height: "100%", width: "100%", position:"absolute", "zIndex":1, left:"0" } );

                document.getElementById( mapContainerId ).innerHTML = '';
                document.getElementById( mapContainerId ).appendChild( mapDiv );

                sideBar = document.createElement('div');
                sideBar.id = divId + "_sidebar";
                setStyle( sideBar, { height: "100%", width: "250px", display:"none", "backgroundColor":"#e6e6e6", "borderLeft":"5px solid #999", position:"absolute", "zIndex":"1", right:"0", fontFamily:"Arial", overflowY:'auto' } );

                document.getElementById( mapContainerId ).appendChild( sideBar );
                setStyle( document.getElementById( mapContainerId ), { position:"relative" } );
                sideBar.innerHTML =
                    '<div style="padding:10px 0 0 26px;">'
                        + '<style> div#'+ sideBar.id +' a.travelMode{ height:37px;width:32px;display:block;float:left;margin:0; background-position:bottom;background-repeat:no-repeat;outline:0;}'
                        + ' div#'+ sideBar.id +' a.travelMode:hover{ cursor:pointer; background-position:top;}'
                        + ' div#'+ sideBar.id +' span.route_row_menu{ font-size:12px;font-family:Arial; color:#ff0000; cursor:pointer; } '
                        + ' div#'+ mapContainerId + '_route div.route_row span{ width:20px;height:20px;display:inline-block; text-align:center; } '
                        + ' div#'+ mapContainerId + '_route_options{ font-size:12px; } '
                        + ' div#'+ mapContainerId + '_directions{ font-size:12px; }'
                        + '</style>'
                        + '<a id="'+ mapContainerId + '_mode_drive" href="javascript:void(0)" class="travelMode" style="background-image:url(images/car.png);background-position:top;" onclick="BlitzMap.setTravelMode( google.maps.TravelMode.DRIVING, this )" ></a>'
                        + '<a id="'+ mapContainerId + '_mode_walk" href="javascript:void(0)" class="travelMode" style="background-image:url(images/walk.png);" onclick="BlitzMap.setTravelMode( google.maps.TravelMode.WALKING, this)"></a>'
                        + '<a id="'+ mapContainerId + '_mode_bicycle" href="javascript:void(0)" class="travelMode" style="background-image:url(images/bicycle.png);" onclick="BlitzMap.setTravelMode( google.maps.TravelMode.BICYCLING, this )"></a>'
                        //+ '<a id="'+divId + '_mode_public" href="javascript:void(0)" class="travelMode" style="background-image:url(images/public.png);" onclick="BlitzMap.setTravelMode( google.maps.TravelMode.PUBLIC, this )"></a>'
                        + '<div style="clear:both;"></div>'
                        + '</div>'
                        + '<div id="'+ mapContainerId + '_route" style="margin:5px 5px 5px;">'
                        + '<div id="'+ mapContainerId + '_route_row_0" class="route_row"><span id="'+mapContainerId+'_route_row_0_title">A</span> <input  id="'+mapContainerId+'_route_row_0_dest" type="text" /><img id="'+mapContainerId+'_route_row_0_remove" alt="X" height="20" width="20" onclick="BlitzMap.removeDestination(this)" style="cursor:pointer;display:none;" /></div>'
                        + '<div id="'+ mapContainerId + '_route_row_1" class="route_row"><span id="'+mapContainerId+'_route_row_1_title">B</span> <input  id="'+mapContainerId+'_route_row_1_dest" type="text" /><img id="'+mapContainerId+'_route_row_1_remove" alt="X" height="20" width="20" onclick="BlitzMap.removeDestination(this)" style="cursor:pointer;display:none;" /></div>'
                        + '</div>'
                        + '<div id="'+ mapContainerId + '_route_menu" style="margin:5px 5px 5px 30px;">'
                        + '<span class="route_row_menu" onclick="BlitzMap.addDestination()">Add destination</span> - '
                        + '<span id="'+ mapContainerId + '_route_opt_btn" class="route_row_menu" onclick="BlitzMap.toggleRouteOptions()">Show Options</span>'
                        + '</div>'
                        + '<div id="'+ mapContainerId + '_route_options" style="margin:5px 5px;display:none;">'
                        + '<div style="float:right">'
                        + '<span id="'+ mapContainerId + '_route_unit_km" onclick="BlitzMap.setRouteUnit( google.maps.UnitSystem.METRIC )">Km</span> / '
                        + '<span id="'+ mapContainerId + '_route_unit_mi" class="route_row_menu"  onclick="BlitzMap.setRouteUnit( google.maps.UnitSystem.IMPERIAL )">Miles</span>'
                        + '</div>'
                        + '<div style="margin-left:20px">'
                        + '<input id="'+ mapContainerId + '_route_avoid_hw" type="checkbox" value="avoidHighways" onclick="BlitzMap.setAvoidHighways(this)" /><label for="'+ mapContainerId + '_route_avoid_hw">Avoid highways</label><br/>'
                        + '<input id="'+ mapContainerId + '_route_avoid_toll" type="checkbox" value="avoidTolls" onclick="BlitzMap.setAvoidTolls(this)" /><label for="'+ mapContainerId + '_route_avoid_toll">Avoid tolls</label> '
                        + '</div>'
                        + '</div>'
                        + '<div style="margin:0 0 10px 30px">'
                        + '<input type="button" onclick="BlitzMap.getRoute()" value="Get Directions">'
                        + '</div>'
                        + '<div style="clear:both;"></div>'
                        + '<div id="'+ mapContainerId + '_directions" style="">'
                        + '</div>';
            }else{
                notify( "BlitzMap Error: The DIV id you supplied for generating GMap is not present in the document." );
            }
        }else{
            notify( "BlitzMap Error: The DIV id you supplied for generating GMap is invalid. It should be a string representing the Id of Div element in which you want to create the map." )
        }

        if( edit == true ){
            isEditable = true;
        } else {
            isEditable = false;
        }

        if( typeof inputId == "string" ){

            if( document.getElementById( inputId ) ){
                mapStorageId = inputId;

            }else{
                notify( "BlitzMap Error: The INPUT id you supplied for storing the JSON string is not present in the document." );
            }
        }
    }


    function overlayDone( event ) {
        var uniqueid =  uniqid();
        event.overlay.uniqueid =  uniqueid;
        event.overlay.id = 0;
        event.overlay.type = event.type;
        mapOverlays.push( event.overlay );
        AttachClickListener( event.overlay );
        openInfowindow( event.overlay, getShapeCenter( event.overlay ), getCustomEditorContent( event.overlay ) );
    }


    function getShapeCenter( shape ){
        if( shape.type == "marker" ){
            return shape.position;
        }else if( shape.type == "circle" ){
            return shape.getCenter();
        }else if( shape.type == "rectangle" ){
            return new google.maps.LatLng( (shape.getBounds().getSouthWest().lat() + shape.getBounds().getNorthEast().lat() )/2, (shape.getBounds().getSouthWest().lng() + shape.getBounds().getNorthEast().lng() )/2 )
        }else if( shape.type == "polygon" ){
            return shape.getPaths().getAt(0).getAt(0);
        }else if( shape.type == "polyline" ){
            return shape.getPath().getAt( Math.round( shape.getPath().getLength()/3 ) );
        }
    }

    function AttachClickListener( overlay ){
        google.maps.event.addListener( overlay, "click", function(clkEvent){

            if( isEditable ){
                var infContent =      getCustomEditorContent( overlay );

            }else{
                var infContent = GetContent( overlay );
            }

            openInfowindow( overlay, clkEvent.latLng, infContent );

        } ) ;
    }

    function GetContent( overlay ){
        var selectList = document.getElementById("BlitzMapInfoWindow_id");
        var optValue = selectList.options[overlay.id].text;
        
        var content =
            '<div><h3>'+optValue+'</h3>' + GetInfoWindowFooter( overlay );
        return content;
    }

    function GetInfoWindowFooter( overlay ){
        return '';
    }

    function openInfowindow( overlay, latLng, content ){
        var div = document.createElement('div');
        div.innerHTML = content;
        setStyle( div, {height: "100%"} );
        infWindow.setContent( div );
        infWindow.setPosition( latLng );
        infWindow.relatedOverlay = overlay;
        var t = overlay.get( 'fillColor' );
        infWindow.open( mapObj );
    }

    function getCustomEditorContent( overlay ){
        
        var selectObj = document.getElementById("BlitzMapInfoWindow_id");
        resetOptions(selectObj);
        selectObj.options[overlay.id].selected = true;
        selectObj.options[overlay.id].setAttribute('selected','true');
        
        var content = document.getElementById('infoWinContainer').innerHTML;

        return content;
    }
    
    function resetOptions( sel ) {
        for (var i=0; i<sel.length; i++) {
            sel.options[i].removeAttribute('selected');
        }
    }

    function pickColor(){
        if( document.getElementById('BlitzMapInfoWindow_fillcolor') ){
            var bgcolor = new jscolor.color(document.getElementById('BlitzMapInfoWindow_fillcolor'), {})
        }
        if( document.getElementById('BlitzMapInfoWindow_strokecolor') ){
            var bdColor = new jscolor.color(document.getElementById('BlitzMapInfoWindow_strokecolor'), {})
        }
    }

    this.deleteOverlay = function(){
        infWindow.relatedOverlay.setMap( null );
        infWindow.close();
    }

    this.closeInfoWindow = function(){
        this.updateOverlay();
        infWindow.close();
    }
    
    this.cancelInfoWindow = function(){
        infWindow.close();
    }

    this.updateOverlay = function(){
        infWindow.relatedOverlay.id = document.getElementById( 'BlitzMapInfoWindow_id' ).value;
    }

    function notify ( msg ){
        if( notifyErrors ){
            alert( msg );
        }
    }

    function uniqid(){
        var newDate = new Date;
        return newDate.getTime();
    }

    function setMapData( jsonString ){
        if( jsonString.length == 0 ){
            return false;
        }
        var inputData = JSON.parse( jsonString );
        if( inputData.zoom ){
            mapObj.setZoom( inputData.zoom );
        }else{
            mapObj.setZoom( 10 );
        }

        if( inputData.tilt ){
            mapObj.setTilt( inputData.tilt );
        }else{
            mapObj.setTilt( 0 );
        }

        if( inputData.mapTypeId ){
            mapObj.setMapTypeId( inputData.mapTypeId );
        }else{
            mapObj.setMapTypeId( "hybrid" );
        }

        if( inputData.center ){
            mapObj.setCenter( new google.maps.LatLng( inputData.center.lat, inputData.center.lng ) );
        }else{
            mapObj.setCenter( new google.maps.LatLng( 19.006295, 73.309021 ) );
        }



        var tmpOverlay, ovrOptions;
        var properties = new Array( 'fillColor', 'fillOpacity', 'strokeColor', 'strokeOpacity','strokeWeight', 'icon');
        for( var m = inputData.overlays.length-1; m >= 0; m-- ){
            ovrOptions = new Object();

            for( var x=properties.length; x>=0; x-- ){
                if( inputData.overlays[m][ properties[x] ] ){
                    ovrOptions[ properties[x] ] = inputData.overlays[m][ properties[x] ];
                }
            }


            if( inputData.overlays[m].type == "polygon" ){

                var tmpPaths = new Array();
                for( var n=0; n < inputData.overlays[m].paths.length; n++ ){

                    var tmpPath = new Array();
                    for( var p=0; p < inputData.overlays[m].paths[n].length; p++ ){
                        tmpPath.push(  new google.maps.LatLng( inputData.overlays[m].paths[n][p].lat, inputData.overlays[m].paths[n][p].lng ) );
                    }
                    tmpPaths.push( tmpPath );
                }
                ovrOptions.paths = tmpPaths;
                tmpOverlay = new google.maps.Polygon( ovrOptions );

            }else if( inputData.overlays[m].type == "polyline" ){

                var tmpPath = new Array();
                for( var p=0; p < inputData.overlays[m].path.length; p++ ){
                    tmpPath.push(  new google.maps.LatLng( inputData.overlays[m].path[p].lat, inputData.overlays[m].path[p].lng ) );
                }
                ovrOptions.path = tmpPath;
                tmpOverlay = new google.maps.Polyline( ovrOptions );

            }else if( inputData.overlays[m].type == "rectangle" ){
                var tmpBounds = new google.maps.LatLngBounds(
                    new google.maps.LatLng( inputData.overlays[m].bounds.sw.lat, inputData.overlays[m].bounds.sw.lng ),
                    new google.maps.LatLng( inputData.overlays[m].bounds.ne.lat, inputData.overlays[m].bounds.ne.lng ) );
                ovrOptions.bounds = tmpBounds;
                tmpOverlay = new google.maps.Rectangle( ovrOptions );

            }else if( inputData.overlays[m].type == "circle" ){
                var cntr = new google.maps.LatLng( inputData.overlays[m].center.lat, inputData.overlays[m].center.lng );
                ovrOptions.center = cntr;
                ovrOptions.radius = inputData.overlays[m].radius;
                tmpOverlay = new google.maps.Circle( ovrOptions );

            }else if( inputData.overlays[m].type == "marker" ){
                var pos = new google.maps.LatLng( inputData.overlays[m].position.lat, inputData.overlays[m].position.lng );
                ovrOptions.position = pos;
                if( inputData.overlays[m].icon ){
                    ovrOptions.icon = inputData.overlays[m].icon ;
                }
                if( isEditable ){
                    ovrOptions.draggable =true;
                }
                tmpOverlay = new google.maps.Marker( ovrOptions );

            }
            tmpOverlay.type = inputData.overlays[m].type;
            tmpOverlay.setMap( mapObj );
            if( isEditable && inputData.overlays[m].type != "marker"){
                tmpOverlay.setEditable( true );

            }

            var uniqueid =  uniqid();
            tmpOverlay.uniqueid =  uniqueid;
            
            if( inputData.overlays[m].id ){
                tmpOverlay.id = inputData.overlays[m].id;
            }else{
                tmpOverlay.id = 0;
            }

            //attach the click listener to the overlay
            AttachClickListener( tmpOverlay );

            //save the overlay in the array
            mapOverlays.push( tmpOverlay );

        }

    }

    this.setEditable = function(editable){
        isEditable = editable;
        for( var i=0; i < mapOverlays.length; i++ ){
            if( mapOverlays[i].getMap() != null ){
                mapOverlays[i].setOptions({editable:isEditable});
            }
        }
    }

    this.toggleEditable = function(){
        isEditable = !isEditable;
        for( var i=0; i < mapOverlays.length; i++ ){
            if( mapOverlays[i].getMap() != null ){
                if (mapOverlays[i].setEditable) mapOverlays[i].setEditable(isEditable);;
            }
        }
    }

    this.deleteAll = function() {
        for( var i=0; i < mapOverlays.length; i++ ){
            mapOverlays[i].setMap(null)
        }
        mapOverlays = [];
    }

    function mapToObject(){
        var tmpMap = new Object;
        var tmpOverlay, paths;
        tmpMap.zoom = mapObj.getZoom();
        tmpMap.tilt = mapObj.getTilt();
        tmpMap.mapTypeId = mapObj.getMapTypeId();
        tmpMap.center = { lat: mapObj.getCenter().lat(), lng: mapObj.getCenter().lng() };
        tmpMap.overlays = new Array();

        for( var i=0; i < mapOverlays.length; i++ ){
            if( mapOverlays[i].getMap() == null ){
                continue;
            }
            tmpOverlay = new Object;
            tmpOverlay.type = mapOverlays[i].type;
            tmpOverlay.id = mapOverlays[i].id;

            if( mapOverlays[i].fillColor ){
                tmpOverlay.fillColor = mapOverlays[i].fillColor;
            }

            if( mapOverlays[i].fillOpacity ){
                tmpOverlay.fillOpacity = mapOverlays[i].fillOpacity;
            }

            if( mapOverlays[i].strokeColor ){
                tmpOverlay.strokeColor = mapOverlays[i].strokeColor;
            }

            if( mapOverlays[i].strokeOpacity ){
                tmpOverlay.strokeOpacity = mapOverlays[i].strokeOpacity;
            }

            if( mapOverlays[i].strokeWeight ){
                tmpOverlay.strokeWeight = mapOverlays[i].strokeWeight;
            }

            if( mapOverlays[i].icon ){
                tmpOverlay.icon = mapOverlays[i].icon;
            }

            if( mapOverlays[i].flat ){
                tmpOverlay.flat = mapOverlays[i].flat;
            }

            if( mapOverlays[i].type == "polygon" ){
                tmpOverlay.paths = new Array();
                paths = mapOverlays[i].getPaths();
                for( var j=0; j < paths.length; j++ ){
                    tmpOverlay.paths[j] = new Array();
                    for( var k=0; k < paths.getAt(j).length; k++ ){
                        tmpOverlay.paths[j][k] = { lat: paths.getAt(j).getAt(k).lat().toString() , lng: paths.getAt(j).getAt(k).lng().toString() };
                    }
                }

            }else if( mapOverlays[i].type == "polyline" ){
                tmpOverlay.path = new Array();
                path = mapOverlays[i].getPath();
                for( var j=0; j < path.length; j++ ){
                    tmpOverlay.path[j] = { lat: path.getAt(j).lat().toString() , lng: path.getAt(j).lng().toString() };
                }

            }else if( mapOverlays[i].type == "circle" ){
                tmpOverlay.center = { lat: mapOverlays[i].getCenter().lat(), lng: mapOverlays[i].getCenter().lng() };
                tmpOverlay.radius = mapOverlays[i].radius;
            }else if( mapOverlays[i].type == "rectangle" ){
                tmpOverlay.bounds = {  sw: {lat: mapOverlays[i].getBounds().getSouthWest().lat(), lng: mapOverlays[i].getBounds().getSouthWest().lng()},
                    ne:     {lat: mapOverlays[i].getBounds().getNorthEast().lat(), lng: mapOverlays[i].getBounds().getNorthEast().lng()}
                };
            }else if( mapOverlays[i].type == "marker" ){
                tmpOverlay.position = { lat: mapOverlays[i].getPosition().lat(), lng: mapOverlays[i].getPosition().lng() };
            }
            tmpMap.overlays.push( tmpOverlay );
        }

        return tmpMap;

    }

    this.toJSONString = function(){
        var result = JSON.stringify( mapToObject() );

        if( mapStorageId ){
            document.getElementById( mapStorageId ).value =  result;
        }

        return result;
    }

    function getStyle( elem, prop ){

        if( document.defaultView && document.defaultView.getComputedStyle ){
            return document.defaultView.getComputedStyle(elem, null).getPropertyValue(prop);
        }else if( elem.currentStyle ){
            var ar = prop.match(/\w[^-]*/g);
            var s = ar[0];
            for(var i = 1; i < ar.length; ++i){
                s += ar[i].replace(/\w/, ar[i].charAt(0).toUpperCase());
            }
            return elem.currentStyle[s];
        }else{
            return 0;
        }
    }

    function setStyle( domElem, styleObj ){

        if( typeof styleObj == "object" ){
            for( var prop in styleObj ){
                domElem.style[ prop ] = styleObj[ prop ];
            }
        }
    }
}

// google.maps.event.addDomListener(window, "load", BlitzMap.init);
