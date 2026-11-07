"""Revisa que content.json sea válido y que existan los archivos que usa la clase:  python verificar.py"""
import json, os, sys
d = os.path.dirname(os.path.abspath(__file__))
try:
    C = json.load(open(os.path.join(d, 'content.json'), encoding='utf-8'))
except Exception as e:
    sys.exit(f'✗ content.json inválido: {e}')
falta = [f"{k}: {v}" for k, v in C['meta'].items() if not os.path.exists(os.path.join(d, v))]
for f in ('index.html', 'style.css', 'main.js', 'audio.js', 'cursor.js', 'effects.js'):
    if not os.path.exists(os.path.join(d, f)): falta.append(f)
print('Tarjetas:', len(C['cards']), '| V/F:', len(C['tf']), '| Conecta:', len(C['match']), '| ¿Qué harías?:', len(C['apply']))
if falta:
    print('✗ Faltan archivos (súbelos al repositorio con ese nombre exacto):'); [print('  -', x) for x in falta]; sys.exit(1)
print('✓ Todo listo para subir a GitHub Pages')
