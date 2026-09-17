import { EncodingType, File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ButtonComponent, InputComponent, ScreenHeader } from '@/src/modules/_shared/components';
import { colors, fontSize, radius, space } from '@/src/modules/_shared/theme';
import { formatPen, openWhatsApp } from '@/src/modules/_shared/utils';
import { useAuthStore } from '@/src/modules/0.auth/domain/usecases';
import { useSalesStore } from '@/src/modules/2.sales/domain/usecases';
import { issuerFrom } from '@/src/modules/9.settings/domain/entities';
import { useSettingsStore } from '@/src/modules/9.settings/domain/usecases';
import type { Invoice, InvoiceType } from '../../../domain/entities';
import { invoiceLabel, invoiceTypeLabel } from '../../../domain/entities';
import { useInvoicingStore } from '../../../domain/usecases';
import { InvoicingPort } from '../../../ports';

export function IssueInvoiceScreen() {
  const { saleId } = useLocalSearchParams<{ saleId: string }>();
  const stores = useAuthStore((state) => state.stores);
  const profile = useAuthStore((state) => state.profile);
  const { selectedSale, onLoadSale } = useSalesStore();
  const { invoice, onLoadBySale, onIssue, loading, error } = useInvoicingStore();
  const organization = useSettingsStore((state) => state.organization);
  const onLoadSettings = useSettingsStore((state) => state.onLoad);
  const [type, setType] = useState<InvoiceType>('boleta');
  const [name, setName] = useState('');
  const [doc, setDoc] = useState('');
  const [phone, setPhone] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!saleId) return;
    void onLoadSale(saleId);
    void onLoadBySale(saleId);
  }, [saleId, onLoadSale, onLoadBySale]);

  useEffect(() => {
    if (profile?.organization_id) {
      void onLoadSettings(profile.organization_id, invoice?.store_id ?? selectedSale?.store_id ?? null);
    }
  }, [profile?.organization_id, invoice?.store_id, selectedSale?.store_id, onLoadSettings]);

  const store = stores.find((item) => item.id === (invoice?.store_id ?? selectedSale?.store_id)) ?? null;
  const issuer = issuerFrom(organization, store);

  const issue = async () => {
    if (!saleId) return;
    setLocalError(null);
    if (type === 'factura' && doc.trim().length < 8) {
      setLocalError('La factura requiere RUC o documento del cliente (mínimo 8 dígitos)');
      return;
    }
    try {
      await onIssue(saleId, type, { name, doc, phone });
    } catch {
      // error en el store
    }
  };

  const printOrShare = async (current: Invoice) => {
    if (!selectedSale) return;
    setActionError(null);
    try {
      const html = InvoicingPort.buildHtml(current, selectedSale, issuer);
      if (Platform.OS === 'web') {
        await Print.printAsync({ html });
        return;
      }
      const printed = await Print.printToFileAsync({ html, base64: true });
      if (!printed.base64) {
        throw new Error('No se pudo generar el PDF');
      }
      const filename = `${invoiceLabel(current)}.pdf`;
      const dest = new File(Paths.cache, filename);
      dest.create({ overwrite: true });
      dest.write(printed.base64, { encoding: EncodingType.Base64 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(dest.uri, {
          mimeType: 'application/pdf',
          UTI: 'com.adobe.pdf',
          dialogTitle: filename,
        });
        return;
      }
      await Print.printAsync({ html });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'No se pudo generar el PDF');
    }
  };

  const shareWhatsApp = async (current: Invoice) => {
    setActionError(null);
    try {
      await openWhatsApp(current.customer_phone ?? phone, InvoicingPort.shareText(current, issuer));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'No se pudo abrir WhatsApp');
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ScreenHeader title="Comprobante interno" subtitle="No válido para SUNAT" />
      {selectedSale ? (
        <Text style={styles.total}>Total de la venta {formatPen(Number(selectedSale.total))}</Text>
      ) : (
        <Text style={styles.muted}>Cargando venta…</Text>
      )}
      {error || localError || actionError ? (
        <Text style={styles.error}>{localError || actionError || error}</Text>
      ) : null}

      {invoice ? (
        <View style={styles.card}>
          <Text style={styles.docTitle}>
            {invoiceTypeLabel(invoice.type)} {invoiceLabel(invoice)}
          </Text>
          <Text style={styles.meta}>{invoice.customer_name || 'Cliente varios'}</Text>
          <Text style={styles.badge}>Comprobante interno — no válido para SUNAT</Text>
          <View style={styles.actions}>
            <ButtonComponent
              label={Platform.OS === 'web' ? 'Imprimir / PDF' : 'Compartir PDF'}
              onPress={() => void printOrShare(invoice)}
            />
            <ButtonComponent variant="secondary" label="Enviar por WhatsApp" onPress={() => void shareWhatsApp(invoice)} />
          </View>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.section}>Tipo</Text>
          <View style={styles.chips}>
            {(['boleta', 'factura'] as const).map((item) => {
              const selected = type === item;
              return (
                <Pressable
                  key={item}
                  style={[styles.chip, selected ? styles.chipOn : styles.chipOff]}
                  onPress={() => setType(item)}
                >
                  <Text style={selected ? styles.chipOnText : styles.chipOffText}>
                    {item === 'boleta' ? 'Boleta' : 'Factura'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <InputComponent label="Nombre del cliente (opcional)" value={name} onChangeText={setName} />
          <InputComponent
            label={type === 'factura' ? 'RUC / documento' : 'DNI / documento (opcional)'}
            value={doc}
            onChangeText={setDoc}
            keyboardType="number-pad"
          />
          <InputComponent
            label="WhatsApp del cliente (opcional)"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="987654321"
          />
          <View style={styles.actions}>
            <ButtonComponent
              label="Emitir"
              onPress={issue}
              loading={loading.status === 'loading'}
              disabled={!selectedSale}
            />
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: space.lg, paddingVertical: space.lg },
  total: { marginBottom: space.md, fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  muted: { marginBottom: space.md, color: colors.textMuted },
  error: { marginBottom: space.md, fontSize: fontSize.sm, color: colors.danger },
  card: { borderRadius: radius.lg, backgroundColor: colors.card, padding: space.lg, gap: space.md },
  docTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  meta: { fontSize: fontSize.sm, color: colors.textMuted },
  badge: { fontSize: fontSize.xs, fontWeight: '700', color: colors.brandDark },
  section: { fontWeight: '600', color: colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: { borderRadius: radius.full, paddingHorizontal: space.md, paddingVertical: 4 },
  chipOn: { backgroundColor: colors.brand },
  chipOff: { backgroundColor: '#F1F5F9' },
  chipOnText: { color: colors.white },
  chipOffText: { color: '#334155' },
  actions: { gap: space.sm, marginTop: space.sm },
});
