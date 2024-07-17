const http = require('http');
const path = require("path");
const fs = require('fs');
const express = require('express');
const bodyParser = require("body-parser");
const axios = require("axios");
const portNumber = 4000;
const app = express();


app.set("views", path.resolve(__dirname, "template"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:false}));


require("dotenv").config({ path: path.resolve(__dirname, 'credentials/.env') });
const userName = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;
const databaseAndCollection = {db: "WorkoutGenerator", collection:"Workout"};
const { MongoClient, ServerApiVersion } = require('mongodb');
process.stdin.setEncoding("utf8");

const rep = ["3-5", "8-10", "12-15"];
const repAmt = rep[Math.floor(Math.random() * rep.length)];


app.listen(portNumber, (err) => {
    if(err) {
        console.log("Starting server failed.");
    } else {
        console.log(`Web server is running at http://localhost:${portNumber}`);
    }
});


async function getAPI(options){
    try {
        let res = [];
        const response = await axios.request(options);
        for(let i = 0; i <= 3; i++){
            let rand = Math.floor(Math.random() * response.data.length);
            res.push(response.data[rand]);
            response.data.splice(rand,1);
        }
        addWorkout(res);
    } catch (error) {
        console.error(error);
    }
}

async function addWorkout(workout) {
    // console.log(workout);
    const uri = `mongodb+srv://dkarimi:${password}@umd.glqdejf.mongodb.net/?retryWrites=true&w=majority`;
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

    try {
        await client.connect();
        let res = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertMany(workout);
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

async function clearWorkouts() {
    const uri = `mongodb+srv://dkarimi:${password}@umd.glqdejf.mongodb.net/?retryWrites=true&w=majority`;
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

    try {
        await client.connect();
        const result = await client.db(databaseAndCollection.db)
        .collection(databaseAndCollection.collection)
        .deleteMany({});        
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}


async function displayWorkout(response) {
    const uri = `mongodb+srv://dkarimi:${password}@umd.glqdejf.mongodb.net/?retryWrites=true&w=majority`;
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
    
   
    try {
        await client.connect();
        let filter = {};
        const cursor = client.db(databaseAndCollection.db)
        .collection(databaseAndCollection.collection)
        .find(filter);

        let apps = await cursor.toArray();
        let workoutTable = "";

        apps.forEach(e => {
            workoutTable += "<tr><td>" + e.name + "</td><td>" + repAmt+ "</td><td>" + e.muscle + "</td><td> <span id=\"popUp\">" + e.instructions + "</span></td></tr>";
        });
        response.render("workoutGeneration", {workoutTable});

    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

/* This endpoint renders the main page of the application and it 
will display the contents of the index.ejs template file. */
app.get("/", (request, response) => {
    clearWorkouts();
    response.render("index");
});


app.get("/generatedWorkout", (request,response) => {
    displayWorkout(response);
});

app.get("/about", (request,response) => {
    response.render("about");
});

app.get("/thanks", (request,response) =>{
    response.render("generatePage");
});

app.get("/generate", (request,response) => {
    response.render("generate");
});

app.post("/generate", (request,response) => {
    let legs = ["hamstrings", "glutes", "quadriceps"];
    let back = ["lower_back", "middle_back"];

    const options = {
        method: 'GET',
        url: 'https://exercises-by-api-ninjas.p.rapidapi.com/v1/exercises',
        params: {
            type: 'strength',
            muscle: request.body.primaryM === "legs" ? legs[Math.floor(Math.random() * legs.length)] : request.body.primaryM === "back" ? back[Math.floor(Math.random() * back.length)] : request.body.primaryM,
            difficulty: request.body.difficulty,
        },
        headers: {
            'X-RapidAPI-Key': 'c692c9dfeemshc7fb5b949cf0659p1c617djsnbe5e7f8b1a8b',
            'X-RapidAPI-Host': 'exercises-by-api-ninjas.p.rapidapi.com'
        }
    };

    getAPI(options);

    if(request.body.secondaryM !== 'n/a') {
        const options2 = {
            method: 'GET',
            url: 'https://exercises-by-api-ninjas.p.rapidapi.com/v1/exercises',
            params: {
                type: 'strength',
                muscle: request.body.secondaryM === "legs" ? legs[Math.floor(Math.random() * legs.length)] : request.body.secondaryM === "back" ? back[Math.floor(Math.random() * back.length)] : request.body.secondaryM,
                difficulty: request.body.difficulty,
            },
            headers: {
                'X-RapidAPI-Key': 'c692c9dfeemshc7fb5b949cf0659p1c617djsnbe5e7f8b1a8b',
                'X-RapidAPI-Host': 'exercises-by-api-ninjas.p.rapidapi.com'
            }
        };
        getAPI(options2)
    } 
    response.render("generatePage");
});
