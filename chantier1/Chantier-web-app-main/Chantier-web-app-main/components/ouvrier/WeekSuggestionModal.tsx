import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CalendarRange, Sparkles } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { formatWeekDayLabel } from '@/utils/date';
import type { PreviousWeekHint } from '@/utils/ouvrierDeclaration';

type WeekSuggestionModalProps = {
  visible: boolean;
  mode: 'suggestion' | 'empty';
  hint: PreviousWeekHint | null;
  title: string;
  message: string;
  validateLabel: string;
  cancelLabel: string;
  onValidate: () => void;
  onCancel: () => void;
};

export function WeekSuggestionModal({
  visible,
  mode,
  hint,
  title,
  message,
  validateLabel,
  cancelLabel,
  onValidate,
  onCancel,
}: WeekSuggestionModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {}}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.iconWrap}>
            {mode === 'suggestion' ? (
              <Sparkles size={26} color={Colors.primary} strokeWidth={2.2} />
            ) : (
              <CalendarRange size={26} color={Colors.primary} strokeWidth={2.2} />
            )}
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          {mode === 'suggestion' && hint?.dayPlans.length ? (
            <View style={styles.detailCard}>
              {hint.dayPlans.map((plan) => (
                <Text key={plan.targetDate} style={styles.detailDayLine} numberOfLines={1}>
                  {formatWeekDayLabel(plan.targetDate)} · {plan.chantierNom} · {plan.heure_debutDisplay}–{plan.heure_finDisplay}
                </Text>
              ))}
            </View>
          ) : null}
          <View style={styles.buttons}>
            <TouchableOpacity
              style={styles.btnSecondary}
              onPress={onCancel}
              activeOpacity={0.85}
            >
              <Text style={styles.btnSecondaryText}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={onValidate}
              activeOpacity={0.85}
            >
              <Text style={styles.btnPrimaryText}>{validateLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(40, 28, 22, 0.52)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  sheet: {
    backgroundColor: '#FFF',
    borderRadius: 22,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 22,
    width: '100%',
    maxWidth: 380,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.14)',
    shadowColor: '#2d1810',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.22,
    shadowRadius: 28,
    elevation: 14,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFF3EF',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFE8DC',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text.primary,
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 10,
  },
  message: {
    fontSize: 15,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  detailCard: {
    backgroundColor: '#FFF7F2',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFE8DC',
    gap: 4,
  },
  detailWorksite: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text.primary,
    textAlign: 'center',
  },
  detailDayLine: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.primary,
    lineHeight: 17,
  },
  buttons: {
    flexDirection: 'row',
    gap: 11,
    width: '100%',
  },
  btnSecondary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF7F2',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.22)',
  },
  btnSecondaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  btnPrimary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    minHeight: 48,
  },
  btnPrimaryText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
});
