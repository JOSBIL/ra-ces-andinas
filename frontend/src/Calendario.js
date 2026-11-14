import React, { useEffect, useState } from 'react';

const API = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';
const fechaPeru = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const mostrar = (valor, unidad) => valor == null ? 'No disponible' : `${Number(valor).toLocaleString('es-PE', { maximumFractionDigits: 1 })} ${unidad}`;

export default function Calendario({ distrito, nombreLugar }) {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);
  const [intento, setIntento] = useState(0);
  const [mes, setMes] = useState(() => fechaPeru().slice(0, 7));
  const [seleccion, setSeleccion] = useState(null);
  useEffect(() => {
    const control = new AbortController();
    setDatos(null); setSeleccion(null); setError(''); setCargando(true);
    fetch(`${API}/pronostico/${encodeURIComponent(distrito)}`, { signal: control.signal })
      .then(async r => { const body = await r.json(); if (!r.ok) throw new Error(body.detail); return body; })
      .then(body => { setDatos(body); if (body.dias.length) { setMes(body.dias[0].fecha.slice(0, 7)); setSeleccion(body.dias[0].fecha); } })
      .catch(e => { if (e.name !== 'AbortError') setError(e.message || 'No se pudo conectar con el servidor.'); })
      .finally(() => { if (!control.signal.aborted) setCargando(false); });
    return () => control.abort();
  }, [distrito, intento]);
  const [ano, numeroMes] = mes.split('-').map(Number);
  const primerDia = new Date(ano, numeroMes - 1, 1);
  const espacios = (primerDia.getDay() + 6) % 7;
  const cantidad = new Date(ano, numeroMes, 0).getDate();
  const dias = datos?.dias || [];
  const elegido = dias.find(d => d.fecha === seleccion);
  const cambiarMes = delta => {
    const siguiente = new Date(ano, numeroMes - 1 + delta, 1);
    setMes(`${siguiente.getFullYear()}-${String(siguiente.getMonth() + 1).padStart(2, '0')}`);
    setSeleccion(null);
  };
  return <section className="calendar-section" id="pronostico" aria-labelledby="cal-titulo">
    <div className="calendar-intro"><div><p className="eyebrow">PLANIFICA TUS ACTIVIDADES</p><h2 id="cal-titulo">Calendario y pronóstico</h2><p>Navega por el año y consulta el pronóstico disponible para {nombreLugar}.</p></div><a href="https://wttr.in/:help" target="_blank" rel="noreferrer">Fuente: wttr.in ↗</a></div>
    <div className="calendar-layout"><div className="calendar-card">
      <div className="calendar-nav"><button onClick={() => cambiarMes(-1)} aria-label="Mes anterior">‹</button><h3>{primerDia.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })}</h3><button onClick={() => cambiarMes(1)} aria-label="Mes siguiente">›</button></div>
      <div className="calendar-grid">{['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => <span className="weekday" key={d}>{d}</span>)}
        {Array.from({ length: espacios }, (_, i) => <span key={`v${i}`} />)}
        {Array.from({ length: cantidad }, (_, i) => { const fecha = `${mes}-${String(i + 1).padStart(2, '0')}`; const dia = dias.find(d => d.fecha === fecha); return <button key={fecha} className={`calendar-day ${dia ? 'available' : ''} ${fecha === seleccion ? 'selected' : ''}`} disabled={!dia} onClick={() => setSeleccion(fecha)} aria-label={`${fecha}${dia ? ', ver pronóstico' : ', sin pronóstico'}`}><span>{i + 1}</span>{dia && <small>{dia.minima == null ? '—' : `${Math.round(dia.minima)}°`}</small>}</button>; })}
      </div>
      <p className="calendar-hint">Los días resaltados tienen pronóstico; las demás fechas aún no están disponibles.</p>
    </div><div className="forecast-card" aria-live="polite">
      {cargando && <p>Consultando el pronóstico…</p>}
      {error && <p className="error">{error} <button onClick={() => setIntento(i => i + 1)}>Reintentar</button></p>}
      {!cargando && !error && !elegido && <p>Selecciona un día resaltado para ver su pronóstico.</p>}
      {elegido && <><p className="eyebrow">PRONÓSTICO DIARIO · {nombreLugar}</p><h3>{new Date(`${elegido.fecha}T12:00:00`).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h3><div className="metrics"><div><span>Temperatura mínima</span><strong>{mostrar(elegido.minima, '°C')}</strong></div><div><span>Temperatura máxima</span><strong>{mostrar(elegido.maxima, '°C')}</strong></div></div></>}
      <p className="source">Pronóstico de corto plazo de wttr.in, para una ubicación aproximada. Puede cambiar y no sustituye avisos oficiales. Los datos NASA POWER de arriba describen días anteriores.</p>
    </div></div>
  </section>;
}
