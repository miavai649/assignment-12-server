const express = require('express');
const app = express();
require('dotenv').config();
const cors = require('cors')
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion } = require('mongodb');

const port = process.env.PORT || 5000;

// middleware
app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.o9jnfig.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const catagoriesCollection = client.db('fantasticFurniture').collection('catagories')
        const usersCollection = client.db('fantasticFurniture').collection('users')

        // all categories api
        app.get('/catagories', async (req, res) => {
            const query = {}
            const result = await catagoriesCollection.find(query).toArray()
            res.send(result)
        })

        // saving user api
        app.post('/users', async (req, res) => {
            const user = req.body
            const result = await usersCollection.insertOne(user)
            res.send(result)
        })

        // create jwt token
        app.get('/jwt', async (req, res) => {
            const email = req.query.email  
            const query = {email: email}
            const user = await usersCollection.findOne(query)
            if (user) {
              const token = jwt.sign({email}, process.env.ACCESS_TOKEN, { expiresIn: '1d' })
              return res.send({accessToken: token})
            }
            console.log(user)
            res.status(403).send({accessToken: ''})
          })

        // get all users
        app.get('/users', async (req, res) => {
            const query = {}
            const users = await usersCollection.find(query).toArray()
            res.send(users)
        })

    }
    finally {
        
    }
}

run().catch(console.log)

app.get('/', (req, res) => {
    res.send('assignment-12 server is running')
})

app.listen(port, () => console.log(`assignment-12 server running on ${port}`))