const fs = require('fs');
const path = 'src/app/infrastructure/repositorio-comun/repositorio-comun.adapter.ts';
let content = fs.readFileSync(path, 'utf8');
const startMarker = 'private cabeceras(credenciales: CredencialesGitHub): HttpHeaders {';
const endMarker = 'private traducirError(error: unknown): Error {';
const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker);
if (startIdx === -1 || endIdx === -1) { console.log('MARKERS NOT FOUND', startIdx, endIdx); process.exit(1); }
const lineStart = content.lastIndexOf('\n', startIdx) + 1;
const before = content.slice(0, lineStart);
const after = content.slice(endIdx);
const replacement = [
  '  private traducirError(error: unknown): Error {'
].join('\n');
content = before + after;
fs.writeFileSync(path, content, 'utf8');
console.log('OK replaced');
