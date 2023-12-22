const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const {
  MongoClient,
  ServerApiVersion,
  CURSOR_FLAGS,
  ObjectId,
} = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.8sb7n8j.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const taskCollection = client.db("taskManageDB").collection("tasks");

    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    const verifyToken = (req, res, next) => {
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "unauthorized" });
      }
      const token = req.headers.authorization.split(" ")[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "unauthorized" });
        }
        req.decoded = decoded;
        next();
      });
    };

    app.get("/getToDoTask", verifyToken, async (req, res) => {
      const email = req.query.email;
      const taskType = req.query.taskType || "to-do"; 
      const query = { userEmail: email, taskType: taskType };
      const result = await taskCollection
        .find(query)
        .sort({ taskAddDate: -1 })
        .toArray();
      res.send(result);
    });

    app.get("/getOngoingTask", verifyToken, async (req, res) => {
      const email = req.query.email;
      const taskType = req.query.taskType || "ongoing"; 
      const query = { userEmail: email, taskType: taskType };
      const result = await taskCollection
        .find(query)
        .sort({ taskAddDate: -1 })
        .toArray();
      res.send(result);
    });

    app.get("/getCompleteTask", verifyToken, async (req, res) => {
      const email = req.query.email;
      const taskType = req.query.taskType || "complete";
      const query = { userEmail: email, taskType: taskType };
      const result = await taskCollection
        .find(query)
        .sort({ taskAddDate: -1 })
        .toArray();
      res.send(result);
    });

    app.patch('/updateTaskType/:taskId', verifyToken, async (req, res) => {
  const taskId = req.params.taskId;
  const { taskType } = req.body;

  try {
    const result = await taskCollection.updateOne(
      { _id: new ObjectId(taskId) },
      { $set: { taskType: taskType } }
    );

    if (result.modifiedCount === 1) {
      res.status(200).send({ message: 'TaskType updated successfully' });
    } else {
      res.status(404).send({ message: 'Task not found' });
    }
  } catch (error) {
    console.error('Error updating task type:', error);
    res.status(500).send({ message: 'Internal Server Error' });
  }
});

    app.post("/tasks", async (req, res) => {
      const results = req.body;
      const result = await taskCollection.insertOne(results);
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Task Management server is running");
});
app.listen(port, () => {
  console.log(`Task Management server is port ${port}`);
});
