const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config();
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.uj2jz.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const app = express();
app.use(bodyParser.json());
app.use(cors());
const serviceAccount = require("./Configs/agency.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIRE_DB
});

const port = 4000;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

client.connect(err => {
  const creativeAgencyInfoCollection = client.db("creativeAgency").collection("creativeAgencyInfo");
  const customerFeedbackCollection = client.db("creativeAgency").collection("customersFeedback");
  const addServiceCollection = client.db("creativeAgency").collection("addService");
  const makeAdminCollection = client.db("creativeAgency").collection("makeAdmin");

  // add Customer order data database---------------------------/
  app.post('/customerOrder', (req, res) => {
    creativeAgencyInfoCollection.insertOne(req.body)
      .then(result => {
        res.send(result.insertedCount > 0)
      })
  });

  //all Customer Data-----/
  app.get('/allCustomerData', (req, res) => {
    creativeAgencyInfoCollection.find({})
      .toArray((err, documents) => {
        res.send(documents);
      })

  })

  app.get('/CustomersByData', (req, res) => {
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith('Bearer ')) {
      const idToken = bearer.split(' ')[1];
      admin.auth().verifyIdToken(idToken)
        .then(function (decodedToken) {
          const tokenEmail = decodedToken.email;
          const queryEmail = req.query.email;
          if (tokenEmail == queryEmail) {
            creativeAgencyInfoCollection.find({
              email: queryEmail
            })
              .toArray((err, documents) => {
                res.status(200).send(documents);
              })
          } else {
            res.status(401).send('un-authorized access')
          };
        }).catch(function (error) {
          res.status(401).send('un-authorized access')
        });

    } else {
      res.status(401).send('un-authorized access')
    };

  });

  // Customer Feedback add to database ------/
  app.post('/addFeedback', (req, res) => {
    customerFeedbackCollection.insertOne(req.body)
      .then(result => {
        res.send(result.insertedCount > 0)
      });
  });

  // get Customer Feedback ---/
  app.get('/feedbacksByData', (req, res) => {
    customerFeedbackCollection.find({})
      .toArray((err, documents) => {
        res.send(documents);
      });
  });

  // admin email add database
  app.post('/makeAdmin', (req, res) => {
    makeAdminCollection.insertOne(req.body)
      .then(result => {
        res.send(result.insertedCount > 0)
      });
  });

  // check admin email or not
  app.get('/checkAdminEmailOrNot', (req, res) => {
    makeAdminCollection.find({
      email: req.query.email
    })
      .toArray((err, documents) => {
        if (documents.length === 0) {
          res.send({
            admin: false
          })
        } else {
          res.send({
            admin: true
          })
        }
      });

  });

  // admin data here------------------------------------
  app.post('/addServices', (req, res) => {
    addServiceCollection.insertOne(req.body)
      .then(result => {
        res.send(result.insertedCount > 0)
      })
  });

  // get all Services data ........./
  app.get('/ServicesByData', (req, res) => {
    addServiceCollection.find({})
      .toArray((err, documents) => {
        res.send(documents);
      });
  });
});

app.get("/", (req, res) => {
  res.send("node is working")
})
app.listen(process.env.PORT || port);