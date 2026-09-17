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
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { CreateRoomInput, RoomType, RoomVisibility } from '../types';

interface CreateRoomModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (input: CreateRoomInput) => Promise<void>;
}

const CAPACITY_OPTIONS = [5, 10, 15, 20, 30];

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<RoomType>('TEXT');
  const [visibility, setVisibility] = useState<RoomVisibility>('OPEN');
  const [accessCode, setAccessCode] = useState('');
  const [maxCapacity, setMaxCapacity] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReset = () => {
    setName('');
    setType('TEXT');
    setVisibility('OPEN');
    setAccessCode('');
    setMaxCapacity(30);
    setError(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!name.trim() || name.trim().length < 3) {
      setError('Room name must be at least 3 characters');
      return;
    }

    if (visibility === 'PRIVATE' && (!accessCode || accessCode.trim().length < 4)) {
      setError('Private rooms require a 4+ digit PIN');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await onSubmit({
        name: name.trim(),
        type,
        visibility,
        accessCode: visibility === 'PRIVATE' ? accessCode.trim() : undefined,
        maxCapacity,
      });
      handleReset();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
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

        <View style={styles.sheetContainer}>
          <BlurView intensity={45} tint="dark" style={styles.sheet}>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>Create a Lounge</Text>
                <Text style={styles.subtitle}>Host a live community room</Text>
              </View>
              <TouchableOpacity
                onPress={handleClose}
                style={styles.closeBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color="#ef4444" style={{ marginRight: 6 }} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.formContent}
            >
              {/* Room Name */}
              <View style={styles.field}>
                <Text style={styles.label}>Lounge Name</Text>
                <TextInput
                  value={name}
                  onChangeText={(val) => {
                    setName(val);
                    if (error) setError(null);
                  }}
                  placeholder="e.g., Chill Late Night Vibes 🌙"
                  placeholderTextColor="#64748b"
                  style={styles.input}
                  maxLength={50}
                />
              </View>

              {/* Room Type */}
              <View style={styles.field}>
                <Text style={styles.label}>Room Mode</Text>
                <View style={styles.typeRow}>
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.selectionAsync();
                      setType('TEXT');
                    }}
                    style={[styles.typeOption, type === 'TEXT' && styles.typeOptionActive]}
                  >
                    <Ionicons
                      name="chatbubble-ellipses"
                      size={18}
                      color={type === 'TEXT' ? '#818cf8' : '#64748b'}
                    />
                    <Text style={[styles.typeText, type === 'TEXT' && styles.typeTextActive]}>
                      Text Chat
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      Haptics.selectionAsync();
                      setType('VOICE');
                    }}
                    style={[styles.typeOption, type === 'VOICE' && styles.typeOptionActive]}
                  >
                    <Ionicons
                      name="mic"
                      size={18}
                      color={type === 'VOICE' ? '#34d399' : '#64748b'}
                    />
                    <Text style={[styles.typeText, type === 'VOICE' && styles.typeTextActive]}>
                      Voice Hub
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      Haptics.selectionAsync();
                      setType('VIDEO');
                    }}
                    style={[styles.typeOption, type === 'VIDEO' && styles.typeOptionActive]}
                  >
                    <Ionicons
                      name="videocam"
                      size={18}
                      color={type === 'VIDEO' ? '#c084fc' : '#64748b'}
                    />
                    <Text style={[styles.typeText, type === 'VIDEO' && styles.typeTextActive]}>
                      Video Stage
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Visibility */}
              <View style={styles.field}>
                <Text style={styles.label}>Audience Access</Text>
                <View style={styles.visibilityRow}>
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.selectionAsync();
                      setVisibility('OPEN');
                    }}
                    style={[
                      styles.visibilityOption,
                      visibility === 'OPEN' && styles.visibilityOptionActive,
                    ]}
                  >
                    <Ionicons
                      name="globe-outline"
                      size={16}
                      color={visibility === 'OPEN' ? '#38bdf8' : '#64748b'}
                    />
                    <View style={styles.visibilityTextGroup}>
                      <Text
                        style={[
                          styles.visibilityTitle,
                          visibility === 'OPEN' && styles.visibilityTitleActive,
                        ]}
                      >
                        Public
                      </Text>
                      <Text style={styles.visibilitySub}>Anyone can discover & join</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      Haptics.selectionAsync();
                      setVisibility('PRIVATE');
                    }}
                    style={[
                      styles.visibilityOption,
                      visibility === 'PRIVATE' && styles.visibilityOptionActive,
                    ]}
                  >
                    <Ionicons
                      name="lock-closed-outline"
                      size={16}
                      color={visibility === 'PRIVATE' ? '#fbbf24' : '#64748b'}
                    />
                    <View style={styles.visibilityTextGroup}>
                      <Text
                        style={[
                          styles.visibilityTitle,
                          visibility === 'PRIVATE' && styles.visibilityTitleActive,
                        ]}
                      >
                        Private
                      </Text>
                      <Text style={styles.visibilitySub}>Requires 4-digit PIN</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Access Code Input (if private) */}
              {visibility === 'PRIVATE' && (
                <View style={styles.field}>
                  <Text style={styles.label}>Access PIN (Min 4 digits)</Text>
                  <TextInput
                    value={accessCode}
                    onChangeText={(val) => {
                      setAccessCode(val);
                      if (error) setError(null);
                    }}
                    placeholder="Enter 4-digit PIN"
                    placeholderTextColor="#64748b"
                    keyboardType="number-pad"
                    maxLength={10}
                    style={styles.input}
                  />
                </View>
              )}

              {/* Capacity Chips */}
              <View style={styles.field}>
                <Text style={styles.label}>Max Capacity</Text>
                <View style={styles.capacityRow}>
                  {CAPACITY_OPTIONS.map((cap) => (
                    <TouchableOpacity
                      key={cap}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setMaxCapacity(cap);
                      }}
                      style={[
                        styles.capacityChip,
                        maxCapacity === cap && styles.capacityChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.capacityChipText,
                          maxCapacity === cap && styles.capacityChipTextActive,
                        ]}
                      >
                        {cap}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Submit CTA */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleSubmit}
                disabled={loading}
                style={styles.submitBtnWrapper}
              >
                <LinearGradient
                  colors={['#8b5cf6', '#6366f1']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitGradient}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <>
                      <Text style={styles.submitText}>Launch Lounge</Text>
                      <Ionicons
                        name="sparkles"
                        size={16}
                        color="#ffffff"
                        style={{ marginLeft: 6 }}
                      />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </BlurView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheetContainer: {
    maxHeight: '90%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: '#0f172a',
  },
  sheet: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f8fafc',
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 13,
    fontWeight: '500',
  },
  formContent: {
    gap: 16,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#f8fafc',
    fontSize: 15,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 6,
  },
  typeOptionActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderColor: '#8b5cf6',
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  typeTextActive: {
    color: '#f8fafc',
    fontWeight: '700',
  },
  visibilityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  visibilityOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 8,
  },
  visibilityOptionActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: '#38bdf8',
  },
  visibilityTextGroup: {
    flex: 1,
  },
  visibilityTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  visibilityTitleActive: {
    color: '#f8fafc',
  },
  visibilitySub: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 1,
  },
  capacityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  capacityChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  capacityChipActive: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    borderColor: '#a855f7',
  },
  capacityChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  capacityChipTextActive: {
    color: '#c084fc',
    fontWeight: '700',
  },
  submitBtnWrapper: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  submitText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
