export function decideWillRain({ probTomorrow, threshold = 50 }) {
  const p = Number(probTomorrow);
  if (!Number.isFinite(p) || p < 0 || p > 100) {
    const e = new Error("Probabilidade inválida");
    e.code = "INVALID_PROB";
    e.stage = "decision";
    throw e;
  }

  const t = Number(threshold);
  if (!Number.isFinite(t) || t < 0 || t > 100) {
    const e = new Error("Threshold inválido");
    e.code = "INVALID_THRESHOLD";
    e.stage = "decision";
    throw e;
  }

  return { willRain: p >= t, threshold: t };
  }