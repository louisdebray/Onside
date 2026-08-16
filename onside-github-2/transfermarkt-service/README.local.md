# Lancement local (Onside)

Ce dossier contient le repo cloné `felipeall/transfermarkt-api` (FastAPI, Python/Poetry).

## Démarrage rapide

```bash
cd transfermarkt-service
pip install -r requirements.txt
python app/main.py
```

Le service écoute par défaut sur `http://localhost:8000`, ce qui correspond à
`TRANSFERMARKT_SERVICE_URL` par défaut dans le backend Node.

Alternative avec Poetry (méthode recommandée par le projet upstream) :

```bash
poetry install --no-root
export PYTHONPATH=$PYTHONPATH:$(pwd)
python app/main.py
```

Alternative Docker :

```bash
docker build -t transfermarkt-api .
docker run -d -p 8000:8000 transfermarkt-api
```

## Endpoints utilisés par le backend Node

- `GET /clubs/{club_id}/players`
- `GET /players/{player_id}/transfers`
- `GET /players/{player_id}/market_value`

Voir `README.md` (upstream) pour la liste complète des endpoints.
