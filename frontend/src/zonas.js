export const regiones = {
  Huancayo: 'Junín', Chupuro: 'Junín', 'Tres de Diciembre': 'Junín', Viques: 'Junín',
  Sapallanga: 'Junín', Pucara: 'Junín', Ingenio: 'Junín', Huayucachi: 'Junín',
  Ayacucho: 'Ayacucho', Cangallo: 'Ayacucho', Huanta: 'Ayacucho', Vilcashuaman: 'Ayacucho',
};

// Referencias regionales de campañas publicadas, no validación para cada distrito.
export function referencias(distrito, mes) {
  const region = regiones[distrito];
  const resultado = [];
  if (region === 'Junín' && (mes === 9 || mes === 10)) resultado.push('Papa');
  if ((region === 'Junín' || region === 'Ayacucho') && mes === 10) resultado.push('Maíz');
  return resultado;
}
