"# Vai chover amanh�?" 

# Vai chover amanhã?

App Node.js/Express + EJS que usa a Open-Meteo (geocoding + forecast diário) para indicar se vai chover **amanhã** na cidade pesquisada.

## Stack
- Node.js, Express, Axios
- EJS (views), CSS simples
- Padrão PRG (Post → Redirect → Get)

## Rodar local
```bash
npm i
npm run dev
# abre http://localhost:3000

Como usar:

1)Digite uma cidade e clique em Consultar.

2)A página mostra a data de amanhã, a probabilidade (máx.) de precipitação e a decisão (vai chover ou não).

Estrutura:

/public        # styles.css
/views         # index.ejs
/src
  /lib         # decide.js (regra)
  /services    # meteo.js (APIs Open-Meteo)
  app.js       # rotas e orquestração

  Regra de decisão:

  Usa daily.precipitation_probability_max[1] (amanhã).

  willRain = probTomorrow >= 50 
