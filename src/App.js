import React from "react";
import "./App.css";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions.css";
import { db } from "./Firebase";
import { collection, onSnapshot } from "firebase/firestore";

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_KEY;

// let lon = 96.1346011283,
//   lat = 16.8246550347;

let lon = 96.1726946,
  lat = 16.7722108; //SCM location
let map;
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
    // this.getLocation();
    console.log(this.state.userlon, this.state.userlat);
    // Creates new map instance
    map = new mapboxgl.Map({
      container: this.mapWrapper,
      accessToken:
        "pk.eyJ1IjoicmFmaWxvczU1NiIsImEiOiJja2hoaHFwZjcwZ3pyMnFwNmY3aHY2eDg4In0.Ai4rUxBMjwoNzHTIDqmuBA",
      style: "mapbox://styles/mapbox/streets-v10",
      // style: "mapbox://styles/mapbox/outdoors-v11",
      center: [lon, lat],
      zoom: 14,
    });

    let arrayId = [];
    let arrayData = [];

    onSnapshot(collection(db, "routes"), (snapshot) => {
      // console.log(snapshot.docs.map((ref) => ref.data()));
      arrayId = snapshot.docs.map((ref) => ref.id);
      arrayData = snapshot.docs.map((ref) => ref.data());
      console.log(arrayId);
      console.log(arrayData);

      Promise.all(
        arrayId.map(function (eachid) {
          return new Promise(function (resolve, reject) {
            onSnapshot(
              collection(db, "routes", eachid, "points"),
              (snapshot) => {
                const data = snapshot.docs.map((ref) => ref.data().coordinate);
                resolve(data);
              }
            );
          });
        })
      ).then(async (data) => {
        Promise.all(
          data.map(async (feature, index) => {
            console.log(index);
            // length = length - 1;
            console.log(feature);
            const profile = "driving";
            // Get the coordinates that were drawn on the map
            const data = feature;
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
            // eslint-disable-next-line no-loop-func
            return new Promise(async (resolve, reject) => {
              map.once("idle", () => {
                console.log("map load");
                var routename = "feature-" + response.uuid;
                const el = document.createElement("div");
                el.className = "marker-start";
                new mapboxgl.Marker(el)
                  .setLngLat(data[0])
                  .setPopup(
                    new mapboxgl.Popup({ offset: 25 }) // add popups
                  )
                  .addTo(map);
                const le = data.length;
                const el01 = document.createElement("div");
                el01.className = "marker-end";
                new mapboxgl.Marker(el01)
                  .setLngLat(data[le - 1])
                  .setPopup(
                    new mapboxgl.Popup({ offset: 25 }) // add popups
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
                      default: arrayData[index].route_color,
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

                resolve();
              });
              this.addCoordinate();
            });
          })
        );
      });
    });
    // }, 6000);

    const marker = new mapboxgl.Marker({
      color: "#F84C4C", // color it red
    });

    const radius = 20;

    marker.setLngLat([
      Math.cos(96.1732667 / 1000) * radius,
      Math.sin(16.7738111 / 1000) * radius,
    ]);

    marker.addTo(map);
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
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        console.log(position.coords.latitude, position.coords.longitude);
      });
    } else {
      /* geolocation IS NOT available, handle it */
    }
  }

  addCoordinate() {
    const el01 = document.createElement("div");
    const el02 = document.createElement("div");
    const el03 = document.createElement("div");
    const el04 = document.createElement("div");
    const el05 = document.createElement("div");
    const el06 = document.createElement("div");
    const el07 = document.createElement("div");
    const el08 = document.createElement("div");
    const el09 = document.createElement("div");
    const el10 = document.createElement("div");

    onSnapshot(collection(db, "routes"), (snapshot) => {
      let data = snapshot.docs.map((ref) => ref.data());

      el01.className = "marker-moving";
      new mapboxgl.Marker(el01).setLngLat(data[0].bus_position).addTo(map);

      el02.className = "marker-moving";
      new mapboxgl.Marker(el02).setLngLat(data[1].bus_position).addTo(map);

      el03.className = "marker-moving";
      new mapboxgl.Marker(el03).setLngLat(data[2].bus_position).addTo(map);

      el04.className = "marker-moving";
      new mapboxgl.Marker(el04).setLngLat(data[3].bus_position).addTo(map);

      el05.className = "marker-moving";
      new mapboxgl.Marker(el05).setLngLat(data[4].bus_position).addTo(map);

      el06.className = "marker-moving";
      new mapboxgl.Marker(el06).setLngLat(data[5].bus_position).addTo(map);

      el07.className = "marker-moving";
      new mapboxgl.Marker(el07).setLngLat(data[6].bus_position).addTo(map);

      el08.className = "marker-moving";
      new mapboxgl.Marker(el08).setLngLat(data[7].bus_position).addTo(map);

      el09.className = "marker-moving";
      new mapboxgl.Marker(el09).setLngLat(data[8].bus_position).addTo(map);

      el10.className = "marker-moving";
      new mapboxgl.Marker(el10).setLngLat(data[9].bus_position).addTo(map);
    });
  }

  render() {
    return <div ref={(el) => (this.mapWrapper = el)} className="mapWrapper" />;
  }
}

export default App;
