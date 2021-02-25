'use strict';

//_______Packages______
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
// const pg = require('pg');
require('dotenv').config();


//_______APP_________
//express() will return a fully ready to run server object
const app = express();
//enables local processes to talk to the server
app.use(cors());
// const client = new pageXOffset.Client(process.env.DATABASE_URL);
// client.on('error', err => console.log(err));

const PORT = process.env.PORT || 3008;


const GEOCODE_KEY = process.env.GEOCODE_API_KEY;
const WEATHER_KEY = process.env.WEATHER_API_KEY;
const PARKS_KEY = process.env.PARKS_API_KEY;


//_______Routes______

app.get('/location', locationCallback);
app.get('/weather', handleGetWeather);
app.get('/parks', handleParks);

function locationCallback(req, res) {
  console.log(req.query);

  const city = req.query.city;

  const url = `https://us1.locationiq.com/v1/search.php?key=${GEOCODE_KEY}&q=${city}&format=json`;

  superagent.get(url)
    .then(userData => {
      const output = new Location(userData.body, req.query.city);

      res.send(output);
    })
    .catch(errorThatComesBack => {
      console.log(errorThatComesBack);
      res.status(500).send('Sorry something went wrong');
    });
}

function Location(userData, cityName) {
  this.search_query = cityName;
  this.formatted_query = userData[0].display_name;
  this.latitude = userData[0].lat;
  this.longitude = userData[0].lon;
}

function handleGetWeather(req, res) {
  const city = req.query.search_query;
  const url = `https://api.weatherbit.io/v2.0/forecast/daily?city=${city}&key=${WEATHER_KEY}`;
  superagent.get(url)
    .then(userData => {
      // console.log(userData.body)
      const output = [];
      for (let i = 0; i < userData.body.data.length; i++) {
        output.push(new Weather(userData.body.data[i]));
      }
      // console.log(output);
      res.send(output);
    })
    .catch(err => console.error(err));
}
function Weather(userData) {
  this.forecast = userData.weather.description;
  this.time = userData.valid_date;
}

function handleParks(req, res) {
  const park = req.query.search_query;
  const url = `https://developer.nps.gov/api/v1/parks?q=${park}&api_key=${PARKS_KEY}`;

  superagent.get(url)
    .then(userData => {
      // const output = new Park(userData.body, req.query.city);
      const output = [];
      for (let i = 0; i < userData.body.data.length; i++) {
        output.push(new Park(userData.body.data[i]));
      }
      res.send(output);
    })
    .catch(errorThatComesBack => {
      console.log(errorThatComesBack);
      res.status(500).send('Sorry something went wrong');
    });
}

function Park(userData) {
  this.name = userData.fullName;
  this.description = userData.description;
  this.address = `${userData.addresses[0].line1} ${userData.addresses[0].city} ${userData.addresses[0].stateCode}`;
  this.fee = `${userData.entranceFees[0].cost} ${userData.entranceFees[0].description}`;
  this.url = userData.url;
}

//_______Initialization______
app.listen(PORT, () => {
  console.log(`App is up on http://${PORT}.`);
});

// client.connect()
//   .then(()=>{
//     app.listen(PORT, console.log(`App is up on http://${PORT}.`)
//     );
//   });