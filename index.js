const express = require('express');
const app = express();
require('dotenv').config();
const cors = require('cors')
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const port = process.env.PORT || 5000;

// middleware
app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.o9jnfig.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// verify JWT token
function verifyJWT(req, res, next) {
    
    const authHeader = req.headers.authorization
    if (!authHeader) {
        return res.status(401).send("Unauthorized Access")
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({message: 'Forbidden Access'})
        }
        req.decoded = decoded
        next();  
    })
}

async function run() {
    try {
        const catagoriesCollection = client.db('fantasticFurniture').collection('catagories')
        const usersCollection = client.db('fantasticFurniture').collection('users')

        // verify admin
        const verifyAdmin = async (req, res, next) => {
            const decodedEmail = req.decoded.email
            const query = {email: decodedEmail}
            const user = await usersCollection.findOne(query)

            if (user?.role !== 'Admin') {
               return res.status(403).send({message: 'Forbidden Access'}) 
            }
            next()
        }

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

        // admin role updated
        app.put('/users/admin/:id', verifyJWT, verifyAdmin, async (req, res) => {
            const id = req.params.id
            const filter = {_id: ObjectId(id)}
            const options = {upsert: true}
            const updatedDoc = {
                $set: {
                    role: 'Admin'
                }
            }
            const result = await usersCollection.updateOne(filter, updatedDoc, options)
            res.send(result)
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