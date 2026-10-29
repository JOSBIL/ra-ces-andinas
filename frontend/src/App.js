import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Corregir un pequeño error visual de los íconos del mapa
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// 🌍 DICCIONARIO DE 3 IDIOMAS (SIN EMOJIS)
const textos = {
  es: {
    titulo: <img src="/logo.png" alt="Raíces Andinas" style={{ height: '60px', margin: '0 auto', display: 'block' }} />,
    subtitulo: "Selecciona un distrito para ver su semáforo:",
    resultados: "Resultados",
    semaforo: "Semáforo",
    humedad: "Humedad",
    temperatura: "Temperatura",
    heladas: "Alerta de heladas",
    si: "Sí ⚠️", 
    no: "No",
  },
  qu: {
    titulo: <img src="/logo.png" alt="Raíces Andinas" style={{ height: '60px', margin: '0 auto', display: 'block' }} />,
    subtitulo: "Huk distritota akllay, semáforonta rikunaykipaq:", 
    resultados: "Ruwasqa",
    semaforo: "Semáforo",
    humedad: "Humedad",
    temperatura: "Temperatura",
    heladas: "Chullu yaykuy",
    si: "Arí ⚠️", 
    no: "Mana",
  },
  en: {
    titulo: <img src="/logo.png" alt="Raíces Andinas" style={{ height: '60px', margin: '0 auto', display: 'block' }} />,
    subtitulo: "Select a district to see its status:", 
    resultados: "Results",
    semaforo: "Status",
    humedad: "Humidity",
    temperatura: "Temperature",
    heladas: "Frost Alert",
    si: "Yes ⚠️", 
    no: "No",
  }
};

function App() {
  const [distrito, setDistrito] = useState('Huancayo');
  const [datos, setDatos] = useState(null);
  const [idioma, setIdioma] = useState('es'); 

  const consultarSemaforo = async (nombreDistrito) => {
    setDistrito(nombreDistrito);
    try {
      const respuesta = await fetch(`http://127.0.0.1:8000/semaforo/${nombreDistrito}`);
      const datosJson = await respuesta.json();
      setDatos(datosJson);
    } catch (error) {
      console.error("Error conectando con el backend", error);
    }
  };

  const t = textos[idioma]; 

  return (
    <div style={{ height: '100vh', width: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* Barra superior con el selector de idiomas SIN EMOJIS */}
      <div style={{ padding: '15px', backgroundColor: '#2E7D32', color: 'white', textAlign: 'center', position: 'relative' }}>
        
        <div style={{ position: 'absolute', right: '20px', top: '20px' }}>
          <select 
            onChange={(e) => setIdioma(e.target.value)} 
            value={idioma} 
            style={{ padding: '8px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            <option value="es">Español</option>
            <option value="qu">Quechua</option>
            <option value="en">English</option>
          </select>
        </div>

        {/* Aquí se muestra el logo */}
        <div>{t.titulo}</div>
        
        <p style={{ margin: 0, marginTop: '10px' }}>{t.subtitulo}</p>
        
        <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
          <button onClick={() => consultarSemaforo('Huancayo')} style={{ padding: '8px 15px', borderRadius: '5px', border: 'none', cursor: 'pointer' }}>Huancayo</button>
          <button onClick={() => consultarSemaforo('Pucara')} style={{ padding: '8px 15px', borderRadius: '5px', border: 'none', cursor: 'pointer' }}>Pucará</button>
          <button onClick={() => consultarSemaforo('Ayacucho')} style={{ padding: '8px 15px', borderRadius: '5px', border: 'none', cursor: 'pointer' }}>Ayacucho</button>
        </div>
      </div>

      {/* Mapa de fondo */}
      <div style={{ flex: 1 }}>
        <MapContainer center={[-12.0464, -77.0428]} zoom={6} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={[-12.0651, -75.2049]}><Popup>Huancayo</Popup></Marker>
          <Marker position={[-12.1500, -75.1500]}><Popup>Pucará</Popup></Marker>
          <Marker position={[-13.1588, -74.2236]}><Popup>Ayacucho</Popup></Marker>
        </MapContainer>
      </div>

      {/* Panel de resultados */}
      {datos && (
        <div style={{ 
          position: 'absolute', bottom: '20px', left: '20px', zIndex: 1000, 
          backgroundColor: 'white', padding: '20px', borderRadius: '10px', 
          boxShadow: '0 4px 8px rgba(0,0,0,0.3)', width: '250px' 
        }}>
          <h3 style={{ margin: '0 0 10px 0' }}>{t.resultados}: {distrito}</h3>
          
          <p style={{ margin: '5px 0' }}><strong>{t.semaforo}:</strong> 
            <span style={{ 
              display: 'inline-block', width: '15px', height: '15px', borderRadius: '50%', marginLeft: '10px',
              backgroundColor: datos.color === 'verde' ? '#4CAF50' : datos.color === 'amarillo' ? '#FFC107' : datos.color === 'rojo' ? '#F44336' : 'gray'
            }}></span>
          </p>

          <p style={{ margin: '5px 0' }}><strong>{t.humedad}:</strong> {datos.humedad}</p>
          <p style={{ margin: '5px 0' }}><strong>{t.temperatura}:</strong> {datos.temperatura} °C</p>
          <p style={{ margin: '5px 0' }}>
            <strong>{t.heladas}:</strong> 
            <span style={{ color: datos.alerta_heladas ? 'red' : 'green', marginLeft: '5px' }}>
              {datos.alerta_heladas ? t.si : t.no}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}

export default App;