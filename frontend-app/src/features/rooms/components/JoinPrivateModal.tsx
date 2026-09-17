import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Room } from '../types';

interface JoinPrivateModalProps {
  room: Room | null;
  visible: boolean;
  onClose: () => void;
  onSubmit: (accessCode: string) => Promise<void>;
}

export const JoinPrivateModal: React.FC<JoinPrivateModalProps> = ({
  room,
  visible,
  onClose,
  onSubmit,
}) => {
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setAccessCode('');
    setError(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!accessCode.trim()) {
      setError('Please enter the room PIN');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await onSubmit(accessCode.trim());
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Invalid PIN code');
    } finally {
      setLoading(false);
    }
  };

  if (!room) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />

        <View style={styles.dialogWrapper}>
          <BlurView intensity={50} tint="dark" style={styles.dialog}>
            {/* Lock Icon */}
            <View style={styles.iconCircle}>
              <Ionicons name="lock-closed" size={28} color="#fbbf24" />
            </View>

            <Text style={styles.title}>Private Lounge</Text>
            <Text style={styles.subtitle} numberOfLines={2}>
              Enter PIN to access &ldquo;{room.name}&rdquo;
            </Text>

            {error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={14} color="#ef4444" style={{ marginRight: 6 }} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TextInput
              value={accessCode}
              onChangeText={(val) => {
                setAccessCode(val);
                if (error) setError(null);
              }}
              placeholder="Enter PIN code"
              placeholderTextColor="#64748b"
              secureTextEntry
              keyboardType="number-pad"
              maxLength={12}
              style={styles.input}
              autoFocus
            />

            <View style={styles.actions}>
              <TouchableOpacity
                onPress={handleClose}
                style={styles.cancelBtn}
                disabled={loading}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleSubmit}
                disabled={loading}
                style={styles.joinBtnWrapper}
              >
                <LinearGradient
                  colors={['#8b5cf6', '#6366f1']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.joinGradient}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text style={styles.joinText}>Unlock & Join</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    padding: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  dialogWrapper: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: '#0f172a',
  },
  dialog: {
    padding: 24,
    alignItems: 'center',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 14,
    width: '100%',
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 12,
    fontWeight: '500',
  },
  input: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#f8fafc',
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 4,
    marginBottom: 20,
  },
  actions: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  joinBtnWrapper: {
    flex: 1.5,
    borderRadius: 12,
    overflow: 'hidden',
  },
  joinGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
