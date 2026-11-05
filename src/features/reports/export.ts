import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import type { Tx } from '@/features/home/stats';
import { toISODate } from '@/features/transactions/format';

import { type Analysis, type Period } from './analysis';
import { buildReportHtml } from './reportHtml';
import { buildXlsx, XLSX_MIME } from './xlsx';

const fileStem = (p: Period) => `finora-${toISODate(p.start)}_${toISODate(p.end)}`;

async function shareFile(uri: string, mimeType: string, uti: string) {
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType, UTI: uti, dialogTitle: 'Finora' });
  }
}

export async function exportPdf(period: Period, a: Analysis) {
  const html = buildReportHtml(period, a);
  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
    return;
  }
  // Pedimos o PDF em base64 e gravamos nós mesmos no cache (mesmo caminho da planilha, que funciona),
  // em vez de compartilhar o arquivo que o expo-print cria numa subpasta própria.
  const { base64 } = await Print.printToFileAsync({ html, base64: true });
  if (!base64) throw new Error('O expo-print não retornou o conteúdo do PDF.');
  const file = new File(Paths.cache, `${fileStem(period)}.pdf`);
  file.create({ overwrite: true });
  await file.write(base64, { encoding: 'base64' });
  await shareFile(file.uri, 'application/pdf', 'com.adobe.pdf');
}

export async function exportSheet(period: Period, txs: Tx[]) {
  const bytes = buildXlsx(txs);
  const name = `${fileStem(period)}.xlsx`;
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: XLSX_MIME }));
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
    URL.revokeObjectURL(url);
    return;
  }
  const file = new File(Paths.cache, name);
  file.create({ overwrite: true });
  await file.write(bytes);
  await shareFile(file.uri, XLSX_MIME, 'org.openxmlformats.spreadsheetml.sheet');
}
