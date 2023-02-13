import allowedOrigins from "./allowedOrigins.js"

const corsOptions = {
  origin: (origin, callback) => {
    // only APIs in allowedOrigins and software on the pc (postman ...)
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true) // first parameter error, second allowed boolean
    } else {
      callback(new Error("Not allowed by CORS"))
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
}

export default corsOptions
