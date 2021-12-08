import logo from "./logo.svg";
import "./App.css";
import React, { useCallback, useEffect, useRef, useState } from "react";
import * as turf from "@turf/turf";
import ReactMapGL, { Source, Layer, Marker, Popup } from "react-map-gl";

import * as parkDate from "./data/skateboard-parks.json";
import {
  DrawControl,
  Editor,
  DrawLineStringMode,
  DrawPolygonMode,
  EditingMode,
  RENDER_STATE,
} from "react-map-gl-draw";
import { NavigationControl } from "react-map-gl";
import { GeolocateControl } from "react-map-gl";
import Directions from "./data/direction";
// import Directions from 'react-map-gl-directions'
// import MapboxDirections from "@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions";

// import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
let lon = 96.1346011283,
  lat = 16.8246550347;

let draglon = 96.1216511283,
  draglat = 16.8297550347;

//botahtaung

var radius = 5;
var center = [lon, lat];
var options = { steps: 50, units: "kilometers", properties: { foo: "bar" } };
var circle = turf.circle(center, radius, options);

var line = turf.lineString(...circle.geometry.coordinates);
console.log(line);
var directions = null;

const MODES = [
  { id: "drawPolyline", text: "Draw Polyline", handler: DrawLineStringMode },
  { id: "drawPolygon", text: "Draw Polygon", handler: DrawPolygonMode },
  { id: "editing", text: "Edit Feature", handler: EditingMode },
];

