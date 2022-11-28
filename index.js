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
        const productsCollection = client.db('fantasticFurniture').collection('products')
        const bookingsCollection = client.db('fantasticFurniture').collection('bookings')

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

        // admin route protected
        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email
            const query = { email: email }
            const user = await usersCollection.findOne(query)
            res.send({isAdmin: user?.role === 'Admin'})
        })

        // seller route protected
        app.get('/users/seller/:email', async (req, res) => {
            const email = req.params.email
            const query = { email: email }
            const user = await usersCollection.findOne(query)
            res.send({isSeller: user?.role === 'Seller'})
        })

        // buyer route protected
        app.get('/users/buyer/:email', async (req, res) => {
            const email = req.params.email
            const query = { email: email }
            const user = await usersCollection.findOne(query)
            res.send({isBuyer: user?.role === 'Buyer'})
        })

        // all buyers api
        app.get('/users/buyers', async (req, res) => {
            const query = {role: 'Buyer'}
            const user = await usersCollection.find(query).toArray()
            res.send(user)
        })

        // all sellers api
        app.get('/users/sellers', async (req, res) => {
            const query = {role: 'Seller'}
            const user = await usersCollection.find(query).toArray()
            res.send(user)
        })

        // users delete api
        app.delete('/users/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await usersCollection.deleteOne(query);
            res.send(result);
        })

        // add a product
        app.post('/addProduct', async (req, res) => {
            const newProduct = req.body;
            const result = await productsCollection.insertOne(newProduct)
            res.send(result)
        })

        // get products
        app.get('/:categoryName', async (req, res) => {
            const category = req.params.categoryName
            const query = {category: category}
            const products = await productsCollection.find(query).toArray()
            res.send(products)
        })

        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            const query = {
                productName: booking.productName,
                email: booking.email
            }

            const alreadyBooked = await bookingsCollection.find(query).toArray()

            if (alreadyBooked.length) {
                const message = 'You have already booked this product'
                return res.send({acknowledged: false, message})
            }

            const result = await bookingsCollection.insertOne(booking)
            res.send(result)
        })

        app.get('/myorders/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            const query = {email: email}
            const myOrders = await bookingsCollection.find(query).toArray()
            res.send(myOrders)
        })

        app.get('/myProducts/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            const query = {email: email}
            const myProducts = await productsCollection.find(query).toArray()
            res.send(myProducts)
        })

        app.delete('/myProduct/:id', async (req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)}
            const result = await productsCollection.deleteOne(query)
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