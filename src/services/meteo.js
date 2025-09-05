import axios from "axios";

const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

// Converte cidade -> coordenadas/timezone
export async function geocodeCity(name) {
  const query = (name ?? "").trim();
  if (!query) {
    const e = new Error("Cidade obrigatória");
    e.code = "INVALID_CITY";
    e.stage = "geocoding";
    throw e;
  }

  try {
    const { data } = await axios.get(GEOCODE_URL, {
      params: { name: query, count: 1, language: "pt", format: "json" },
      timeout: 10_000,
    });

    const hit = data?.results?.[0];
    if (!hit) {
      const e = new Error("Cidade não encontrada");
      e.code = "CITY_NOT_FOUND";
      e.stage = "geocoding";
      throw e;
    }

    return {
      query,                  // o que o usuário digitou
      name: hit.name,         // nome normalizado
      country: hit.country,
      latitude: hit.latitude,
      longitude: hit.longitude,
      timezone: hit.timezone,
    };
  } catch (err) {
    if (err.code === "CITY_NOT_FOUND" || err.code === "INVALID_CITY") throw err;

    const e = new Error(err.response?.data?.message || err.message || "Erro de rede");
    e.code = "NETWORK_ERROR";
    e.stage = "geocoding";
    throw e;
  }

  // TODO: chamar GEOCODE_URL com { name, count: 1, language: "pt", format: "json" }
  // TODO: validar results[0] e retornar { name, country, latitude, longitude, timezone }
  // TODO: lançar erro semanticamente claro se não encontrar
  
}

// Busca previsão diária com precipitation_probability_max
export async function getDailyForecast({ latitude, longitude, forecast_days = 2, timezone = "auto" }) {
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    const e = new Error("Coordenadas inválidas");
    e.code = "INVALID_COORDS";
    e.stage = "forecast";
    throw e;
  }

  try {
    const { data } = await axios.get(FORECAST_URL, {
      params: {
        latitude,
        longitude,
        daily: "precipitation_probability_max",
        forecast_days,
        timezone,
      },
      timeout: 10_000,
    });

    const daily = data?.daily;
    const times = daily?.time;
    const probs = daily?.precipitation_probability_max;

    if (!daily || !Array.isArray(times) || !Array.isArray(probs)) {
      const e = new Error("Previsão indisponível");
      e.code = "FORECAST_UNAVAILABLE";
      e.stage = "forecast";
      throw e;
    }

    return {
      time: times,
      precipitation_probability_max: probs,
    };
  } catch (err) {
    if (["INVALID_COORDS", "FORECAST_UNAVAILABLE"].includes(err.code)) throw err;

    const e = new Error(err.response?.data?.message || err.message || "Erro de rede");
    e.code = "NETWORK_ERROR";
    e.stage = "forecast";
    throw e;
  }
  // TODO: chamar FORECAST_URL com params:
  // latitude, longitude, daily=precipitation_probability_max, forecast_days, timezone
  // TODO: validar presença de daily/time e daily/precipitation_probability_max
  // TODO: retornar { time: [...], precipitation_probability_max: [...] }
}