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
    datos_simulados = {
        "Huancayo": {"color": "verde", "humedad": 0.35, "temperatura": 18.5, "alerta_heladas": False},
        "Pucara": {"color": "amarillo", "humedad": 0.22, "temperatura": 12.0, "alerta_heladas": True},
        "Ayacucho": {"color": "rojo", "humedad": 0.10, "temperatura": 8.0, "alerta_heladas": True}
    }
    
    resultado = datos_simulados.get(distrito)
    if resultado:
        return resultado
    else:
        return {"error": "Distrito no encontrado"}