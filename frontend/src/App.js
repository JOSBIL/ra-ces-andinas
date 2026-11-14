import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';
import Calendario from './Calendario';
import Siembras, { cultivos as fichasCultivos } from './Siembras';
import { referencias, regiones } from './zonas';
import Buscador from './Buscador';
import Seguimiento from './Seguimiento';
import Asistente from './Asistente';
import FichaParcela, { leerFicha } from './FichaParcela';
import Ecostress from './Ecostress';

const API = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';
const formato = (valor, unidad) => `${Number(valor).toLocaleString('es-PE', { maximumFractionDigits: 1 })} ${unidad}`;
function CentrarMapa({ lugar }) { const mapa = useMap(); useEffect(() => { if (lugar?.etiqueta) mapa.flyTo([lugar.latitud, lugar.longitud], 11); }, [mapa, lugar]); return null; }
function CentrarUbicacion({ ubicacion }) { const mapa = useMap(); useEffect(() => { if (ubicacion) mapa.flyTo([ubicacion.latitud, ubicacion.longitud], 16); }, [mapa, ubicacion]); return null; }

function App() {
  const [lugares, setLugares] = useState([]);
  const [distrito, setDistrito] = useState('Huancayo');
  const [mesSiembra, setMesSiembra] = useState(() => new Date().getMonth());
  const [vistaSatelital, setVistaSatelital] = useState(false);
  const [errorImagen, setErrorImagen] = useState(false);
  const [ubicacion, setUbicacion] = useState(null);
  const [ficha, setFicha] = useState(leerFicha);
  const [estadoUbicacion, setEstadoUbicacion] = useState('Aún no has compartido tu ubicación.');
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [errorLugares, setErrorLugares] = useState(false);
  const [intento, setIntento] = useState(0);
  const solicitarUbicacion = () => {
    if (!navigator.geolocation) { setEstadoUbicacion('Este navegador no permite acceder a la ubicación.'); return; }
    setEstadoUbicacion('Buscando tu ubicación…');
    navigator.geolocation.getCurrentPosition(pos => {
      setUbicacion({ latitud: pos.coords.latitude, longitud: pos.coords.longitude, precision: pos.coords.accuracy });
      setEstadoUbicacion('Ubicación encontrada. Comprueba el punto en el mapa.');
      setVistaSatelital(true); setErrorImagen(false);
    }, err => setEstadoUbicacion(err.code === 1 ? 'Permiso de ubicación denegado. Revisa los permisos del navegador.' : 'No se pudo obtener la ubicación. Comprueba el GPS e inténtalo de nuevo.'), { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
  };
  const seleccionarLugar = lugar => {
    regiones[lugar.id] = lugar.region;
    setLugares(actual => [...actual.filter(l => l.nombre !== lugar.id), { ...lugar, nombre: lugar.id, etiqueta: `${lugar.nombre} · ${lugar.distrito}, ${lugar.provincia}` }]);
    setDistrito(lugar.id);
  };
  const nombreLugar = lugares.find(l => l.nombre === distrito)?.etiqueta || distrito;

  useEffect(() => {
    const controller = new AbortController();
    setErrorLugares(false);
    fetch(`${API}/distritos`, { signal: controller.signal })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(lista => setLugares(actual => [...lista, ...actual.filter(l => l.etiqueta)])).catch(e => { if (e.name !== 'AbortError') setErrorLugares(true); });
    return () => controller.abort();
  }, [intento]);

  useEffect(() => {
    const controller = new AbortController();
    setCargando(true); setError(''); setDatos(null);
    fetch(`${API}/semaforo/${encodeURIComponent(distrito)}`, { signal: controller.signal })
      .then(async r => { const body = await r.json(); if (!r.ok) throw new Error(body.detail); return body; })
      .then(setDatos)
      .catch(e => { if (e.name !== 'AbortError') setError(e.message || 'No se pudo conectar con el servidor.'); })
      .finally(() => { if (!controller.signal.aborted) setCargando(false); });
    return () => controller.abort();
  }, [distrito, intento]);

  const estados = {
    rojo: ['Temperatura bajo cero', 'La temperatura mínima estimada fue de 0 °C o menos.'],
    amarillo: ['Temperatura cercana a cero', 'La temperatura mínima estimada estuvo entre 0 y 4 °C.'],
    verde: ['Temperatura superior a 4 °C', 'La temperatura mínima estimada superó los 4 °C.'],
  };

  return <div className="app">
    <header className="header">
      <div className="brand"><img src="/logo.png" alt="Raíces Andinas" /><div><span>INFORMACIÓN PARA EL CAMPO</span><h1>Raíces Andinas</h1></div></div>
      <nav className="top-nav" aria-label="Secciones"><a href="#clima">Clima</a><a href="#pronostico">Pronóstico</a><a href="#siembras">Siembras</a><a href="#parcela">Mi parcela</a><a href="#seguimiento">Mi cultivo</a><a href="#asistente">Asistente</a></nav>
    </header>
    <main className="layout" id="clima">
      <section className="panel">
        <p className="eyebrow">TU CAMPO, MEJOR INFORMADO</p>
        <h2>Conoce el clima de tu zona</h2>
        <p className="intro">Elige tu distrito para consultar las últimas condiciones disponibles y planificar tus siembras.</p>
        <button className="primary-action" type="button" onClick={solicitarUbicacion}>📍 Mostrar mi ubicación</button><p className="search-hint" role="status">{estadoUbicacion}</p>
        <Buscador seleccionar={seleccionarLugar} />
        <label htmlFor="distrito">Selecciona un distrito</label>
        <select id="distrito" value={distrito} onChange={e => setDistrito(e.target.value)} disabled={!lugares.length}>
          {!lugares.length && <option value="Huancayo">Huancayo</option>}
          {lugares.map(l => <option key={l.nombre} value={l.nombre}>{l.etiqueta || l.nombre}</option>)}
        </select>
        {errorLugares && <p className="error" role="alert">No se pudo cargar la lista de distritos. <button onClick={() => setIntento(i => i + 1)}>Reintentar</button></p>}
        {cargando && <div className="notice" role="status">Consultando datos de NASA POWER…</div>}
        {error && <div className="notice error" role="alert">{error} <button onClick={() => setIntento(i => i + 1)}>Reintentar</button></div>}
        {datos && <article className="results">
          <div className="result-heading"><div><p className="eyebrow">ÚLTIMO DÍA DISPONIBLE</p><h3>{nombreLugar}</h3></div><span className="date">{datos.fecha}</span></div>
          <div className={`status ${datos.color}`}><span className="dot" /><div><strong>{estados[datos.color][0]}</strong><p>{estados[datos.color][1]}</p></div></div>
          <div className="metrics">
            <div><span>Temperatura media</span><strong>{formato(datos.temperatura, '°C')}</strong></div>
            <div><span>Temperatura mínima</span><strong>{formato(datos.temperatura_minima, '°C')}</strong></div>
            <div><span>Precipitación diaria</span><strong>{formato(datos.precipitacion, 'mm')}</strong></div>
            <div><span>Humedad relativa del aire</span><strong>{formato(datos.humedad_relativa, '%')}</strong></div>
          </div>
          <p className="explanation">El indicador compara la temperatura mínima del día mostrado: rojo ≤ 0 °C, amarillo ≤ 4 °C y verde &gt; 4 °C. Es orientativo; no es un pronóstico ni una alerta oficial de helada.</p>
          <p className="source">Fuente: NASA POWER · Datos diarios estimados para una celda regional, no una medición de tu parcela. Pueden publicarse con retraso. La humedad mostrada es del aire, no del suelo.</p>
        </article>}
      </section>
      <section className="map" aria-label="Mapa de distritos">
        <MapContainer center={[-12.55, -74.9]} zoom={7} maxZoom={21} scrollWheelZoom={false}>
          <CentrarMapa lugar={lugares.find(l => l.nombre === distrito)} />
          <CentrarUbicacion ubicacion={ubicacion} />
          {vistaSatelital ? <TileLayer key="satelite" maxZoom={21} maxNativeZoom={19} attribution='Imágenes: Esri, Vantor, Earthstar Geographics y la comunidad GIS' url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" eventHandlers={{ tileerror: () => setErrorImagen(true) }} /> : <TileLayer key="mapa" maxZoom={21} maxNativeZoom={19} attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />}
          {ubicacion && <CircleMarker center={[ubicacion.latitud, ubicacion.longitud]} radius={10} pathOptions={{ color: '#fff', weight: 3, fillColor: '#1975d1', fillOpacity: 1 }}><Popup>Tu ubicación actual aproximada (± {Math.round(ubicacion.precision)} m). Verifica que corresponda a tu parcela.</Popup></CircleMarker>}
          {lugares.map(l => { const cultivos = referencias(l.nombre, mesSiembra); return <CircleMarker key={l.nombre} center={[l.latitud, l.longitud]} radius={l.nombre === distrito ? 10 : 7} pathOptions={{ color: l.nombre === distrito ? '#152f26' : '#fff', weight: l.nombre === distrito ? 3 : 2, fillColor: cultivos.length ? '#c67b1b' : '#64786c', fillOpacity: 1 }} eventHandlers={{ click: () => setDistrito(l.nombre) }}><Popup maxWidth={340} className="sowing-popup"><strong>{l.etiqueta || l.nombre} · {regiones[l.nombre]}</strong><p>Siembras en {new Date(2024, mesSiembra, 1).toLocaleDateString('es-PE', { month: 'long' })}</p>{cultivos.length ? fichasCultivos.filter(c => cultivos.includes(c.nombre)).map(c => <div className="popup-crop" key={c.nombre}><strong>{c.nombre}</strong><p><b>Referencia:</b> {c.periodo}</p><p><b>Factores:</b> {c.factores}</p><p><b>Riesgos:</b> {c.riesgos}</p></div>) : <p>No hay una ventana regional documentada en esta guía para este mes. Esto no significa que no se pueda sembrar.</p>}<p>Referencia regional, no evaluación de la parcela. Revisa agua, suelo, variedad y avisos locales.</p><a href="#siembras">Ver calendario y fichas completas</a></Popup></CircleMarker>; })}
        </MapContainer>
        <div className="map-view-control" role="group" aria-label="Vista del mapa"><span className="map-control-label">TIPO DE VISTA</span><div className="map-view-buttons"><button type="button" aria-pressed={!vistaSatelital} onClick={() => { setVistaSatelital(false); setErrorImagen(false); }}>Mapa</button><button type="button" aria-pressed={vistaSatelital} onClick={() => { setErrorImagen(false); setVistaSatelital(true); }}>Satélite</button></div>{vistaSatelital && <p>Usa + para acercarte. La fecha y resolución varían; el último acercamiento amplía la imagen disponible.</p>}{errorImagen && vistaSatelital && <p role="alert">No se pudieron cargar algunas imágenes. Comprueba tu conexión o vuelve a la vista de mapa.</p>}</div>
        <div className="map-note"><label htmlFor="mes-mapa"><strong>Siembras por zona</strong></label><span className="map-note-caption">Elige un mes</span><select id="mes-mapa" value={mesSiembra} onChange={e => setMesSiembra(Number(e.target.value))}>{Array.from({length: 12}, (_, i) => <option key={i} value={i}>{new Date(2024, i, 1).toLocaleDateString('es-PE', {month: 'long'})}</option>)}</select><div className="map-legend"><div><span className="legend-dot has-reference" /> Con referencia regional</div><div><span className="legend-dot no-reference" /> Sin referencia en la guía</div></div><small>Toca un punto para ver detalles. El borde oscuro señala la zona elegida.</small></div>
      </section>
    </main>
    <Calendario distrito={distrito} nombreLugar={nombreLugar} />
    <Ecostress distrito={distrito} nombreLugar={nombreLugar} datos={datos?.distrito === distrito ? datos : null} />
    <Siembras distrito={distrito} nombreLugar={nombreLugar} lugares={lugares} setDistrito={setDistrito} mes={mesSiembra} setMes={setMesSiembra} />
    <FichaParcela ficha={ficha} setFicha={setFicha} datos={datos?.distrito === distrito ? datos : null} nombreLugar={nombreLugar} lugar={lugares.find(l => l.nombre === distrito)} />
    <Seguimiento ubicacion={ubicacion} solicitarUbicacion={solicitarUbicacion} estadoUbicacion={estadoUbicacion} />
    <Asistente distrito={distrito} nombreLugar={nombreLugar} mes={mesSiembra} datos={datos?.distrito === distrito ? datos : null} ficha={ficha} />
  </div>;
}
export default App;
