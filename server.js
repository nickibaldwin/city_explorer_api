'use strict';

//_______Packages______
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const pg = require('pg');
require('dotenv').config();


//_______APP_________
//express() will return a fully ready to run server object
const app = express();
//enables local processes to talk to the server
app.use(cors());
const client = new pg.Client(process.env.DATABASE_URL); //connects us to postgres, Client is a constructor that's why it's C not c.
client.on('error', err => console.log(err)); //method


const PORT = process.env.PORT || 3008;


const GEOCODE_KEY = process.env.GEOCODE_API_KEY;
const WEATHER_KEY = process.env.WEATHER_API_KEY;
const PARKS_KEY = process.env.PARKS_API_KEY;
const MOVIE_KEY = process.env.MOVIE_API_KEY;
const YELP_KEY = process.env.YELP_API_KEY;


//_______Routes______

app.get('/location', locationCallback); //location route
app.get('/weather', handleGetWeather);
app.get('/parks', handleParks);
app.get('/movies', movieCallback);
app.get('/yelp', yelpCallback);

function locationCallback(req, res) {

    const sqlQueryStr = 'SELECT * FROM city_explorer_table WHERE search_query=$1';
    const sqlQueryArr = [req.query.city];

    client.query(sqlQueryStr, sqlQueryArr) //search our DB for city, and returns a PROMISE which takes a million years
        .then(result => { //city results come back
            if (result.rows.length > 0) { //just use the data in sql
                res.send(result.row[0]);
            } else {
                const city = req.query.city;
                const url = `https://us1.locationiq.com/v1/search.php?key=${GEOCODE_KEY}&q=${city}&format=json`;

                superagent.get(url) //search api for city
                    .then(userData => { //api results come back
                        const output = new Location(userData.body, req.query.city);
                        const sqlStr = 'INSERT INTO city_explorer_table (search_query, formatted_query, latitude, longitude) VALUES ($1, $2, $3, $4)';
                        const sqlArr = [output.search_query, output.formatted_query, output.latitude, output.longitude];
                        client.query(sqlStr, sqlArr); //takes a million yearsÎ

                        res.send(output);
                    });
            }
        })
        .catch(error => {
            console.log(error);
            res.status(500).send('Ooops, I broke it again');
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
            //TODO refactor for loop below, like     const output = arr.map(park => new Park(park));
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

    superagent.get(url).then(returnedPark => {
            const arr = returnedPark.body.data;
            const output = arr.map(park => new Park(park));
            res.send(output);
        })
        .catch(error => {
            console.log(error);
            res.status(500).send('Ooops, I broke it again');
        });
}

function Park(userData) {
    this.name = userData.fullName;
    this.description = userData.description;
    this.address = `${userData.addresses[0].line1} ${userData.addresses[0].city} ${userData.addresses[0].stateCode}`;
    this.fee = `${userData.entranceFees[0].cost} ${userData.entranceFees[0].description}`;
    this.url = userData.url;
}


function movieCallback(req, res) {
    const movie = req.query.search_query;
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${MOVIE_KEY}&language=en-US&query=${movie}&page=1&include_adult=false`;

    superagent.get(url)
        .then(returnedMovie => {
            const arr = returnedMovie.body.results;
            console.log('+++++', arr);
            const output = arr.map(movie => new Movie(movie));
            res.send(output);
        })
        .catch(error => {
            res.status(500).send('Ooops, I broke it again', error);
        });
}

function Movie(userData) {
    this.title = userData.original_title;
    this.overview = userData.overview;
    this.average_votes = userData.vote_count;
    this.total_votes = userData.vote_average;
    this.image_url = `https://www.themoviedb.org/t/p/w600_and_h900_bestv2${userData.poster_path}` || 'sorry no image';
    this.popularity = userData.populatiry;
    this.released_on = userData.release_date;
}

function yelpCallback(req, res) {
    const yelp = (req.query.page - 1) * 5;
    const url = `https://api.yelp.com/v3/businesses/search?term=restaurant&limit=5&latitude=${req.query.latitude}&longitude=${req.query.longitude}&offset=${yelp}`;

    superagent.get(url).set('Authorization', `bearer ${YELP_KEY}`)
        .then(returnedYelp => {
            const arr = returnedYelp.body.businesses.map(yelpOutput);

            function yelpOutput(info) {
                return new Restaurant(info);
            }
            res.send(arr);
        })
        .catch(error => {
            res.status(500).send('Ooops, I broke it again', error);
        });

    function Restaurant(userData) {
        this.name = userData.name;
        this.image_url = userData.image_url;
        this.price = userData.price;
        this.rating = userData.rating;
        this.url = userData.url;
    }
}

//_______Initialization______
client.connect() //this connects us to the database
    .then(() => {
        app.listen(PORT, console.log(`App is up on http://${PORT}.`)); //this line starts our server
    })
    .catch(error => {
        console.log(error);
        app.listen(PORT, console.log(`App is up on http://${PORT}.`));
    });