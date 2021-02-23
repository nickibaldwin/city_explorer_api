'use strict';

//_______Packages______
const express = require('express');
const cors = require('cors');


require('dotenv').config();

//_______APP_________
const app = express();
app.use(cors());

const PORT = process.env.PORT || 3009;

//_______Routes______

app.get('/location', handleGetLocation);
app.get('/weather', handleGetWeather);

function handleGetLocation(req, res) {
  console.log(req.query);

  const dataFromTheFile = require('./data/location.json');

  const output = new Location(dataFromTheFile, req.query.city);

  res.send(output);
}

function handleGetWeather(req, res) {

  const data = require('./data/weather.json');
  console.log(data.data[0].datetime);

  const output = new Weather (data.data[0].weather.description, data.data[0].datetime);
  console.log(output);

  res.send(output);
}

function Location(dataFromTheFile, cityName) {
  this.search_query = cityName;
  this.fomatted_query = dataFromTheFile[0].display_name;
  this.latitude = dataFromTheFile[0].lat;
  this.longitude = dataFromTheFile[0].lon;
}

function Weather(description, time) {
  this.forecast = description;
  this.time = time;
}

//_______Initialization______

app.listen(PORT, () => { console.log('app is up on http://localhost:3009');});

