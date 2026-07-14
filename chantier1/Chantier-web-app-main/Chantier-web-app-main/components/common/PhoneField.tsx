import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PhoneInput, {
  getCountryByCca2,
  getCountryByPhoneNumber,
  type ICountry,
  type ICountrySelectLanguages,
} from 'react-native-international-phone-number';
import { ChevronDown, Phone } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { Colors } from '@/constants/colors';

type PhoneFieldProps = {
  phone: string;
  onChangePhone: (phone: string) => void;
  required?: boolean;
  disabled?: boolean;
  fieldKey?: string | number;
};

const DEFAULT_COUNTRY_CODE = 'FR';
const JAPAN_COUNTRY_CODE = 'JP';
const JAPAN_NATIONAL_DIGIT_LIMIT = 13;

function getNationalDigitLimit(country?: ICountry | null): number | undefined {
  if (country?.cca2 === JAPAN_COUNTRY_CODE) return JAPAN_NATIONAL_DIGIT_LIMIT;
  return undefined;
}

function limitNationalDigits(phoneNumber: string, country?: ICountry | null): string {
  const limit = getNationalDigitLimit(country);
  if (!limit) return phoneNumber;

  const digits = phoneNumber.replace(/\D/g, '');
  if (digits.length <= limit) return phoneNumber;

  return digits.slice(0, limit);
}

function resolveCountry(phone: string): ICountry | undefined {
  if (phone) {
    return getCountryByPhoneNumber(phone) ?? getCountryByCca2(DEFAULT_COUNTRY_CODE);
  }

  return getCountryByCca2(DEFAULT_COUNTRY_CODE);
}

function stripCallingCode(phone: string, country?: ICountry | null): string {
  const digits = (phone ?? '').replace(/\D/g, '');
  const callingCodeDigits = country?.idd?.root?.replace(/\D/g, '') ?? '';

  if (callingCodeDigits && digits.startsWith(callingCodeDigits)) {
    return digits.slice(callingCodeDigits.length);
  }

  return digits;
}

function formatE164(phoneNumber: string, country?: ICountry | null): string {
  const digits = phoneNumber.replace(/\D/g, '');
  if (!digits) return '';

  const callingCode = country?.idd?.root ?? '';
  const nationalDigits = digits.startsWith('0') ? digits.slice(1) : digits;

  return callingCode ? `${callingCode}${nationalDigits}` : nationalDigits;
}

export function PhoneField({
  phone,
  onChangePhone,
  required = true,
  disabled = false,
  fieldKey,
}: PhoneFieldProps) {
  const { t, language } = useLanguage();
  const m = t.management.modals;
  const initialCountry = resolveCountry(phone);
  const [selectedCountry, setSelectedCountry] = useState<ICountry | undefined>(initialCountry);
  const [inputValue, setInputValue] = useState(() => stripCallingCode(phone, initialCountry));
  const lastEmittedPhoneRef = useRef<string | null>(null);
  const phoneInputLanguage: ICountrySelectLanguages = language === 'fr' ? 'fra' : 'eng';
  const stableKey = fieldKey !== undefined ? String(fieldKey) : 'phone-default';

  useEffect(() => {
    if (phone === lastEmittedPhoneRef.current) return;

    const nextCountry = resolveCountry(phone);
    setSelectedCountry(nextCountry);
    setInputValue(limitNationalDigits(stripCallingCode(phone, nextCountry), nextCountry));
  }, [phone]);

  const handlePhoneNumberChange = (phoneNumber: string) => {
    const limitedPhoneNumber = limitNationalDigits(phoneNumber, selectedCountry);
    setInputValue(limitedPhoneNumber);
    const formattedPhone = formatE164(limitedPhoneNumber, selectedCountry);
    lastEmittedPhoneRef.current = formattedPhone;
    onChangePhone(formattedPhone);
  };

  const handleCountryChange = (country: ICountry) => {
    setSelectedCountry(country);
    const cleared = '';
    setInputValue(cleared);
    lastEmittedPhoneRef.current = cleared;
    onChangePhone(cleared);
  };

  const nationalDigitLimit = getNationalDigitLimit(selectedCountry);

  return (
    <>
      <View style={styles.fieldLabelRow}>
        <Phone size={14} color={Colors.primary} strokeWidth={2.4} />
        <Text style={styles.fieldLabel}>
          {m.fields.phone}
          {required ? <Text style={styles.fieldLabelRequired}> *</Text> : null}
        </Text>
      </View>
      <PhoneInput
        key={stableKey}
        value={inputValue}
        onChangePhoneNumber={handlePhoneNumberChange}
        selectedCountry={selectedCountry}
        onChangeSelectedCountry={handleCountryChange}
        defaultCountry={DEFAULT_COUNTRY_CODE}
        language={phoneInputLanguage}
        placeholder={m.fields.phonePlaceholder}
        disabled={disabled}
        modalDisabled={disabled}
        phoneInputPlaceholderTextColor={Colors.text.disabled}
        phoneInputSelectionColor={Colors.primary}
        customCaret={() => (
          <ChevronDown size={14} color={Colors.text.secondary} strokeWidth={2.4} />
        )}
        phoneInputStyles={{
          container: [styles.phoneContainer, disabled && styles.phoneContainerDisabled],
          flagContainer: [styles.phoneFlagContainer, disabled && styles.phonePartDisabled],
          flag: styles.phoneFlag,
          divider: styles.phoneDivider,
          callingCode: [styles.phoneCallingCode, disabled && styles.phoneTextDisabled],
          input: [styles.phoneTextInput, disabled && styles.phoneTextDisabled],
        }}
        modalStyles={{
          content: styles.countryModalContent,
          backdrop: styles.countryModalBackdrop,
        }}
        modalType="popup"
        showModalSearchInput
        allowFontScaling={false}
        inputMode="numeric"
        keyboardType="phone-pad"
        maxLength={nationalDigitLimit}
      />
    </>
  );
}

const styles = StyleSheet.create({
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldLabelRequired: {
    color: Colors.error,
  },
  phoneContainer: {
    width: '100%',
    minHeight: 48,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border.light,
    marginBottom: 16,
    overflow: 'hidden',
  },
  phoneContainerDisabled: {
    backgroundColor: Colors.background,
    opacity: 0.72,
  },
  phoneFlagContainer: {
    height: 48,
    minWidth: 112,
    paddingHorizontal: 10,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  phonePartDisabled: {
    backgroundColor: Colors.background,
  },
  phoneFlag: {
    fontSize: 20,
    marginRight: 6,
  },
  phoneDivider: {
    width: 1,
    height: 28,
    marginLeft: 8,
    marginRight: 10,
    backgroundColor: Colors.border.light,
  },
  phoneCallingCode: {
    fontSize: 15,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  phoneTextInput: {
    height: 48,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: Colors.text.primary,
  },
  phoneTextDisabled: {
    color: Colors.text.disabled,
  },
  countryModalContent: {
    backgroundColor: Colors.surface,
  },
  countryModalBackdrop: {
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
  },
});
