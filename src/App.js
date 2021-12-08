import React from 'react';
import './App.css';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import MapboxDirections from '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions'
import '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions.css';
import * as parkDate from "./data/skateboard-parks.json";
// import { Marker } from 'react-map-gl';

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_KEY;

let lon = 96.1346011283,
  lat = 16.8246550347;

class App extends React.Component {

  componentDidMount() {
    // Creates new map instance
    const map = new mapboxgl.Map({
      container: this.mapWrapper,
      accessToken: "pk.eyJ1IjoicmFmaWxvczU1NiIsImEiOiJja2hoaHFwZjcwZ3pyMnFwNmY3aHY2eDg4In0.Ai4rUxBMjwoNzHTIDqmuBA",
      style: 'mapbox://styles/mapbox/streets-v10',
      center: [lon, lat],
      zoom: 14
    });

    // Creates new directions control instance
    const directions = new MapboxDirections({
      accessToken: "pk.eyJ1IjoicmFmaWxvczU1NiIsImEiOiJja2hoaHFwZjcwZ3pyMnFwNmY3aHY2eDg4In0.Ai4rUxBMjwoNzHTIDqmuBA",
      unit: 'metric',
      profile: 'mapbox/driving',
    });

    for (const feature of parkDate.features) {
      // create a HTML element for each feature
      const el = document.createElement('div');
      el.className = 'marker';
       
      // make a marker for each feature and add it to the map
      new mapboxgl.Marker(el)
      .setLngLat(feature.geometry.coordinates)
      .setPopup(
      new mapboxgl.Popup({ offset: 25 }) // add popups
      .setHTML(
      `<h3>${feature.properties.title}</h3><p>${feature.properties.description}</p>`
      )
      )
      .addTo(map);
      }

    // Integrates directions control with map
    map.addControl(directions, 'top-left');
  }

  render() {
    return (
      <div ref={el => (this.mapWrapper = el)} className="mapWrapper" />
    );
  }
}

export default App;
