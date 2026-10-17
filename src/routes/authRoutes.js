import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import prisma from "../prismaClient.js";

const router = express.Router();

router.post("/register", async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 8);

    try {
        const user = await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
                todos: {
                    create: {
                        task: "Hello :) add your first task!"
                    }
                }
            }
        })
        
        const token = jwt.sign({ id : user.id }, process.env.JWT_SECRET, { expiresIn: '24h' })
        res.json({ token });
    }
    catch(err){
        if (err.code === "P2002") {
            return res.status(409).send({ message: "Username already exists" });
        }

        console.log(err.message);
        res.sendStatus(503);
    }

})

router.post("/login", async (req, res) => {
    const { username, password } = req.body
    const user = await prisma.user.findUnique({
        where: {
            username: username
        } 
    })
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