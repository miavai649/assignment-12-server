const express = require('express');
const app = express();
require('dotenv').config();
const cors = require('cors')
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
        
        app.get('/catagories', async (req, res) => {
            const query = {}
            const result = await catagoriesCollection.find(query).toArray()
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