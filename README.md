# 🌱 Raíces Andinas (Andean Roots)

**Raíces Andinas** es una aplicación web progresiva (PWA) diseñada para empoderar a los pequeños agricultores de los Andes peruanos. Utiliza datos satelitales abiertos de la NASA para traducir información climática compleja en un "semáforo agrícola" fácil de entender, alertando sobre riesgos de heladas y sequías.

## 🚀 El Problema
Los agricultores en zonas altoandinas (como Huancayo, Pucará y Ayacucho) enfrentan pérdidas de cultivos debido a eventos climáticos extremos. Aunque la NASA proporciona datos vitales (como la humedad del suelo del satélite SMAP y la temperatura de MODIS), estos se encuentran en formatos científicos inaccesibles para el usuario final.

## 💡 La Solución
Nuestra app cierra la brecha entre los datos espaciales y el campo. El agricultor ingresa su distrito y recibe:
*   **Semáforo de Riesgo:** Verde (óptimo), Amarillo (precaución), Rojo (peligro).
*   **Datos en tiempo real:** Humedad del suelo y temperatura.
*   **Alertas de Heladas:** Avisos tempranos para proteger los cultivos.

## 🛠️ Tecnologías Utilizadas
*   **Frontend:** React.js, Leaflet (para el mapa interactivo), CSS.
*   **Backend:** Python, FastAPI.
*   **Ciencia de Datos:** Librería `earthaccess` (conexión con la NASA), `xarray` (procesamiento de datos satelitales), `pandas`.
*   **Datos:** NASA Earthdata (Misión SMAP y MODIS).

## ⚙️ Cómo ejecutar el proyecto localmente

### 1. Clonar el repositorio
```bash
git clone https://github.com/TU_USUARIO/raices-andinas.git
cd raices-andinas