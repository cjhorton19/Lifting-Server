const express = require('express');
const bodyParser = require('body-parser');
const { Client } = require('pg');
const cors = require('cors');
const secret = process.env.MY_SECRET_VALUE;
const app = express();
app.use(bodyParser.json());
app.use(cors());

const port = process.env.PORT || 3001;

async function excecuteQuery(query, res){
  try {
    const {username, password, engine, host, port, dbname, dbInstanceIdentifier} = JSON.parse(secret);
    const client = new Client({
      user: username,
      password: password,
      host: host,
      port: port,
      database: dbname,
      ssl: {
        rejectUnauthorized: false
      }
    });
    await client.connect();
    const result = await client.query(query);
    console.log(result);
    await client.end();
    res.send(result);
  } catch (err) {
      console.error('Error executing query', err.stack);
      res.status(500).send('Error executing query');
  }
};

function getFormattedDate() {
  const myDate = new Date();
  const year = myDate.getFullYear();
  const month = ('0' + (myDate.getMonth() + 1)).slice(-2);
  const day = ('0' + myDate.getDate()).slice(-2);
  const formattedDate = `${year}-${month}-${day}`;
  return formattedDate;
}

app.post('/createUser', async (req, res) => {
  const query = `INSERT INTO users (weight, is_rep_range_suggested)
  VALUES (165, true);`;
  excecuteQuery(query, res);
});

app.post('/createExercise', async (req, res) => {
console.log(req.body);
const {muscleGroup, exercise, reps, weight} = req.body;
const query = `INSERT INTO exercises (date, muscle_group, exercise, reps, weight, user_id)
VALUES ('${getFormattedDate()}', '${muscleGroup}', '${exercise}', ${reps}, ${weight}, 1);`;
console.log(query);
excecuteQuery(query, res);
});

app.post('/createExerciseId', async (req, res) => {
console.log(req.body);
const {exercise} = req.body;
const query = {
  text: `
    INSERT INTO exercises (exercise, exercise_id)
    VALUES ($1, COALESCE((SELECT MAX(exercise_id) FROM exercises), 0) + 1)
    ON CONFLICT (exercise) DO UPDATE
    SET exercise = excluded.exercise
    RETURNING exercise_id
  `,
  values: [exercise],
};
console.log(query);
excecuteQuery(query, res);
});

app.post('/createExercises', async (req, res) => {
const {exercises} = req.body;
let values = '';
for (let i = 0; i < exercises.length; i++) {
  const exercise = exercises[i];
  values += `('${getFormattedDate()}', '${exercise.muscleGroup}', '${exercise.exercise}', ${exercise.reps}, ${exercise.weight}, 1)`;
  
  if (i !== exercises.length - 1) {
    values += ', ';
  }
}
const query = `INSERT INTO exercises (date, muscle_group, exercise, reps, weight, user_id)
VALUES ${values};`;
excecuteQuery(query, res);
});

//Below is the read server
app.get('/autocomplete', async (req, res) => {
const { input } = req.query;
const query = {
  text: 'SELECT DISTINCT exercise, exercise_id FROM exercises WHERE exercise ILIKE $1 ORDER BY exercise LIMIT 10',
  values: [`%${input}%`],
};
console.log(query);
excecuteQuery(query, res);
console.log(query);
});

app.post('/getUserById', async (req, res) => {
console.log(req.body);
const {userId} = req.body;
const query = `SELECT * FROM users WHERE user_id = '${userId}';`;
console.log(query);
excecuteQuery(query, res);
});

app.post('/getUserByFirstName', async (req, res) => {
console.log(req.body);
const {firstName} = req.body;
const query = `SELECT * FROM users WHERE firstname = '${firstName}';`;
console.log(query);
excecuteQuery(query, res);
});

app.post('/getExercises', async (req, res) => {
console.log(req.body);
const {muscleGroup} = req.body;
const query = `SELECT * FROM exercises WHERE muscle_group = '${muscleGroup}';`;
console.log(query);
excecuteQuery(query, res);
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});