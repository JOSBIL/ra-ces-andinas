"""Datos diarios de NASA POWER para los distritos de la aplicación."""
from datetime import date, datetime, timedelta, timezone
from functools import lru_cache
import json
from pathlib import Path
import unicodedata
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import urlopen

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Raíces Andinas API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# Puntos de referencia aproximados; POWER devuelve valores de una celda regional.
LUGARES = {
    "Huancayo": (-12.0651, -75.2049), "Chupuro": (-12.21, -75.28),
    "Tres de Diciembre": (-12.15, -75.24), "Viques": (-12.16, -75.23),
    "Sapallanga": (-12.13, -75.16), "Pucara": (-12.17, -75.23),
    "Ingenio": (-11.92, -75.29), "Huayucachi": (-12.13, -75.23),
    "Ayacucho": (-13.1588, -74.2236), "Cangallo": (-13.63, -74.14),
    "Huanta": (-12.93, -74.25), "Vilcashuaman": (-13.65, -73.95),
}
PARAMETROS = ("T2M", "T2M_MIN", "PRECTOTCORR", "RH2M")
NASA_URL = "https://power.larc.nasa.gov/api/temporal/daily/point"
UBICACIONES = json.loads((Path(__file__).resolve().parent.parent / "data" / "ubicaciones.json").read_text(encoding="utf-8"))
POR_ID = {item["id"]: item for item in UBICACIONES}


def normalizar(texto):
    return ''.join(c for c in unicodedata.normalize('NFKD', texto.casefold()) if not unicodedata.combining(c))


@app.get("/buscar")
def buscar(q: str = ""):
    consulta = normalizar(q.strip())
    if len(consulta) < 2:
        return []
    terminos = consulta.split()
    encontrados = [u for u in UBICACIONES if all(t in normalizar(' '.join((u['nombre'], u['distrito'], u['provincia'], u['region'], u['id']))) for t in terminos)]
    encontrados.sort(key=lambda u: (not normalizar(u['nombre']).startswith(consulta), u['tipo'] != 'Distrito', u['nombre']))
    return encontrados[:40]


def coordenadas(identificador):
    if identificador in LUGARES:
        return LUGARES[identificador]
    if identificador in POR_ID:
        lugar = POR_ID[identificador]
        return lugar['latitud'], lugar['longitud']
    raise HTTPException(status_code=404, detail="Ubicación no encontrada")


@app.get("/")
def read_root():
    return {"mensaje": "Raíces Andinas API funcionando", "fuente": "NASA POWER"}


@app.get("/distritos")
def distritos():
    return [{"nombre": nombre, "latitud": coords[0], "longitud": coords[1]} for nombre, coords in LUGARES.items()]


def procesar_respuesta(payload):
    """Busca el último día con las cuatro variables válidas en la misma fecha."""
    try:
        series = payload["properties"]["parameter"]
        fill = payload.get("header", {}).get("fill_value", -999)
        fechas = sorted(set.intersection(*(set(series[p]) for p in PARAMETROS)), reverse=True)
        for fecha in fechas:
            valores = [series[p][fecha] for p in PARAMETROS]
            if all(isinstance(v, (int, float)) and not isinstance(v, bool) and v != fill and v > -999 for v in valores):
                return fecha, dict(zip(PARAMETROS, valores))
    except (KeyError, TypeError, ValueError):
        pass
    raise ValueError("NASA POWER no devolvió datos diarios completos para esta ubicación.")


@lru_cache(maxsize=128)
def consultar_nasa(latitud, longitud, fecha_cache):
    fin = date.fromisoformat(fecha_cache)
    inicio = fin - timedelta(days=45)
    query = urlencode({"parameters": ",".join(PARAMETROS), "community": "AG", "longitude": longitud,
                       "latitude": latitud, "start": inicio.strftime("%Y%m%d"), "end": fin.strftime("%Y%m%d"),
                       "format": "JSON", "time-standard": "LST"})
    with urlopen(f"{NASA_URL}?{query}", timeout=25) as respuesta:
        payload = json.load(respuesta)
    fecha, valores = procesar_respuesta(payload)
    return fecha, valores


