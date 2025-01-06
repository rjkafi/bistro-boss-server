const express=require('express');
const app = express();
const cors= require('cors');
const port=process.env.PORT || 5000;
require('dotenv').config()

// Middleware
app.use(cors())
app.use(express.json());


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.owhyi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const menuCollection=client.db("bistroDB").collection("menu");
    const reviewsCollection=client.db("bistroDB").collection("reviews");
   
    app.get('/menu',async(req,res)=>{
        const result= await menuCollection.find().toArray();
        res.send(result);
        console.log(result)
    })
    app.get('/reviews',async(req,res)=>{
        const result= await reviewsCollection.find().toArray();
        res.send(result);
        console.log(result)
    })
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req,res)=>{
    res.send("Bistro Boss Is Sitting")
});
app.listen(port, ()=>{
    console.log(`Bistro Boss is running on PORT ${port}`)
})