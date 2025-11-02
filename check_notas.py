import sys
sys.path.insert(0, 'src')

from database.connection import SessionLocal
from models.nota_fiscal import NotaFiscal

db = SessionLocal()
notas = db.query(NotaFiscal).all()

print(f'Total de notas: {len(notas)}')
print('\n--- Notas de Entrada ---')
entradas = [n for n in notas if n.tipo_operacao == 'Entrada']
print(f'Total de entradas: {len(entradas)}')
for n in entradas[:3]:
    print(f'Nota {n.numero}: Emitente={n.cnpj_emitente}, Destinatário={n.cnpj_destinatario}')

print('\n--- Notas de Saída ---')
saidas = [n for n in notas if n.tipo_operacao == 'Saída']
print(f'Total de saídas: {len(saidas)}')
for n in saidas[:3]:
    print(f'Nota {n.numero}: Emitente={n.cnpj_emitente}, Destinatário={n.cnpj_destinatario}')

db.close()
