const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const {Pool, Client} = require('pg');
const cons = require('consolidate');
const dust = require('dustjs-helpers');
const dustLinkedin = require('dustjs-linkedin');

const PORT = process.env.PORT||3000;

const app = express();

//DB connect string
const connect = 'postgresql://LK:kang@localhost/recipedb';

//view engine setup
app.engine('dust', cons.dust);
app.set('views',path.join(__dirname,'views'));
app.set('view engine','dust');

//static folder setup
app.use(express.static(path.join(__dirname,'public')));

//middleware
app.use(express.json());
app.use(bodyParser.urlencoded({extended: false}));


app.get('/', function(req, res){
    
    const client = new Client({
        connectionString: connect
    })

    client.connect();
    client.query('SELECT *FROM recipes',function(err,result){
        if(err){
            console.log(err)
        } else{
            res.render('index',{
                recipes: result.rows
            })
        }
        client.end();
    })
})

app.post('/add', function(req, res){
    
    const pool = new Pool({
        connectionString: connect
    })
    pool.on('error', (err, client) => {
        console.error('Unexpected error on idle client', err)
        process.exit(-1)
      })
      pool.connect((err, client, done) => {
        const text = 'INSERT INTO recipes(name,ingredients,directions) VALUES($1,$2,$3)'
        const values = [req.body.name,req.body.ingredients,req.body.directions]
        if (err) throw err
        client.query(text,values, (err, res) => {
          done()
          if (err) {
            console.log(err.stack)
          }
        })
      })

      pool
      .connect()
      .then(client => {
        return client
          .query(text,values)
          .then(res => {
            client.release()
          })
          .catch(err => {
            client.release()
            console.log(err.stack)
          })
      })
    res.redirect('/');
})
//handle the delete request from ajax
app.delete('/delete/:id',function(req, res){
    
    const pool = new Pool({
        connectionString: connect
    })
    pool.on('error', (err, client) => {
        console.error('Unexpected error on idle client', err)
        process.exit(-1)
      })
      pool.connect((err, client, done) => {
         
        if (err) throw err
        client.query('DELETE FROM recipes WHERE id=$1',[req.params.id], (err, res) => {
          done()
          if (err) {
            console.log(err.stack)
          }
        })
        res.sendStatus(200);
      })

})

app.post('/edit',function(req, res){

    const pool = new Pool({
        connectionString: connect
    })
    pool.on('error', (err, client) => {
        console.error('Unexpected error on idle client', err)
        process.exit(-1)
      })
      pool.connect((err, client, done) => {    
        if (err) throw err
        client.query('UPDATE recipes SET name=$1,ingredients=$2,directions=$3 WHERE id=$4',
        [req.body.name,req.body.ingredients,req.body.directions,req.body.id], (err, res) => {
          done()
          if (err) {
            console.log(err.stack)
          }
        })
        res.redirect('/');
      })
})


app.listen(PORT,function(req, res){
    console.log('Server running on port: ',PORT);
})