function App() {
  const [viewport, setViewport] = useState({
    width: "100vw",
    height: "100vh", // , [-87.61694, 41.86625]
    latitude: lat,
    longitude: lon,
    zoom: 14,
    // pitch: 0,
    // bearing: 0
  });
  const [modeIds, setModeId] = useState(null);
  const [modeHandler, setModeHandler] = useState(null);
  const [route1, setRoutes] = useState(null);
  const [coordinate, setCoordinates] = useState([]);
  const mapRef = useRef(null);
  const [selectedPark, setSelectedPark] = useState(null);
  const [parkColor, setParkColor] = React.useState("#000000");
  const [showroute, setshowRoute] = useState(false);
  const reactMap = useRef(null);

  const layer = {
    id: "route",
    type: "line",
    source: "route",
    draggable: "true",
    layout: {
      "line-join": "round",
      "line-cap": "round",
    },
    paint: {
      "line-color": "#03AA46",
      "line-width": 6,
      "line-opacity": 0.8,
    },
  };

  const layer2 = {
    id: "points",
    type: "symbol",
    source: "points",
    layout: {
      "icon-image": "custom-marker",
      // get the title name from the source's "title" property
      "text-field": ["get", "title"],
      "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
      "text-offset": [0, 1.25],
      "text-anchor": "top",
    },
  };

  useEffect(() => {
    const listener = (e) => {
      if (e.key === "Escape") {
        setSelectedPark(null);
      }
    };
    window.addEventListener("keydown", listener);

    return () => {
      window.removeEventListener("keydown", listener);
    };
  }, []);

  const _switchMode = (evt) => {
    const modeId = evt.target.value === modeIds ? null : evt.target.value;
    const mode = MODES.find((m) => m.id === modeId);
    const modeHandler = mode ? new mode.handler() : null;
    console.log(modeHandler);
    setModeHandler(modeHandler);
    setModeId(modeId);
  };

  const _renderToolbar = () => {
    return (
      <div
        style={{ position: "absolute", top: 0, right: 0, maxWidth: "320px" }}
      >
        <select onChange={_switchMode}>
          <option value="">--Please choose a draw mode--</option>
          {MODES.map((mode) => (
            <option key={mode.id} value={mode.id}>
              {mode.text}
            </option>
          ))}
        </select>
      </div>
    );
  };

  async function onDirect () {
    // const radiuses = radius.join(";");
    // const map = this.reactMap.getMap();
    const profile =  'mapbox/driving-traffic';
    const token =
      "pk.eyJ1IjoicmFmaWxvczU1NiIsImEiOiJja2hoaHFwZjcwZ3pyMnFwNmY3aHY2eDg4In0.Ai4rUxBMjwoNzHTIDqmuBA";
    // Create the query
    const query = await fetch(
      `https://api.mapbox.com/directions/v5/${profile}/access_token=${token}`,
      { method: "GET" }
    );
    const response = await query.json();
    // Handle errors
    if (response.code !== "Ok") {
      alert(
        `${response.code} - ${response.message}.\n\nFor more information: https://docs.mapbox.com/api/navigation/map-matching/#map-matching-api-errors`
      );
      return;
    }
    // Get the coordinates from the response
    const coords = response.matchings[0].geometry;
    console.log(coords);
    addRoute(coords.coordinates);

    getInstructions(response.matchings[0]);
  };

  const onChange = (features) => {
    if (features.data.length > 0) {
      setCoordinates(features.data[0].geometry.coordinates);
    }
  };

  const onUpdate = (features) => {
    console.log(features);
    if (features.data.length > 0) {
      setCoordinates(features.data[0].geometry.coordinates);
      updateRoute(features.data[0].geometry.coordinates);
    }
  };

  // Use the coordinates you drew to make the Map Matching API request
  function updateRoute(coordinates) {
    // Set the profile
    const profile = "driving";
    // Get the coordinates that were drawn on the map
    const data = coordinates;
    console.log(data);
    const lastFeature = data.length - 1;
    const coords = data;
    // Format the coordinates
    const newCoords = coords.join(";");
    // Set the radius for each coordinate pair to 25 meters
    const radius = coords.map(() => 25);
    console.log(newCoords, radius);
    getMatch(newCoords, radius, profile);
    onDirect();
  }

  function getInstructions(data) {
    // Target the sidebar to add the instructions
    const directions = document.getElementById("directions");
    let tripDirections = "";
    // Output the instructions for each step of each leg in the response object
    for (const leg of data.legs) {
      const steps = leg.steps;
      for (const step of steps) {
        tripDirections += `<li>${step.maneuver.instruction}</li>`;
      }
    }
    directions.innerHTML = `<p><strong>Trip duration: ${Math.floor(
      data.duration / 60
    )} min.</strong></p><ol>${tripDirections}</ol>`;
  }

  function addRoute(coords) {
    const route1 = {
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: coords,
        draggable: true,
      },
    };
    console.log(route1.geometry.coordinates);
    setRoutes(route1);
    setshowRoute(true);
    setModeId(null);
    setModeHandler(null);
  }

  // Make a Map Matching request
  async function getMatch(coordinates, radius, profile) {
    // Separate the radiuses with semicolons
    const radiuses = radius.join(";");
    const token =
      "pk.eyJ1IjoicmFmaWxvczU1NiIsImEiOiJja2hoaHFwZjcwZ3pyMnFwNmY3aHY2eDg4In0.Ai4rUxBMjwoNzHTIDqmuBA";
    // Create the query
    // const query = await fetch(
    //   `https://api.mapbox.com/matching/v5/mapbox/${profile}/${coordinates}?geometries=geojson&radiuses=${radiuses}&steps=true&access_token=${token}`,
    //   { method: "GET" }
    // );
    const query = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coordinates}?alternatives=true&geometries=geojson&steps=true&access_token=${token}`,
      { method: "GET" }
    );
    const response = await query.json();
    // Handle errors
    if (response.code !== "Ok") {
      alert(
        `${response.code} - ${response.message}.\n\nFor more information: https://docs.mapbox.com/api/navigation/map-matching/#map-matching-api-errors`
      );
      return;
    }
    console.log(response)
    // const map = this.reactMap.getMap();
    // response.addControl(
    //   new MapboxDirections({
    //     accessToken: token,
    //   }),
    //   "top-left"
    // );
    // Get the coordinates from the response
    const coords = response.routes[0].geometry;
    console.log(coords);
    addRoute(coords.coordinates);

    getInstructions(response.routes[0]);
    // Code from the next step will go here
  }
  const [events, logEvents] = useState({});

  const [marker, setMarker] = useState({
    latitude: 16.8297550347,
    longitude: 96.1216511283,
  });

  // const onMarkerDragEnd = (coord, index) => {
  //   const { latLng } = coord;
  //   const lat = latLng.lat();
  //   const lng = latLng.lng();

  //   this.setState((prevState) => {
  //     const markers = [...this.state.markers];
  //     markers[index] = { ...markers[index], position: { lat, lng } };
  //     return { markers };
  //   });
  // };

  const onMarkerDragStart = useCallback((event) => {
    logEvents((_events) => ({ ..._events, onDragStart: event.lngLat }));
  }, []);

  const onMarkerDrag = useCallback((event) => {
    logEvents((_events) => ({ ..._events, onDrag: event.lngLat }));
  }, []);

  const onMarkerDragEnd = useCallback((event) => {
    logEvents((_events) => ({ ..._events, onDragEnd: event.lngLat }));
    setMarker({
      longitude: event.lngLat[0],
      latitude: event.lngLat[1],
    });
  }, []);

  return (
    <ReactMapGL
      {...viewport}
      mapStyle="mapbox://styles/mapbox/streets-v11"
      mapboxApiAccessToken="pk.eyJ1IjoicmFmaWxvczU1NiIsImEiOiJja2hoaHFwZjcwZ3pyMnFwNmY3aHY2eDg4In0.Ai4rUxBMjwoNzHTIDqmuBA"
      // center={[-122.486052, 37.830348]}
      center={[center]}
      onViewportChange={(viewport) => {
        setViewport(viewport);
      }}
    >
      {/* <directions mapRef={this.mapRef} mapboxApiAccessToken="pk.eyJ1IjoicmFmaWxvczU1NiIsImEiOiJja2hoaHFwZjcwZ3pyMnFwNmY3aHY2eDg4In0.Ai4rUxBMjwoNzHTIDqmuBA" /> */}
      {/* <Layer {...parkLayer} paint={{'fill-color': parkColor}} />
       */}
      <Editor
        // to make the lines/vertices easier to interact with
        clickRadius={12}
        mode={new DrawLineStringMode()}
        onUpdate={onUpdate}
        onChange={onChange}
      />
      <Editor
        // to make the lines/vertices easier to interact with
        clickRadius={12}
        mode={modeHandler}
        onSelect={(_) => {
          console.log(_);
        }}
        onUpdate={onUpdate}
        onChange={onChange}
      />
      {_renderToolbar()}

      {showroute === true && (
        <>
          <Source type="geojson" data={route1}>
            <Layer {...layer} />
            {/* <Directions></Directions> */}
          </Source>
        </>
      )}
      <Marker
        // latitude={route1.geometry.coordinates[0][1]}
        // longitude={route1.geometry.coordinates[0][0]}
        longitude={marker.longitude}
        latitude={marker.latitude}
        offsetTop={-20}
        offsetLeft={-10}
        draggable
        // onDragStart={onMarkerDragStart}
        // onDrag={onMarkerDrag}
        // onDragEnd={onMarkerDragEnd}
      >
        <button className="marker-btn">
          <img src="/location.svg" alt="Skate Park Icon" />
        </button>
      </Marker>
      {/* <Marker latitude={lat} longitude={lon} draggable="true">
        <button className="marker-btn">
          <img src="/location.svg" alt="Skate Park Icon" />
        </button>
      </Marker> */}

      {parkDate.features.map((park) => (
        <Marker
          id="marker"
          key={park.properties.PARK_ID}
          latitude={park.geometry.coordinates[1]}
          longitude={park.geometry.coordinates[0]}
        >
          <button
            className="marker-btn"
            onClick={(e) => {
              e.preventDefault();
              setSelectedPark(park);
            }}
          >
            <img src="/skateboarding.svg" alt="Skate Park Icon" />
          </button>
        </Marker>
      ))}

      {/* {selectedPark ? (
        <Popup
          latitude={selectedPark.geometry.coordinates[1]}
          longitude={selectedPark.geometry.coordinates[0]}
          onClose={() => {
            setSelectedPark(null);
          }}
        >
          <div>
            <h2>{selectedPark.properties.NAME}</h2>
            <p>{selectedPark.properties.DESCRIPTIO}</p>
          </div>
        </Popup>
      ) : null} */}
      <div class="info-box">
        <p>
          Draw your route using the draw tools on the right. To get the most
          accurate route match, draw points at regular intervals.
        </p>
        <div id="directions"></div>
      </div>
    </ReactMapGL>
  );
} // react map gl

// const AnyReactComponent = ({ text }) => <div>{text}</div>;
// function App() {
//   const defaultProps = {
//     center: {
//       lat: 10.99835602,
//       lng: 77.01502627
//     },
//     zoom: 11
//   };
//   return (
//     // Important! Always set the container height explicitly
//     <div style={{ height: '100vh', width: '100%' }}>
//       <GoogleMapReact
//         bootstrapURLKeys={{ key: "" }}
//         defaultCenter={defaultProps.center}
//         defaultZoom={defaultProps.zoom}
//       >
//         <AnyReactComponent
//           lat={59.955413}
//           lng={30.337844}
//           text="My Marker"
//         />
//       </GoogleMapReact>
//     </div>
//   );
// }

export default App;
