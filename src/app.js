import express from "express";
import path from "path";
import { fileURLToPath } from "url";


import { geocodeCity, getDailyForecast } from "./services/meteo.js";

import { decideWillRain } from "./lib/decide.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "..", "public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "..", "views"));

// Rota raiz: mostra formulário
app.get("/", async (req, res) => {
  const q = (req.query.city ?? "").trim();
  if (!q) return res.render("index.ejs", { model: null, error: null });

  try {
    const city = await geocodeCity(q);
    const daily = await getDailyForecast({
      latitude: city.latitude,
      longitude: city.longitude,
      forecast_days: 2,
      timezone: "auto",
    });

    if (!Array.isArray(daily.time) || daily.time.length < 2) {
      throw Object.assign(new Error("Sem dados para amanhã"), { code: "NO_DATA_TOMORROW" });
    }

    const tomorrowISO = daily.time[1];
    const probTomorrow = daily.precipitation_probability_max[1];

    const { willRain, threshold } = decideWillRain({ probTomorrow, threshold: 50 });

    const model = {
      city: {
        query: q,
        name: city.name,
        country: city.country,
        latitude: city.latitude,
        longitude: city.longitude,
        timezone: city.timezone,
      },
      forecast: {
        date: tomorrowISO,
        precipitation_probability_max: probTomorrow,
        threshold,
        willRain,
      },
      meta: { generatedAtISO: new Date().toISOString(), source: "open-meteo" },
    };

    res.render("index.ejs", { model, error: null });
  } catch (err) {
    const status =
      err.code === "INVALID_CITY" ? 400 :
      err.code === "CITY_NOT_FOUND" ? 404 :
      err.code === "INVALID_COORDS" ? 400 :
      err.code === "FORECAST_UNAVAILABLE" ? 502 :
      err.code === "NO_DATA_TOMORROW" ? 502 :
      err.code === "INVALID_PROB" || err.code === "INVALID_THRESHOLD" ? 400 :
      502;

    res.status(status).render("index.ejs", { model: null, error: err.message || "Erro na consulta" });
  }
});

app.post("/consulta", (req, res) => {
  const cityInput = (req.body.city ?? "").trim();
  if (!cityInput) {
    return res.status(400).render("index.ejs", { model: null, error: "Cidade obrigatória" });
  }
  res.redirect(`/?city=${encodeURIComponent(cityInput)}`);
});

// Healthcheck
app.get("/health", (_req, res) => res.status(200).send("ok"));

// Start
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});