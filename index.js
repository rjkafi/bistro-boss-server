const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.owhyi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server
    await client.connect();

    const db = client.db("bistroDB");
    const usersCollection = db.collection("users");
    const menuCollection = db.collection("menu");
    const reviewsCollection = db.collection("reviews");
    const cartCollection = db.collection("carts");

    // ~~~~~~~~~~JWT Related Api~~~~~~
    // JWT Token creation
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '1h',
      });
      res.send({ token });
    });
    //  Verify token
    const verifyToken=(req,res,next)=>{
      console.log("inside verify token", req.headers.authorization)
      console.log(req.headers);
      if(!req.headers.authorization){
        return res.status(401).send({message:"UnAthorized Access"})
      }
      const Token=req.headers.authorization.split(' ')[1]
      jwt.verify(Token, process.env.ACCESS_TOKEN_SECRET, (err, decoded)=>{
        if(err){
          return  res.status(401).send({message:"UnAthorized  Access"})
        }
        req.decoded=decoded;
        next();
      })
     
    }

    // verify admin
    const verifyAdmin= async(req,res,next)=>{
      const email= req.decoded.email;
      const query={email : email}
      const user= await usersCollection.findOne(query);
      const isAdmin = user?.role === "admin";
      if(!isAdmin){
       return res.status(403).send({message: " Forbidden Access"})
      }
      next();
    }

    // ~~~~Admin Related Api ~~~~~
    app.get('/users/admin/:email', verifyToken,async(req,res)=>{
      const email=req.params.email;
      if(!email == req.decoded.email){
        return res.status(403).send({message: " Forbidden Access"})
      }
      const query={email: email}
      const user= await usersCollection.findOne(query);
      let admin= false;
      if(user){
        admin = user?.role === " admin"
      }
      res.send({admin});
    })


    // ~~~~~Users Related  API~~~~~~
    app.get('/users',verifyToken, verifyAdmin, async (req, res) => {
      // console.log(req.headers);
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    app.post('/users', async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await usersCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: 'User already exists', insertedId: null });
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    app.delete('/users/:id',verifyToken,verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    });

    app.patch('/user/admin/:id', verifyToken,verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: { role: 'admin' },
      };
      const result = await usersCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    // Cart API
    app.get('/carts', async (req, res) => {
      const result = await cartCollection.find().toArray();
      res.send(result);
    });

    app.post('/carts', async (req, res) => {
      const cart = req.body;
      const result = await cartCollection.insertOne(cart);
      res.send(result);
    });

    app.delete('/carts/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await cartCollection.deleteOne(query);
      res.send(result);
    });

    // ~~~~~~~ Menu Related API~~~~~~~~~
    app.get('/menu', async (req, res) => {
      const result = await menuCollection.find().toArray();
      res.send(result);
    });
    // To take specific menu's id for update
    app.get('/menu/:id', async(req,res)=>{
      const id=req.params.id;
      const query={_id: new ObjectId(id)};
      const result= await menuCollection.findOne(query);
      res.send(result);
    })
    // Update menu
    app.patch('/menu/:id',async(req,res)=>{
      const item=req.body;
      const id=req.params.id;
      const filter= { _id: new ObjectId(id)}
      const updatedDoc={
        $set:{
          name:item.name,
          category:item.category,
          price: item.price,
          recipe: item.recipe,
          image:item.image
        }
      }

      const result =await menuCollection.updateOne(filter, updatedDoc);
      res.send(result)

    })
    // Post a menu
    app.post('/menu',verifyToken, verifyAdmin, async (req,res)=>{
      const item=req.body;
      const result =await menuCollection.insertOne(item)
      res.send(result);
    })
    // delete a specifc menu
    app.delete('/menu/:id',verifyToken,verifyAdmin, async(req,res)=>{
      const id=req.params.id;
      const query={_id: new ObjectId(id)};
      const result = await menuCollection.deleteOne(query);
      res.send(result);
    })
  // ~~~~~~ Get Reviews Related Api~~~~~~~~~~~ 
    app.get('/reviews', async (req, res) => {
      const result = await reviewsCollection.find().toArray();
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Uncomment if you want to close the connection after each run
    // await client.close();
  }
}

run().catch(console.dir);

app.get('/', (req, res) => {
  res.send("Bistro Boss Is Sitting");
});

app.listen(port, () => {
  console.log(`Bistro Boss is running on PORT ${port}`);
});
