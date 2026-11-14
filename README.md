# Raíces Andinas

Aplicación para consultar datos diarios de NASA POWER en distritos de los Andes peruanos. La API consulta temperatura media y mínima a 2 m, precipitación y humedad relativa del aire. Los valores corresponden a una celda regional y pueden tener retraso; no representan una medición de la parcela ni la humedad del suelo.

El indicador de temperatura mínima es orientativo: rojo a 0 °C o menos, amarillo entre 0 y 4 °C, y verde por encima de 4 °C. Describe el día de los datos y no constituye un pronóstico ni una alerta oficial de helada.

## Ejecutar localmente

En una terminal, desde la raíz del proyecto:

```powershell
python -m venv .venv
.\.venv\Scripts\python -m pip install -r Backend/requirements.txt
.\.venv\Scripts\python -m uvicorn Backend.main:app --port 8000
```

En otra terminal:

```powershell
cd frontend
npm install
npm start
```

Abre http://localhost:3000. El backend necesita acceso a internet para consultar NASA POWER. Por defecto el frontend usa `http://127.0.0.1:8000`; se puede cambiar con `REACT_APP_API_URL` antes de iniciarlo. Los puntos son ubicaciones aproximadas. Los resultados se conservan en memoria durante el día UTC; si NASA no responde, la aplicación muestra un error sin sustituirlos por datos simulados.

Fuente y metodología: [NASA POWER Daily API](https://power.larc.nasa.gov/docs/services/api/temporal/daily/).

El calendario permite recorrer todos los meses y muestra el pronóstico diario de corto plazo disponible desde [wttr.in](https://wttr.in/:help), habitualmente tres días. Las fechas fuera de ese período no tienen pronóstico. Este servicio es independiente de NASA POWER y sus resultados se guardan en memoria hasta una hora. Si falla la conexión, se muestra un mensaje y se puede reintentar. El calendario de siembras presenta referencias regionales de SENAMHI y factores a evaluar, no una evaluación individual de la parcela.

El buscador usa el catálogo [ubigeo-peru-aumentado de Jesus M. Castagnetto](https://github.com/jmcastagnetto/ubigeo-peru-aumentado), licencia MIT incluida en `data/LICENCIA-UBIGEO.txt`, filtrado a Junín y Ayacucho y a registros con coordenadas válidas. El catálogo incluye datos censales históricos y puede no contener localidades nuevas ni todas las comunidades. Los puntos identifican ubicaciones aproximadas, no parcelas. La información agroclimática se mantiene regional y no debe interpretarse como validación local de siembra.

El mapa permite alternar entre OpenStreetMap y la vista satelital y aérea World Imagery de Esri. La fecha y resolución de las imágenes varían por lugar; no son imágenes en vivo ni una identificación automática de cultivos. Se requiere conexión a internet para cargar ambas vistas.

La función de ubicación solicita permiso al navegador y marca la posición actual del dispositivo con su precisión estimada; requiere un contexto seguro (localhost o HTTPS). El seguimiento es un historial de observaciones manuales guardadas en el almacenamiento local del navegador, incluida la ubicación disponible al guardar. No se sincroniza ni constituye un diagnóstico automático. El clima continúa utilizando la zona seleccionada, no las coordenadas GPS.

La sección ECOSTRESS consulta NASA CMR para buscar escenas de `ECO_L4G_ESI.002` que intersectan el punto seleccionado en los últimos 180 días y solicita datos diarios NASA POWER del día local de la escena más reciente. La coincidencia de una escena no confirma un píxel válido: aún no se descargan ni procesan ESI, PET, máscaras de nubes/agua o calidad de geolocalización. El acceso a los archivos requiere Earthdata Login; no se muestra un diagnóstico de estrés hasta implementar y verificar esa extracción. Las escenas instantáneas y los datos diarios tienen distinta resolución y escala temporal.
