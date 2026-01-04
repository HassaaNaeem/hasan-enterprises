import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import "dotenv/config";
const port = process.env.PORT;
console.log(port);

import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./config/database.js";
import routes from "./routes/index.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import Place from "./models/Place.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

connectDB();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);


// Conditional body parser middleware - skips file upload routes
app.use((req, res, next) => {
  // Skip body parsing for file upload routes
  if (req.path.includes("/documents") && req.method === "POST") {
    console.log("Skipping body parser for file upload route:", req.path);
    return next();
  }

  // Apply body parsers for all other routes
  express.json()(req, res, next);
});

app.use((req, res, next) => {
  // Skip for file upload routes
  if (req.path.includes("/documents") && req.method === "POST") {
    return next();
  }

  express.urlencoded({ extended: true })(req, res, next);
});

app.use(cookieParser());
app.use(morgan("dev"));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Hasan Enterprises Plot Management API",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      plots: "/api/plots",
      payments: "/api/payments",
      cases: "/api/cases",
      dashboard: "/api/dashboard",
    },
  });
});

app.get("/health", (req, res) => {
  res.json({ success: true, message: "Server is healthy" });
});

// All routes
app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

const initializePlace = async () => {
  try {
    const existingPlace = await Place.findOne({ name: "Hassan Enterprises" });
    if (!existingPlace) {
      await Place.create({ name: "Hassan Enterprises" });
      console.log('Default place "Hassan Enterprises" created');
    }
  } catch (error) {
    console.error("Error initializing place:", error.message);
  }
};

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", async () => {
  console.log(`Server running on port ${PORT}`);
  await initializePlace();
});

export default app;
