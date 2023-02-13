import { format } from "date-fns"
import { v4 as uuid } from "uuid"
import fs from "fs"
import { mkdir, appendFile } from "node:fs/promises"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const logEvents = async (message, logFileName) => {
  const dateTime = format(new Date(), "yyyyMMdd\tHH:mm:ss")
  const logItem = `${dateTime}\t${uuid()}\t${message}\n`

  try {
    // if folder does not exist create it
    if (!fs.existsSync(path.join(__dirname, "..", "logs"))) {
      await mkdir(path.join(__dirname, "..", "logs"))
    }
    await appendFile(path.join(__dirname, "..", "logs", logFileName), logItem)
  } catch (error) {
    console.log(error)
  }
}

const logger = (req, res, next) => {
  logEvents(`${req.method}\t${req.url}\t${req.headers.origin}`, "reqLog.log")
  console.log(`${req.method} ${req.path}`)
  next()
}

export { logEvents, logger }
