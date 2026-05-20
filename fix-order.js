import fs from 'fs';
const content = fs.readFileSync('./hooks/useBarbeariaRegistros.ts', 'utf8');

const agendamentoStart = content.indexOf('export interface Agendamento');
const agendamentosPart = content.slice(agendamentoStart);
const firstPart = content.slice(0, content.indexOf('export const useBarbeariaRegistros'));
const useRegistrosPart = content.slice(content.indexOf('export const useBarbeariaRegistros'), agendamentoStart);

fs.writeFileSync('./hooks/useBarbeariaRegistros.ts', firstPart + agendamentosPart + useRegistrosPart);
