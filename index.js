const express = require("express");
const app = express();
const port = 8000;

const cors = require("cors");
app.use(cors());


const dbPath = path.resolve('/tmp', 'db.sqlite3');


const { Sequelize, DataTypes } = require("sequelize");

const sequelize = new Sequelize(`sqlite:${dbPath}`);

const Todo = sequelize.define("Todo", {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  create: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: new Date(),
  },
  done: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
});

//  sequelize.sync({ force: true }).then(() => {
//     console.log(`Database & tables created!`);
// })

sequelize
  .authenticate()
  .then(() => {
    console.log("Connection has been established successfully.");
  })
  .catch((error) => {
    console.error("Unable to connect to the database:", error);
  });

app.use(express.json());
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url} ${new Date()}`);
    next();
});

// Catch async errors to error handling middleware:
require("express-async-errors");

const router = express.Router();

router.get("/", async (req, res) => {
  const todos = await Todo.findAndCountAll();
  res.status(200).json({
    error: false,
    data: todos,
  });
});

router.post("/", async (req, res, next) => {
  const { title, description, done } = req.body;
  if (!title) {
    const error = new Error("title field is required");
    error.cause = "missing_fields";
    error.statusCode = 400;
    next(error);
  } else {
    const newTodo = await Todo.create({
      title,
      description,
      create: new Date(),
      done: done || false,
    });
    res.status(201).send({
      error: false,
      data: newTodo,
    });
  }
});

router.get("/:id", async (req, res, next) => {
    const id = req.params.id;
    const todoItem = await Todo.findByPk(id);
    if (!todoItem) {
      const error = new Error("todo not found");
      error.cause = "tasks_not_found";
      error.statusCode = 404;
      next(error);
    } else {
      res.status(200).send({
        error: false,
        data: todoItem,
      });
    }
});

router.put("/:id", async (req, res, next) => {
    const id = req.params.id;
    const { title, description, done } = req.body;
    const todoItem = await Todo.findByPk(id);
    if (!todoItem) {
        const error = new Error("todo not found");
        error.cause = "not_found";
        error.statusCode = 404;
        next(error);
    } else {
        todoItem.title = title || todoItem.title;
        todoItem.description = description || todoItem.description;
        todoItem.done = done !== undefined ? done : todoItem.done;
        await todoItem.save();
        res.status(200).send({
        error: false,
        data: todoItem,
        });
    }
});

router.delete("/:id", async (req, res, next) => {
    const id = req.params.id;
    const todoItem = await Todo.findByPk(id);
    if (!todoItem) {
        const error = new Error("todo not found");
        error.cause = "not_found";
        error.statusCode = 404;
        next(error);
    } else {
        await todoItem.destroy();
        res.status(204).send();
    }
});

app.use(router);

// Error handling middleware:
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).send({
    error: true,
    message: err.message,
    cause: err.cause,
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});