@app.get("/semaforo/{distrito}")
def get_semaforo(distrito: str):
    latitud, longitud = coordenadas(distrito)
    try:
        fecha, valores = consultar_nasa(latitud, longitud, datetime.now(timezone.utc).date().isoformat())
    except (HTTPError, URLError, TimeoutError, OSError, ValueError, json.JSONDecodeError) as exc:
        raise HTTPException(status_code=503, detail="No se pudieron obtener datos de NASA POWER. Inténtalo de nuevo más tarde.") from exc
    minima = valores["T2M_MIN"]
    return {
        "distrito": distrito, "latitud": latitud, "longitud": longitud,
        "fecha": datetime.strptime(fecha, "%Y%m%d").date().isoformat(),
        "fuente": "NASA POWER", "temperatura": valores["T2M"], "temperatura_minima": minima,
        "precipitacion": valores["PRECTOTCORR"], "humedad_relativa": valores["RH2M"],
        "color": "rojo" if minima <= 0 else "amarillo" if minima <= 4 else "verde",
    }


@lru_cache(maxsize=128)
def consultar_pronostico(latitud, longitud, hora_cache):
    with urlopen(f"https://wttr.in/{latitud},{longitud}?format=j1", timeout=25) as respuesta:
        dias = json.load(respuesta)["weather"]
    if not dias:
        raise ValueError("Pronóstico incompleto")
    return [{"fecha": dia["date"], "minima": float(dia["mintempC"]), "maxima": float(dia["maxtempC"])} for dia in dias]


@app.get("/pronostico/{distrito}")
def pronostico(distrito: str):
    latitud, longitud = coordenadas(distrito)
    try:
        dias = consultar_pronostico(latitud, longitud, datetime.now(timezone.utc).strftime("%Y-%m-%dT%H"))
    except (HTTPError, URLError, TimeoutError, OSError, ValueError, KeyError, TypeError) as exc:
        raise HTTPException(status_code=503, detail="No se pudo obtener el pronóstico. Inténtalo más tarde.") from exc
    return {"distrito": distrito, "fuente": "wttr.in", "dias": dias}


@lru_cache(maxsize=128)
def buscar_escenas_ecostress(latitud, longitud, fecha_cache):
    fin = date.fromisoformat(fecha_cache)
    inicio = fin - timedelta(days=180)
    parametros = urlencode({"collection_concept_id": "C2076110703-LPCLOUD", "point": f"{longitud},{latitud}",
                            "temporal": f"{inicio.isoformat()}T00:00:00Z,{fin.isoformat()}T23:59:59Z",
                            "sort_key": "-start_date", "page_size": 5})
    with urlopen(f"https://cmr.earthdata.nasa.gov/search/granules.json?{parametros}", timeout=30) as respuesta:
        entradas = json.load(respuesta)["feed"]["entry"]
    return [{"id": e["title"], "inicio_utc": e["time_start"]} for e in entradas if e.get("time_start") and e.get("title")]


@app.get("/ecostress/{distrito}")
def ecostress(distrito: str):
    latitud, longitud = coordenadas(distrito)
    try:
        escenas = buscar_escenas_ecostress(latitud, longitud, datetime.now(timezone.utc).date().isoformat())
    except (HTTPError, URLError, TimeoutError, OSError, ValueError, KeyError, TypeError) as exc:
        raise HTTPException(status_code=503, detail="No se pudo consultar el catálogo ECOSTRESS de NASA.") from exc
    power_mismo_dia = None
    if escenas:
        fecha_local = datetime.fromisoformat(escenas[0]["inicio_utc"].replace("Z", "+00:00")).astimezone(timezone(timedelta(hours=-5))).date()
        cadena = fecha_local.strftime("%Y%m%d")
        query = urlencode({"parameters": ",".join(PARAMETROS), "community": "AG", "longitude": longitud, "latitude": latitud,
                           "start": cadena, "end": cadena, "format": "JSON", "time-standard": "LST"})
        try:
            with urlopen(f"{NASA_URL}?{query}", timeout=25) as respuesta:
                fecha, valores = procesar_respuesta(json.load(respuesta))
            power_mismo_dia = {"fecha": fecha_local.isoformat(), "temperatura": valores["T2M"],
                               "minima": valores["T2M_MIN"], "lluvia": valores["PRECTOTCORR"], "humedad": valores["RH2M"]}
        except (HTTPError, URLError, TimeoutError, OSError, ValueError, KeyError, TypeError):
            pass
    return {"ubicacion": distrito, "latitud": latitud, "longitud": longitud, "escenas": escenas, "power_mismo_dia": power_mismo_dia,
            "producto": "ECO_L4G_ESI.002", "fuente": "NASA CMR", "periodo_dias": 180,
            "aviso": "La coincidencia de la escena no confirma un píxel válido. ESI, PET y máscaras de calidad aún no se han extraído."}
