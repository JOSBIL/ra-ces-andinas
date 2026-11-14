import React, { useEffect, useState } from 'react';
const API = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';
export default function Ecostress({ distrito, nombreLugar, datos }) {
  const [escenas, setEscenas] = useState(null);
  const [estado, setEstado] = useState('');
  const [intento, setIntento] = useState(0);
  useEffect(() => {
    const control = new AbortController(); setEscenas(null); setEstado('Consultando el catálogo de NASA…');
    fetch(`${API}/ecostress/${encodeURIComponent(distrito)}`, { signal: control.signal })
      .then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.detail); return d; })
      .then(d => { setEscenas(d); setEstado(''); })
      .catch(e => { if (e.name !== 'AbortError') setEstado(e.message || 'No se pudo consultar ECOSTRESS.'); });
    return () => control.abort();
  }, [distrito, intento]);
  return <section className="calendar-section ecostress" id="ecostress"><p className="eyebrow">OBSERVACIÓN DE LA TIERRA</p><h2>ECOSTRESS y clima</h2><p>Consulta de escenas para <strong>{nombreLugar}</strong>. Las escenas corresponden al punto de la zona seleccionada, que puede no ser tu parcela.</p>
    <div className="seguimiento-grid"><article className="forecast-card"><h3>Escenas ECOSTRESS</h3><p>Producto ECO_L4G_ESI.002 · búsqueda en los últimos 180 días.</p><p role="status">{estado}</p>{estado && !estado.includes('Consultando') && <button type="button" onClick={() => setIntento(i => i + 1)}>Reintentar</button>}{escenas && (escenas.escenas.length ? <ul>{escenas.escenas.map(e => <li key={e.id}><strong>{new Date(e.inicio_utc).toLocaleString('es-PE', { timeZone: 'America/Lima', dateStyle: 'medium', timeStyle: 'short' })} (Perú)</strong><br /><small>{e.id}</small></li>)}</ul> : <p>No se encontraron escenas en este período para el punto consultado.</p>)}<p className="source">El catálogo indica coincidencia espacial de la escena; aún falta verificar el píxel, las nubes, el agua y la calidad de geolocalización. No se ha extraído ESI ni evapotranspiración.</p></article>
    <article className="forecast-card"><h3>NASA POWER</h3>{escenas?.escenas.length > 0 && (escenas.power_mismo_dia ? <><p>Datos diarios del día local de la escena más reciente: <strong>{escenas.power_mismo_dia.fecha}</strong></p><p>Temperatura media: {escenas.power_mismo_dia.temperatura} °C<br />Temperatura mínima: {escenas.power_mismo_dia.minima} °C<br />Lluvia diaria: {escenas.power_mismo_dia.lluvia} mm<br />Humedad relativa del aire: {escenas.power_mismo_dia.humedad} %</p></> : <p>POWER no devolvió datos completos para el día de la escena más reciente.</p>)}{datos && <p>Último día disponible en POWER: {datos.fecha} · lluvia {datos.precipitacion} mm.</p>}<p className="source">POWER es diario y regional; ECOSTRESS es una observación instantánea de resolución distinta. Coincidir por fecha no constituye todavía un análisis cruzado de ESI.</p><a href="https://doi.org/10.5067/ECOSTRESS/ECO_L4G_ESI.002" target="_blank" rel="noreferrer">Información del producto ECOSTRESS ↗</a></article></div>
  </section>;
}
