import React, { useState } from 'react';
const API = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';
export default function Buscador({ seleccionar }) {
  const [texto, setTexto] = useState('');
  const [resultados, setResultados] = useState([]);
  const [estado, setEstado] = useState('');
  const buscar = async e => {
    e.preventDefault();
    if (texto.trim().length < 2) { setEstado('Escribe al menos dos letras.'); return; }
    setEstado('Buscando…'); setResultados([]);
    try {
      const respuesta = await fetch(`${API}/buscar?q=${encodeURIComponent(texto.trim())}`);
      if (!respuesta.ok) throw new Error();
      const lista = await respuesta.json(); setResultados(lista);
      setEstado(lista.length ? `${lista.length} resultados mostrados. Agrega provincia o distrito para precisar la búsqueda.` : 'No encontramos coincidencias. Prueba otro nombre.');
    } catch { setEstado('No se pudo realizar la búsqueda. Inténtalo de nuevo.'); }
  };
  return <div className="search-location"><form onSubmit={buscar}><label htmlFor="buscar-lugar">Buscar distrito o centro poblado</label><div className="search-row"><input id="buscar-lugar" value={texto} onChange={e => setTexto(e.target.value)} placeholder="Ej. Pilcomayo o nombre de comunidad" /><button type="submit">Buscar</button></div></form><p className="search-hint">Junín y Ayacucho · Puedes incluir provincia o distrito.</p><p role="status" className="search-hint">{estado}</p>{resultados.length > 0 && <ul className="search-results">{resultados.map(u => <li key={u.id}><button onClick={() => { seleccionar(u); setResultados([]); setEstado('Ubicación seleccionada.'); }}>{u.nombre} <small>{u.tipo} · {u.distrito}, {u.provincia}, {u.region} · {u.id.slice(1)}</small></button></li>)}</ul>}<p className="search-hint">Catálogo basado en INEI: <a href="https://github.com/jmcastagnetto/ubigeo-peru-aumentado" target="_blank" rel="noreferrer">ubigeo-peru-aumentado</a>. Puede no incluir comunidades recientes o sin coordenadas.</p></div>;
}
