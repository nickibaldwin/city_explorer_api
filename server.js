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
function handleGetLocation(req, res) {
  console.log(req.query);

  const dataFromTheFile = require('./data/location.json');

  const output = new Location(dataFromTheFile, req.query.city);

  res.send(output);
}

function Location(dataFromTheFile, cityName) {
  this.search_query = cityName;
  this.fomatted_query = dataFromTheFile[0].display_name;
  this.latitude = dataFromTheFile[0].lat;
  this.longitude = dataFromTheFile[0].lon;
}

//_______Initialization______

app.listen(PORT, () => { console.log('app is up on http://localhost:3009');});

