import express from "express";
import 'dotenv/config'
const app = express()
const port = process.env.PORT || 3000
app.use(express.json())

app.get("/", (req, res) => {
    res.send("Hello from Gopal and his legacy")
})

const teaData = []
let nextId = 1

//? add a new tea
app.post("/teas", (req, res) => {
    const { name, price } = req.body
    let tea = { id: nextId++, name, price }
    teaData.push(tea)
    res.status(201).send(teaData)
})

//? get all teas
app.get("/teas", (req, res) => {
    if (teaData.length === 0) return res.status(404).send("NOT ANY TEA FOUND")
    res.status(201).send(teaData)
})

//? get a tea with id
app.get("/teas/:id", (req, res) => {
    let oneTea = teaData.find((t) => t.id === parseInt(req.params.id))
    if (!oneTea) return res.status(404).send("TEA NOT FOUND")

    res.status(201).send(oneTea)
})

//? update a tea
app.put("/teas/:id", (req, res) => {
    let oneTea = teaData.find((t) => t.id === parseInt(req.params.id))
    if (!oneTea) return res.status(404).send("TEA NOT FOUND")

    const { name, price } = req.body
    oneTea.name = name
    oneTea.price = price
    res.status(201).send(oneTea)
})

//? delete a tea
app.delete("/teas/:id", (req, res) => {
    let index = teaData.findIndex((t) => t.id === parseInt(req.params.id))
    if (index === -1) {
        return res.status(404).send("tea not found")
    }

    teaData.splice(index, 1)
    return res.status(404).send("deleted")
})




app.listen(port, () => {
    console.log(`App is running on port ${port}`);

})