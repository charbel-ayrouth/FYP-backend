import express from "express"
import path from "path"
import { fileURLToPath } from "url"
import rootRoutes from "./routes/root.js"

const app = express()
const PORT = process.env.PORT || 3500
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

app.use(express.json())

// tell express where to find static files
app.use("/", express.static(path.join(__dirname, "/public")))

// routing all request
app.use("/", rootRoutes)

// routing bad request
app.all("*", (req, res) => {
  res.status(404)
  if (req.accepts("html")) {
    res.sendFile(path.join(__dirname, "/views", "404.html"))
  } else if (req.accepts("json")) {
    res.json({ message: "404 Not Found" })
  } else {
    res.type("txt").send("404 Not Found")
  }
})

app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
