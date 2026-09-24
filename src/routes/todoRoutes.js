import express from "express";
import db from "../db.js";

const router = express.Router();

router.get("/", (req, res) => {
    const getTasks = db.prepare('SELECT * FROM tasks WHERE user_id = ?')
    const tasks = getTasks.all(req.userId)
    res.json(tasks)
})

router.post("/", (req, res) => {
    const { task } = req.body
    const insertTodo = db.prepare('INSERT INTO tasks (user_id, task) VALUES (?,?)')
    const result = insertTodo.run(req.userId ,task)
    res.json({id: result.lastInsertRowid, task, completed:0 })
})

router.put("/:id", (req, res) => {
    const {completed} = req.body
    const {id} = req.params
    const updatedTodo = db.prepare('UPDATE tasks SET completed = ? WHERE id = ?')
    updatedTodo.run(completed, id)
    res.json({message : "task completed"})
})

router.delete("/:id", (req, res) => {
    const {id} = req.params 
    const userId = req.userId
    const deleteTodo = db.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?')
    deleteTodo.run(id, userId)
    res.json({message : "task deleted"})
})

export default router;