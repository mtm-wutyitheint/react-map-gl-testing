import React from "react";
import "./App.css";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import MapboxDirections from "@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions";
import "@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions.css";
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
      accessToken:
        "pk.eyJ1IjoicmFmaWxvczU1NiIsImEiOiJja2hoaHFwZjcwZ3pyMnFwNmY3aHY2eDg4In0.Ai4rUxBMjwoNzHTIDqmuBA",
      style: "mapbox://styles/mapbox/streets-v10",
      center: [lon, lat],
      zoom: 14,
    });

    // Creates new directions control instance
    const directions = new MapboxDirections({
      accessToken:
        "pk.eyJ1IjoicmFmaWxvczU1NiIsImEiOiJja2hoaHFwZjcwZ3pyMnFwNmY3aHY2eDg4In0.Ai4rUxBMjwoNzHTIDqmuBA",
      unit: "metric",
      profile: "mapbox/driving",
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
              `<h3>${feature.properties.title}</h3><p>${feature.properties.description}</p>`
            )
        )
        .addTo(map);
    }

    // Integrates directions control with map
    map.addControl(directions, "top-left");

    //   map.addControl(
    //     new mapboxgl.GeolocateControl({
    //         positionOptions: {
    //             enableHighAccuracy: true
    //         },
    //         // When active the map will receive updates to the device's location as it changes.
    //         trackUserLocation: true,
    //         // Draw an arrow next to the location dot to indicate which direction the device is heading.
    //         showUserHeading: true
    //     })
    // );
    map.on("load", async () => {
      // Get the initial location of the International Space Station (ISS).
      const geojson = await getLocation();
      // Add the ISS location as a source.
      console.log(geojson);
      map.addSource("iss", {
        type: "geojson",
        data: geojson,
      });
      // Add the rocket symbol layer to the map.
      map.addLayer({
        id: "iss",
        type: "symbol",
        source: "iss",
        layout: {
          "icon-image": "rocket-15",
        },
      });

      // Update the source from the API every 2 seconds.
      const updateSource = setInterval(async () => {
        const geojson = await getLocation(updateSource);
        map.getSource("iss").setData(geojson);
      }, 2000);

      async function getLocation(updateSource) {
        // Make a GET request to the API and return the location of the ISS.
        try {
          const response = await fetch(
            "https://api.wheretheiss.at/v1/satellites/25544",
            // 'https://api.wheretheiss.at/v1/coordinates/37.795517,-122.393693',
            { method: "GET" }
          );
          console.log(response);
          const { latitude, longitude } = await response.json();
          // Fly the map to the location.
          console.log(latitude, longitude);
          map.flyTo({
            center: [longitude, latitude],
            speed: 0.5,
          });
          // Return the location of the ISS as GeoJSON.
          return {
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                geometry: {
                  type: "Point",
                  coordinates: [longitude, latitude],
                },
              },
            ],
          };
        } catch (err) {
          // If the updateSource interval is defined, clear the interval to stop updating the source.
          if (updateSource) clearInterval(updateSource);
          throw new Error(err);
        }
      }
    });

    let geolocate = new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true,
        watchPosition: true,
      },
      trackUserLocation: true,
      showUserHeading: true,
    });

    map.addControl(geolocate);
    geolocate.on("geolocate", (e) => {
      map.loadImage(
        "https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Cat_silhouette.svg/400px-Cat_silhouette.svg.png",
        (error, image) => {
          console.log(e);
          if (error) throw error;
          // map.addImage('cat', image);
          for (const feature of parkDate.features) {
            map.addLayer({
              id: "points",
              type: "symbol",
              source: {
                type: "geojson",
                data: {
                  type: "FeatureCollection",
                  features: [
                    {
                      type: "Feature",
                      geometry: {
                        type: "Point",
                        coordinates: feature.geometry.coordinates,
                      },
                    },
                  ],
                },
              },
              layout: {
                "icon-image": "cat",
                "icon-size": 0.3,
              },
            });
          }
        }
      );
    });
  }

  render() {
    return <div ref={(el) => (this.mapWrapper = el)} className="mapWrapper" />;
  }
}

export default App;
