import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Proxy for Open Library
  app.get("/api/search", async (req, res) => {
    try {
      const queryParams = new URLSearchParams(req.query as any);
      const targetUrl = `https://openlibrary.org/search.json?${queryParams.toString()}`;
      
      const response = await fetch(targetUrl);
      if (!response.ok) {
        throw new Error(`Open Library API responded with status: ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Proxy error:", error);
      res.status(500).json({ error: "Failed to fetch from Open Library API" });
    }
  });

  app.get("/api/trending", async (req, res) => {
    try {
      const targetUrl = `https://openlibrary.org/trending/daily.json?limit=10`;
      
      const response = await fetch(targetUrl);
      if (!response.ok) {
        throw new Error(`Open Library API responded with status: ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Proxy error:", error);
      res.status(500).json({ error: "Failed to fetch from Open Library API" });
    }
  });

  app.get("/api/works/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const targetUrl = `https://openlibrary.org/works/${id}.json`;
      
      const response = await fetch(targetUrl);
      if (!response.ok) {
        throw new Error(`Open Library API responded with status: ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Proxy error:", error);
      res.status(500).json({ error: "Failed to fetch from Open Library API" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
