import React from "react";
import "./App.css";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import MapboxDirections from "@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions";
import "@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions.css";
import * as parkDate from "./data/skateboard-parks.json";
import * as routeData from "./data/map-routes.json";
// import { Marker } from 'react-map-gl';

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_KEY;

// let lon = 96.1346011283,
//   lat = 16.8246550347;

let lon = 96.1726946,
  lat = 16.7722108; //SCM location

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      userlon: null,
      userlat: null,
      coordinates: [],
    };
    // this.getMatch = this.getMatch.bind(this);
  }

  async componentDidMount() {
    console.log(routeData);
    // Creates new map instance
    const map = new mapboxgl.Map({
      container: this.mapWrapper,
      accessToken:
        "pk.eyJ1IjoicmFmaWxvczU1NiIsImEiOiJja2hoaHFwZjcwZ3pyMnFwNmY3aHY2eDg4In0.Ai4rUxBMjwoNzHTIDqmuBA",
      style: "mapbox://styles/mapbox/streets-v10",
      // style: "mapbox://styles/mapbox/outdoors-v11",
      center: [lon, lat],
      // center: [-121.403732, 40.492392],
      zoom: 14,
    });

    for (const feature of parkDate.features) {
      // create a HTML element for each feature
      const el = document.createElement("div");

      el.className = "marker";

      // make a marker for each feature and add it to the map
      new mapboxgl.Marker(el)
        .setLngLat(feature.geometry.coordinates)
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }) // add popups
            .setHTML(
              `<h3>${feature.properties.NAME}</h3><p>${feature.properties.ADDRESS}</p>`
            )
        )
        .addTo(map);
    }

    let length = 5;

    for (const feature of routeData.features) {
      length = length - 1;
      console.log(feature);
      const profile = "driving";
      // Get the coordinates that were drawn on the map
      const data = feature.geometry.coordinates;
      console.log(data);
      const coords = data;
      const newCoords = coords.join(";");
      const radius = coords.map(() => 25);
      console.log(newCoords, radius);
      // this.getMatch(newCoords, radius, profile);

      const token =
        "pk.eyJ1IjoicmFmaWxvczU1NiIsImEiOiJja2hoaHFwZjcwZ3pyMnFwNmY3aHY2eDg4In0.Ai4rUxBMjwoNzHTIDqmuBA";
      const query = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/${profile}/${newCoords}?alternatives=true&geometries=geojson&steps=true&access_token=${token}`,
        { method: "GET" }
      );
      console.log(query);
      // query.then(data => console.log(data))
      const response = await query.json();
      // Handle errors
      if (response.code !== "Ok") {
        alert(
          `${response.code} - ${response.message}.\n\nFor more information: https://docs.mapbox.com/api/navigation/map-matching/#map-matching-api-errors`
        );
        return;
      }
      console.log(response);

      const coordpoint = response.routes[0].geometry;

      // console.log(routename);

      // eslint-disable-next-line no-loop-func
      map.once("load", () => {
        var routename = "feature-" + feature.id;
        console.log(coordpoint);
        // if (map.getLayer(routename)) {
        //   map.removeLayer(routename);
        // }

        const el = document.createElement("div");

        el.className = "marker-start";
        new mapboxgl.Marker(el)
          .setLngLat(data[0])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }) // add popups
              .setHTML(
                `<h3>${feature.properties.NAME}</h3><p>${feature.properties.ADDRESS}</p>`
              )
          )
          .addTo(map);

        const el02 = document.createElement("div");
        const le = data.length;
        el02.className = "marker-end";
        new mapboxgl.Marker(el02)
          .setLngLat(data[le - 1])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }) // add popups
              .setHTML(
                `<h3>${feature.properties.NAME}</h3><p>${feature.properties.ADDRESS}</p>`
              )
          )
          .addTo(map);

        map.addSource(routename, {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: coordpoint.coordinates,
            },
          },
        });
        map.addLayer({
          id: routename,
          type: "line",
          source: routename,
          layout: {
            "line-cap": "butt",
            "line-join": "round",
          },
          paint: {
            "line-color": {
              property: "congestion",
              type: "categorical",
              default: feature.properties.color,
              stops: [
                ["unknown", "#00FF00"],
                ["low", "#00FF00"],
                ["moderate", "#008000"],
                ["heavy", "#008000"],
                ["severe", "#008000"],
              ],
            },
            "line-width": 8,
          },
        });
      });
    }
  }

  async getMatch(coordinates, radius, profile) {
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
    console.log(query);
    // query.then(data => console.log(data))
    const response = await query.json();
    // Handle errors
    if (response.code !== "Ok") {
      alert(
        `${response.code} - ${response.message}.\n\nFor more information: https://docs.mapbox.com/api/navigation/map-matching/#map-matching-api-errors`
      );
      return;
    }
    console.log(response);
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
    this.addRoute(coords.coordinates);

    // getInstructions(response.routes[0]);
    // Code from the next step will go here
  }

  updateRoute(coordinates) {
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
    this.getMatch(newCoords, radius, profile);
    // onDirect();
  }

  addRoute(coords) {
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
    // setRoutes(route1);
    this.setState({ coordinates: coords });
    // setshowRoute(true);
    // setModeId(null);
    // setModeHandler(null);
  }

  render() {
    return <div ref={(el) => (this.mapWrapper = el)} className="mapWrapper" />;
  }
}

export default App;
