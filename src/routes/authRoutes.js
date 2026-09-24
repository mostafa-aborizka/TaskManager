import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import  db  from "../db.js";

const router = express.Router();

router.post("/register", (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 8);

    try {
        const insertUser = db.prepare("INSERT INTO users (username, password) VALUES (?, ?)")
        const result = insertUser.run(username, hashedPassword)
        const defaultTask = "Hello :) add your first task!"
        const insertTask = db.prepare("INSERT INTO tasks (user_id, task) VALUES (?, ?)")
        insertTask.run(result.lastInsertRowid, defaultTask)
        
        const token = jwt.sign({ id : result.lastInsertRowid }, process.env.JWT_SECRET, { expiresIn: '24h' })
        res.json({ token });
    }
    catch(err){
        console.log(err.message);
        res.sendStatus(503);
    }

})

router.post("/login", (req, res) => {
    const { username, password } = req.body
    const getUser = db.prepare("SELECT * FROM users WHERE username = ?")
    const user = getUser.get(username)

    if (!user) {
        return res.status(404).send({ message: "User not found" });
    }
    const passwordIsValid = bcrypt.compareSync(password, user.password)
    if (!passwordIsValid) {
        return res.status(404).send({ message: "Invalid password" });
    }
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' }) 
    res.json({ token });   
})

export default router;