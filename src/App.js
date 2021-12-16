import React from "react";
import "./App.css";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
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
    this.getLocation();
    console.log(this.state.userlon, this.state.userlat);
    // Creates new map instance
    const map = new mapboxgl.Map({
      container: this.mapWrapper,
      accessToken:
        "pk.eyJ1IjoicmFmaWxvczU1NiIsImEiOiJja2hoaHFwZjcwZ3pyMnFwNmY3aHY2eDg4In0.Ai4rUxBMjwoNzHTIDqmuBA",
      style: "mapbox://styles/mapbox/streets-v10",
      // style: "mapbox://styles/mapbox/outdoors-v11",
      center: [lon, lat],
      // center: [this.state.userlon, this.state.userlat],
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
    // console.log(this.state.userlon, this.state.userlat);
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
      map.on("load", () => {
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

    // map.on("load", async () => {
    //   // Get the initial location of the International Space Station (ISS).
    //   const geojson = await getLocation();
    //   // Add the ISS location as a source.
    //   console.log(geojson);
    //   map.addSource("iss", {
    //     type: "geojson",
    //     data: geojson,
    //   });
    //   // Add the rocket symbol layer to the map.
    //   map.addLayer({
    //     id: "iss",
    //     type: "symbol",
    //     source: "iss",
    //     layout: {
    //       "icon-image": "rocket-15",
    //     },
    //   });

    //   // Update the source from the API every 2 seconds.
    //   const updateSource = setInterval(async () => {
    //     const geojson = await getLocation(updateSource);
    //     map.getSource("iss").setData(geojson);
    //   }, 2000);

    //   async function getLocation(updateSource) {
    //     // Make a GET request to the API and return the location of the ISS.
    //     try {
    //       const response = await fetch(
    //         "https://api.wheretheiss.at/v1/satellites/25544",
    //         // 'https://api.wheretheiss.at/v1/coordinates/37.795517,-122.393693',
    //         { method: "GET" }
    //       );
    //       console.log(response);
    //       const { latitude, longitude } = await response.json();
    //       // Fly the map to the location.
    //       console.log(latitude, longitude);
    //       map.flyTo({
    //         center: [longitude, latitude],
    //         speed: 0.5,
    //       });
    //       // Return the location of the ISS as GeoJSON.
    //       return {
    //         type: "FeatureCollection",
    //         features: [
    //           {
    //             type: "Feature",
    //             geometry: {
    //               type: "Point",
    //               coordinates: [longitude, latitude],
    //             },
    //           },
    //         ],
    //       };
    //     } catch (err) {
    //       // If the updateSource interval is defined, clear the interval to stop updating the source.
    //       if (updateSource) clearInterval(updateSource);
    //       throw new Error(err);
    //     }
    //   }
    // });

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
    //   //   // Update the source from the API every 2 seconds.

    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
    } else {
      // setStatus("Locating...");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log(position);
          // setStatus(null);
          const el03 = document.createElement("div");
          el03.className = "current";
          new mapboxgl.Marker(el03)
            .setLngLat([position.coords.longitude, position.coords.latitude])
            // .setPopup(
            //   new mapboxgl.Popup({ offset: 25 }) // add popups
            //     .setHTML(
            //       `<h3>${feature.properties.NAME}</h3><p>${feature.properties.ADDRESS}</p>`
            //     )
            // )
            .addTo(map);
          this.setState({
            userlat: position.coords.latitude,
            userlon: position.coords.longitude,
          });
          // setLng(position.coords.longitude);
        },
        () => {
          alert("Unable to retrieve your location");
        }
      );
    }
    // });
  }

  getLocation() {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
    } else {
      // setStatus("Locating...");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log(position);
          // setStatus(null);
          this.setState({
            userlat: position.coords.latitude,
            userlon: position.coords.longitude,
          });
          // setLng(position.coords.longitude);
        },
        () => {
          alert("Unable to retrieve your location");
        }
      );
    }
  }

  addCoordinate() {
    // map.on("load", async () => {
    //     // Get the initial location of the International Space Station (ISS).
    //     const geojson = await getLocation();
    //     // Add the ISS location as a source.
    //     console.log(geojson);
    //     map.addSource("iss", {
    //       type: "geojson",
    //       data: geojson,
    //     });
    //     // Add the rocket symbol layer to the map.
    //     map.addLayer({
    //       id: "iss",
    //       type: "symbol",
    //       source: "iss",
    //       layout: {
    //         "icon-image": "rocket-15",
    //       },
    //     });
    //     // Update the source from the API every 2 seconds.
    //     const updateSource = setInterval(async () => {
    //       const geojson = await getLocation(updateSource);
    //       map.getSource("iss").setData(geojson);
    //     }, 2000);
    //     async function getLocation(updateSource) {
    //       // Make a GET request to the API and return the location of the ISS.
    //       try {
    //         const response = await fetch(
    //           "https://api.wheretheiss.at/v1/satellites/25544",
    //           // 'https://api.wheretheiss.at/v1/coordinates/37.795517,-122.393693',
    //           { method: "GET" }
    //         );
    //         console.log(response);
    //         const { latitude, longitude } = await response.json();
    //         // Fly the map to the location.
    //         console.log(latitude, longitude);
    //         map.flyTo({
    //           center: [longitude, latitude],
    //           speed: 0.5,
    //         });
    //         // Return the location of the ISS as GeoJSON.
    //         return {
    //           type: "FeatureCollection",
    //           features: [
    //             {
    //               type: "Feature",
    //               geometry: {
    //                 type: "Point",
    //                 coordinates: [longitude, latitude],
    //               },
    //             },
    //           ],
    //         };
    //       } catch (err) {
    //         // If the updateSource interval is defined, clear the interval to stop updating the source.
    //         if (updateSource) clearInterval(updateSource);
    //         throw new Error(err);
    //       }
    //     }
    //   });
    //   let geolocate = new mapboxgl.GeolocateControl({
    //     positionOptions: {
    //       enableHighAccuracy: true,
    //       watchPosition: true,
    //     },
    //     trackUserLocation: true,
    //     showUserHeading: true,
    //   });
    //   map.addControl(geolocate);
    //   geolocate.on("geolocate", (e) => {
    //     map.loadImage(
    //       "https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Cat_silhouette.svg/400px-Cat_silhouette.svg.png",
    //       (error, image) => {
    //         console.log(e);
    //         if (error) throw error;
    //         // map.addImage('cat', image);
    //         for (const feature of parkDate.features) {
    //           map.addLayer({
    //             id: "points",
    //             type: "symbol",
    //             source: {
    //               type: "geojson",
    //               data: {
    //                 type: "FeatureCollection",
    //                 features: [
    //                   {
    //                     type: "Feature",
    //                     geometry: {
    //                       type: "Point",
    //                       coordinates: feature.geometry.coordinates,
    //                     },
    //                   },
    //                 ],
    //               },
    //             },
    //             layout: {
    //               "icon-image": "cat",
    //               "icon-size": 0.3,
    //             },
    //           });
    //         }
    //       }
    //     );
    //   });
  }

  render() {
    return <div ref={(el) => (this.mapWrapper = el)} className="mapWrapper" />;
  }
}

export default App;
