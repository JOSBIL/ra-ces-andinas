import React, { useState } from 'react';
import { referencias, regiones } from './zonas';
import { cultivos } from './Siembras';

const normalizar = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
function responder(pregunta, distrito, nombre, mes, datos) {
  const q = normalizar(pregunta);
  const lugar = `${nombre}${regiones[distrito] ? ` (${regiones[distrito]})` : ''}`;
  const nombreMes = new Date(2024, mes, 1).toLocaleDateString('es-PE', { month: 'long' });
  const ficha = cultivos.find(c => q.includes(normalizar(c.nombre)));
  if (/cosech|madur|recolect|apto|apta|listo|lista/.test(q)) return `Para ${lugar}, no puedo determinar si un cultivo está listo para cosechar ni garantizar que la parcela sea apta. Necesito conocer el cultivo y la variedad, la fecha de siembra, su etapa y observar señales de madurez y condiciones de la parcela. La aplicación no dispone de esos datos ni de un diagnóstico satelital. Consulta a un técnico local antes de decidir. Si tu pregunta era sobre cuándo sembrar, pregunta «¿Qué puedo sembrar?».`;
  if (/clima|temperatura|lluvia|helada|humedad/.test(q)) return datos ? `Para ${lugar}, el último dato disponible de NASA POWER es del ${datos.fecha}: temperatura media ${datos.temperatura} °C, mínima ${datos.temperatura_minima} °C, precipitación ${datos.precipitacion} mm y humedad relativa del aire ${datos.humedad_relativa} %. Son estimaciones regionales de un día pasado, no un pronóstico ni humedad del suelo. Consulta el pronóstico y los avisos oficiales antes de tomar decisiones.` : `Los datos de NASA POWER para ${lugar} están cargando o no están disponibles. No puedo evaluar las condiciones actuales. Revisa la sección de clima e inténtalo de nuevo.`;
  if (/siembr|cultiv|plant|sembr|riesgo|papa|maiz|quinua|haba/.test(q)) {
    if (ficha) return `${ficha.nombre} en ${lugar}: ${ficha.periodo} Factores: ${ficha.factores} Riesgos: ${ficha.riesgos} Estas referencias son generales y no confirman aptitud para tu parcela.`;
    const lista = referencias(distrito, mes);
    return `Para ${lugar} en ${nombreMes}, ${lista.length ? `la guía contiene referencias regionales de siembra para ${lista.join(' y ')} en algunas zonas y campañas` : 'esta guía no tiene una ventana regional documentada de siembra'}. Esto no confirma que puedas o no sembrar en tu parcela. Revisa lluvias, suelo, riego, variedad y altitud, y consulta el calendario y un técnico local.`;
  }
  return 'Puedo ayudarte con preguntas sobre siembra, riesgos de papa, maíz, quinua o haba, clima disponible y preparación para la cosecha. Prueba «¿Qué puedo sembrar?» o «¿Está lista mi papa para cosechar?». Selecciona la ubicación y el mes en la aplicación antes de preguntar.';
}
export default function Asistente({ distrito, nombreLugar, mes, datos, ficha }) {
  const [entrada, setEntrada] = useState('');
  const [mensajes, setMensajes] = useState([]);
  const enviar = pregunta => {
    const texto = pregunta.trim(); if (!texto) return;
    const campos = [['cultivo', 'cultivo'], ['variedad', 'variedad'], ['fechaSiembra', 'fecha de siembra'], ['altitud', 'altitud (m)'], ['suelo', 'estado del suelo'], ['tipoSuelo', 'tipo de suelo'], ['riego', 'riego'], ['lluvia', 'lluvia observada'], ['notas', 'etapa y notas']];
    const registrados = campos.filter(([clave]) => ficha[clave]).map(([clave, etiqueta]) => `${etiqueta}: ${ficha[clave]}`);
    const faltantes = campos.filter(([clave]) => !ficha[clave]).map(([, etiqueta]) => etiqueta);
    const contexto = `\n\nFicha ingresada por ti: ${registrados.length ? registrados.join('; ') : 'sin datos'}. ${faltantes.length ? `Falta completar: ${faltantes.join(', ')}.` : 'Todos los campos están completos.'} Comprueba que esta ficha corresponda a la zona seleccionada. Los datos no están verificados y no permiten por sí solos declarar aptitud.`;
    setMensajes(actual => [...actual, { pregunta: texto, respuesta: responder(texto, distrito, nombreLugar, mes, datos) + contexto, id: `${Date.now()}-${Math.random()}` }]);
    setEntrada('');
  };
  return <section className="calendar-section assistant" id="asistente"><p className="eyebrow">CONSULTA AGRÍCOLA</p><h2>Pregunta a tu asistente</h2><p>Consulta la guía para <strong>{nombreLugar}</strong> y el mes seleccionado. Cambia la zona o el mes en la página para ajustar la consulta.</p><div className="assistant-box"><div className="assistant-messages" aria-live="polite"><div className="assistant-bubble">Hola, puedo ayudarte a consultar siembras, clima y riesgos. También puedo explicarte qué información falta para evaluar una cosecha.</div>{mensajes.map(m => <div key={m.id}><div className="assistant-question">{m.pregunta}</div><div className="assistant-bubble">{m.respuesta}</div></div>)}</div><div className="assistant-suggestions"><button type="button" onClick={() => enviar('¿Qué puedo sembrar?')}>¿Qué puedo sembrar?</button><button type="button" onClick={() => enviar('¿Está listo mi cultivo para cosechar?')}>¿Puedo cosechar?</button><button type="button" onClick={() => enviar('¿Cómo está el clima?')}>Ver clima disponible</button></div><form className="assistant-form" onSubmit={e => { e.preventDefault(); enviar(entrada); }}><label className="visually-hidden" htmlFor="consulta-asistente">Escribe tu pregunta</label><input id="consulta-asistente" value={entrada} maxLength={500} onChange={e => setEntrada(e.target.value)} placeholder="Escribe tu pregunta…" /><button className="primary-action" type="submit">Preguntar</button></form><p className="assistant-note">Asistente de respuestas predefinidas: no utiliza IA ni analiza tu parcela. Consulta los <a href="https://www.gob.pe/9945-pronosticos-agrometeorologicos-del-senamhi" target="_blank" rel="noreferrer">avisos agrometeorológicos de SENAMHI</a> y a un técnico local.</p></div></section>;
}
