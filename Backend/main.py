from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"mensaje": "Raíces Andinas API funcionando"}

@app.get("/semaforo/{distrito}")
def get_semaforo(distrito: str):
    # Datos simulados basados en zonas agrícolas reales
    datos_simulados = {
        "Huancayo": {"color": "verde", "humedad": 0.35, "temperatura": 18.5, "alerta_heladas": False},
        "Pucara": {"color": "amarillo", "humedad": 0.22, "temperatura": 12.0, "alerta_heladas": True},
        "Ayacucho": {"color": "rojo", "humedad": 0.10, "temperatura": 8.0, "alerta_heladas": True},
        # Nuevas zonas Junín
        "Chupuro": {"color": "rojo", "humedad": 0.12, "temperatura": 6.5, "alerta_heladas": True},
        "Tres de Diciembre": {"color": "amarillo", "humedad": 0.20, "temperatura": 10.0, "alerta_heladas": False},
        "Viques": {"color": "verde", "humedad": 0.40, "temperatura": 19.0, "alerta_heladas": False},
        "Sapallanga": {"color": "verde", "humedad": 0.38, "temperatura": 18.0, "alerta_heladas": False},
        "Ingenio": {"color": "amarillo", "humedad": 0.25, "temperatura": 14.0, "alerta_heladas": True},
        "Huayucachi": {"color": "verde", "humedad": 0.33, "temperatura": 17.5, "alerta_heladas": False},
        # Nuevas zonas Ayacucho
        "Cangallo": {"color": "rojo", "humedad": 0.08, "temperatura": 5.0, "alerta_heladas": True},
        "Huanta": {"color": "amarillo", "humedad": 0.18, "temperatura": 11.0, "alerta_heladas": True},
        "Vilcashuaman": {"color": "rojo", "humedad": 0.10, "temperatura": 7.5, "alerta_heladas": True}
    }
    
    resultado = datos_simulados.get(distrito)
    if resultado:
        return resultado
    else:
        return {"error": "Distrito no encontrado"}