import React, { useState } from 'react';

const CLAVE = 'raices-seguimiento-v1';
function leerRegistros() {
  try { const valor = JSON.parse(localStorage.getItem(CLAVE) || '[]'); return Array.isArray(valor) ? valor : []; } catch { return []; }
}
export default function Seguimiento({ ubicacion, solicitarUbicacion, estadoUbicacion }) {
  const [registros, setRegistros] = useState(leerRegistros);
  const [cultivo, setCultivo] = useState('Papa');
  const [estado, setEstado] = useState('Sin evaluar');
  const [nota, setNota] = useState('');
  const [mensaje, setMensaje] = useState('');
  const guardar = e => {
    e.preventDefault();
    const registro = { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, fecha: new Date().toISOString(), cultivo, estado, nota: nota.trim(), ubicacion };
    const nuevos = [registro, ...registros];
    try { localStorage.setItem(CLAVE, JSON.stringify(nuevos)); setRegistros(nuevos); setNota(''); setMensaje('Observación guardada en este navegador.'); }
    catch { setMensaje('No se pudo guardar la observación en este navegador.'); }
  };
  const borrar = id => {
    if (!window.confirm('¿Eliminar esta observación?')) return;
    const nuevos = registros.filter(r => r.id !== id);
    try { localStorage.setItem(CLAVE, JSON.stringify(nuevos)); setRegistros(nuevos); setMensaje('Observación eliminada.'); }
    catch { setMensaje('No se pudo eliminar la observación.'); }
  };
  return <section className="calendar-section seguimiento" id="seguimiento"><p className="eyebrow">MI PARCELA</p><h2>Seguimiento del cultivo</h2><p>Guarda observaciones para consultar cómo evoluciona tu cultivo. La ubicación corresponde al dispositivo cuando la solicitas; verifica que estés en tu parcela.</p>
    <div className="seguimiento-grid"><div className="forecast-card"><h3>Tu ubicación</h3><button className="primary-action" type="button" onClick={solicitarUbicacion}>Usar mi ubicación actual</button><p role="status">{estadoUbicacion}</p>{ubicacion && <p>Latitud: {ubicacion.latitud.toFixed(5)} · Longitud: {ubicacion.longitud.toFixed(5)}<br />Precisión aproximada: {Math.round(ubicacion.precision)} m</p>}<p className="source">La ubicación se muestra en el mapa y se guarda con nuevas observaciones. Los datos climáticos siguen correspondiendo a la zona seleccionada arriba, no necesariamente al GPS.</p></div>
    <form className="forecast-card registro-form" onSubmit={guardar}><h3>Nueva observación</h3><label htmlFor="tipo-cultivo">Cultivo</label><select id="tipo-cultivo" value={cultivo} onChange={e => setCultivo(e.target.value)}><option>Papa</option><option>Maíz</option><option>Quinua</option><option>Haba</option><option>Otro</option></select><label htmlFor="estado-cultivo">Estado observado</label><select id="estado-cultivo" value={estado} onChange={e => setEstado(e.target.value)}><option>Sin evaluar</option><option>Buen estado</option><option>Necesita revisión</option><option>Daño observado</option></select><label htmlFor="nota-cultivo">Observaciones</label><textarea id="nota-cultivo" maxLength={1000} value={nota} onChange={e => setNota(e.target.value)} placeholder="Ej. suelo seco, hojas amarillas o fecha de riego" /><button className="primary-action" type="submit">Guardar observación</button><p role="status">{mensaje}</p></form></div>
    <div className="registros"><h3>Historial de observaciones</h3><p>Solo se guarda en este navegador y dispositivo; puede perderse si se borran sus datos.</p>{registros.length === 0 ? <p>Aún no hay observaciones guardadas.</p> : registros.map(r => <article className="registro" key={r.id}><div><strong>{r.cultivo} · {r.estado}</strong><p>{new Date(r.fecha).toLocaleString('es-PE')}</p>{r.nota && <p>{r.nota}</p>}<small>{r.ubicacion ? `Ubicación registrada: ${r.ubicacion.latitud.toFixed(5)}, ${r.ubicacion.longitud.toFixed(5)} (± ${Math.round(r.ubicacion.precision)} m)` : 'Sin ubicación registrada'}</small></div><button type="button" onClick={() => borrar(r.id)}>Eliminar</button></article>)}</div>
    <p className="sowing-note">Las observaciones son manuales. Las imágenes satelitales disponibles no proporcionan un diagnóstico ni alertas automáticas sobre el cultivo.</p>
  </section>;
}
