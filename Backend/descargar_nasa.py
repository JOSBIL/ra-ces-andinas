import earthaccess
import xarray as xr
import json
import os

# 1. Iniciar sesión en la NASA
print("Conectando con la NASA...")
os.environ["NETRC"] = os.path.join(os.getcwd(), ".netrc")
earthaccess.login(strategy="netrc")

# 2. Buscar datos de humedad (SMAP) para la zona de los Andes (Huancayo)
print("Buscando datos de humedad del suelo...")
results = earthaccess.search_data(
    short_name="SPL4SMGP", 
    bounding_box=(-75.5, -12.5, -74.5, -11.5), 
    temporal=("2023-01-01", "2023-01-02"), 
    count=1 
)

# 3. Descargar el archivo
if results:
    print("Descargando archivo (esto puede tardar un poco)...")
    files = earthaccess.download(results, "./")
    archivo_descargado = files[0]
    print(f"Archivo descargado: {archivo_descargado}")
    
    print("Archivo descargado. (Estructura compleja, usaremos datos simulados para el prototipo)")
    
    # 4. Usar los datos simulados (los que ya tiene la app)
    import os
    ruta_json = os.path.join(os.path.dirname(os.getcwd()), "data", "semaforo_simulado.json")

    
    with open(ruta_json, "r", encoding="utf-8") as f:
        datos = json.load(f)
    
    # Mantenemos los valores simulados
    datos["Huancayo"]["humedad"] = 0.35
    datos["Huancayo"]["color"] = "verde"
    
    with open(ruta_json, "w", encoding="utf-8") as f:
        json.dump(datos, f, indent=2, ensure_ascii=False)
        
    print("¡Datos guardados en el JSON de la app con éxito!")
    
else:
    print("No se encontraron datos para esa fecha.")