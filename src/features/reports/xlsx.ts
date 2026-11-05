import { strToU8, zipSync } from 'fflate';

import { parseDay, type Tx } from '@/features/home/stats';
import { t } from '@/i18n/pt-BR';

export const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const xml = (s: string) =>
  s.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const HEADER = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';

// Estilos (índices em cellXfs): 0 padrão, 1 cabeçalho, 2 data, 3 moeda.
const STYLES = `${HEADER}<styleSheet xmlns="${NS}">
<numFmts count="2"><numFmt numFmtId="164" formatCode="dd/mm/yyyy"/><numFmt numFmtId="165" formatCode="&quot;R$&quot;\\ #,##0.00;[Red]\\-&quot;R$&quot;\\ #,##0.00"/></numFmts>
<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts>
<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF006948"/></patternFill></fill></fills>
<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="4">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>
<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
<xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

const str = (ref: string, v: string, s = 0) => `<c r="${ref}" s="${s}" t="inlineStr"><is><t>${xml(v)}</t></is></c>`;
const num = (ref: string, v: number, s: number) => `<c r="${ref}" s="${s}"><v>${v}</v></c>`;

/** Dia civil → número de série do Excel (independe de fuso). */
function serial(iso: string) {
  const d = parseDay(iso);
  return Math.round((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(1899, 11, 30)) / 86_400_000);
}

/**
 * Planilha .xlsx com os lançamentos. Datas e valores são números de verdade (formatados pelo próprio
 * arquivo), então abre igual em qualquer idioma/aplicativo. Receitas positivas, despesas negativas.
 */
export function buildXlsx(txs: Tx[]): Uint8Array {
  const rows = [...txs].sort((a, b) => a.occurred_on.localeCompare(b.occurred_on) || a.created_at.localeCompare(b.created_at));
  const head = ['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor (R$)'];

  const lines = [
    `<row r="1">${head.map((h, i) => str(`${'ABCDE'[i]}1`, h, 1)).join('')}</row>`,
    ...rows.map((x, i) => {
      const r = i + 2;
      return `<row r="${r}">${[
        num(`A${r}`, serial(x.occurred_on), 2),
        str(`B${r}`, x.type === 'income' ? 'Receita' : 'Despesa'),
        str(`C${r}`, x.category?.name ?? t.home.uncategorized),
        str(`D${r}`, x.description),
        num(`E${r}`, x.type === 'income' ? x.amount : -x.amount, 3),
      ].join('')}</row>`;
    }),
  ];

  const sheet = `${HEADER}<worksheet xmlns="${NS}">
<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
<cols><col min="1" max="1" width="12" customWidth="1"/><col min="2" max="2" width="10" customWidth="1"/><col min="3" max="3" width="22" customWidth="1"/><col min="4" max="4" width="34" customWidth="1"/><col min="5" max="5" width="16" customWidth="1"/></cols>
<sheetData>${lines.join('')}</sheetData>
</worksheet>`;

  return zipSync({
    '[Content_Types].xml': strToU8(
      `${HEADER}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`,
    ),
    '_rels/.rels': strToU8(
      `${HEADER}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${REL}/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    ),
    'xl/workbook.xml': strToU8(
      `${HEADER}<workbook xmlns="${NS}" xmlns:r="${REL}"><sheets><sheet name="Lançamentos" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    ),
    'xl/_rels/workbook.xml.rels': strToU8(
      `${HEADER}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${REL}/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="${REL}/styles" Target="styles.xml"/></Relationships>`,
    ),
    'xl/styles.xml': strToU8(STYLES),
    'xl/worksheets/sheet1.xml': strToU8(sheet),
  });
}
