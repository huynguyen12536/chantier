import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { Check, CircleAlert, X } from 'lucide-react-native';
import { Colors } from '@/constants/colors';

export type ConfirmModalProps = {
  visible: boolean;
  title: string;
  message: string;
  /** Ignored when singleButton is true */
  cancelLabel: string;
  confirmLabel: string;
  /** Ignored when singleButton is true */
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
  /** 'muted' = grey confirm (e.g. cancel shifts); 'danger' = red; 'primary' = orange */
  confirmVariant?: 'muted' | 'danger' | 'primary';
  /** Icon above title; defaults to danger (X) for confirm/cancel flows */
  iconVariant?: 'danger' | 'success' | 'warning';
  /** Info / error: one dismiss button only */
  singleButton?: boolean;
};

export function ConfirmModal({
  visible,
  title,
  message,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
  loading = false,
  confirmVariant = 'muted',
  iconVariant = 'danger',
  singleButton = false,
}: ConfirmModalProps) {
  const confirmBg =
    confirmVariant === 'danger'
      ? '#DC2626'
      : confirmVariant === 'primary'
        ? Colors.primary
        : iconVariant === 'success'
          ? '#16A34A'
          : '#64748B';
  const confirmTextStyle =
    confirmVariant === 'danger' ? styles.confirmDangerText : styles.confirmMutedText;
  const iconWrapStyle =
    iconVariant === 'success'
      ? styles.iconWrapSuccess
      : iconVariant === 'warning'
        ? styles.iconWrapWarning
        : styles.iconWrapDanger;

  const renderIcon = () => {
    if (iconVariant === 'success') {
      return <Check size={26} color="#16A34A" strokeWidth={2.5} />;
    }
    if (iconVariant === 'warning') {
      return <CircleAlert size={26} color={Colors.primary} strokeWidth={2.5} />;
    }
    return <X size={26} color="#DC2626" strokeWidth={2.5} />;
  };

  const dismiss = () => {
    if (!loading) singleButton ? onConfirm() : onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={loading ? undefined : singleButton ? () => onConfirm() : onCancel}
    >
      <Pressable style={styles.overlay} onPress={loading ? undefined : dismiss}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={[styles.iconWrap, iconWrapStyle]}>
            {renderIcon()}
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          {singleButton ? (
            <TouchableOpacity
              style={[styles.btnSingle, { backgroundColor: confirmBg }]}
              onPress={onConfirm}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={confirmTextStyle}>{confirmLabel}</Text>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.buttons}>
              <TouchableOpacity
                style={styles.btnSecondary}
                onPress={onCancel}
                disabled={loading}
                activeOpacity={0.85}
              >
                <Text style={styles.btnSecondaryText}>{cancelLabel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnPrimary, { backgroundColor: confirmBg }]}
                onPress={onConfirm}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={confirmTextStyle}>{confirmLabel}</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </Pressable>
      </Pressable>
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
    backgroundColor: Colors.surface,
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
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
    borderWidth: 1,
  },
  iconWrapDanger: {
    backgroundColor: '#FEE2E2',
    borderColor: 'rgba(220, 38, 38, 0.12)',
  },
  iconWrapSuccess: {
    backgroundColor: '#DCFCE7',
    borderColor: 'rgba(22, 163, 74, 0.15)',
  },
  iconWrapWarning: {
    backgroundColor: '#FEF9C3',
    borderColor: 'rgba(234, 179, 8, 0.25)',
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
    marginBottom: 24,
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
    minHeight: 48,
  },
  btnSingle: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  confirmMutedText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
  confirmDangerText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
  confirmWarningText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text.primary,
  },
});
