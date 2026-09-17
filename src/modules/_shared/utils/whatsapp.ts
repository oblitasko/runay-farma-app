import { Linking } from 'react-native';

function toWaPhone(phone?: string | null) {
  if (!phone) return '';
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) digits = digits.slice(1);
  if (digits.startsWith('51') && digits.length >= 11) return digits;
  if (digits.length === 9) return `51${digits}`;
  return digits;
}

export async function openWhatsApp(phone?: string | null, text = '') {
  const encoded = encodeURIComponent(text);
  const digits = toWaPhone(phone);
  const url = digits ? `https://wa.me/${digits}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
  await Linking.openURL(url);
}
