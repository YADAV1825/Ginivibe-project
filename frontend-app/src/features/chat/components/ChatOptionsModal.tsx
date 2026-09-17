import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

export interface ChatOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  isMuted?: boolean;
  onToggleMute: () => void;
  onDeleteConversation: () => void | Promise<void>;
  onBlockUser?: () => void | Promise<void>;
  canBlock?: boolean;
}

export default function ChatOptionsModal({
  visible,
  onClose,
  title,
  isMuted = false,
  onToggleMute,
  onDeleteConversation,
  onBlockUser,
  canBlock = true,
}: ChatOptionsModalProps) {
  const [confirmMode, setConfirmMode] = useState<'none' | 'delete' | 'block'>('none');
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    if (loading) return;
    setConfirmMode('none');
    onClose();
  };

  const handleExecuteDelete = async () => {
    setLoading(true);
    try {
      await onDeleteConversation();
      setConfirmMode('none');
      onClose();
    } catch (e) {
      console.error('Delete conversation error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteBlock = async () => {
    if (!onBlockUser) return;
    setLoading(true);
    try {
      await onBlockUser();
      setConfirmMode('none');
      onClose();
    } catch (e) {
      console.error('Block user error:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheetContainer}>
              <BlurView intensity={60} tint="dark" style={styles.sheetBlur}>
                {/* Drag Handle Indicator */}
                <View style={styles.handleBar} />

                {confirmMode === 'none' && (
                  <>
                    {/* Header */}
                    <View style={styles.header}>
                      <Text style={styles.sheetTitle} numberOfLines={1}>
                        {title}
                      </Text>
                      <Text style={styles.sheetSub}>Conversation Options</Text>
                    </View>

                    {/* Action Items */}
                    <View style={styles.actionsList}>
                      {/* Mute / Unmute */}
                      <TouchableOpacity
                        style={styles.actionItem}
                        activeOpacity={0.7}
                        onPress={() => {
                          onToggleMute();
                          handleClose();
                        }}
                      >
                        <View style={[styles.iconWrap, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
                          <Ionicons
                            name={isMuted ? 'volume-high-outline' : 'volume-mute-outline'}
                            size={20}
                            color="#c084fc"
                          />
                        </View>
                        <View style={styles.actionMeta}>
                          <Text style={styles.actionLabel}>
                            {isMuted ? 'Unmute Messages' : 'Mute Messages'}
                          </Text>
                          <Text style={styles.actionDescription}>
                            {isMuted
                              ? 'Receive message notifications again'
                              : 'Turn off notifications for this conversation'}
                          </Text>
                        </View>
                      </TouchableOpacity>

                      {/* Delete Conversation */}
                      <TouchableOpacity
                        style={styles.actionItem}
                        activeOpacity={0.7}
                        onPress={() => setConfirmMode('delete')}
                      >
                        <View style={[styles.iconWrap, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                          <Ionicons name="trash-outline" size={20} color="#ef4444" />
                        </View>
                        <View style={styles.actionMeta}>
                          <Text style={[styles.actionLabel, { color: '#ef4444' }]}>
                            Delete Conversation
                          </Text>
                          <Text style={styles.actionDescription}>
                            Permanently delete this chat for you
                          </Text>
                        </View>
                      </TouchableOpacity>

                      {/* Block User */}
                      {canBlock && onBlockUser && (
                        <TouchableOpacity
                          style={styles.actionItem}
                          activeOpacity={0.7}
                          onPress={() => setConfirmMode('block')}
                        >
                          <View style={[styles.iconWrap, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                            <Ionicons name="ban-outline" size={20} color="#ef4444" />
                          </View>
                          <View style={styles.actionMeta}>
                            <Text style={[styles.actionLabel, { color: '#ef4444' }]}>
                              Block User
                            </Text>
                            <Text style={styles.actionDescription}>
                              Prevent them from messaging or matching with you
                            </Text>
                          </View>
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Cancel Button */}
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      activeOpacity={0.8}
                      onPress={handleClose}
                    >
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                  </>
                )}

                {/* In-Modal Confirmation for Delete */}
                {confirmMode === 'delete' && (
                  <View style={styles.confirmWrap}>
                    <View style={[styles.confirmIconWrap, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                      <Ionicons name="trash" size={28} color="#ef4444" />
                    </View>
                    <Text style={styles.confirmTitle}>Delete Conversation?</Text>
                    <Text style={styles.confirmSub}>
                      Once deleted, this conversation and its messages will be removed permanently.
                    </Text>

                    <View style={styles.confirmBtnsRow}>
                      <TouchableOpacity
                        style={styles.confirmCancelBtn}
                        onPress={() => setConfirmMode('none')}
                        disabled={loading}
                      >
                        <Text style={styles.confirmCancelText}>Cancel</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.confirmDestructiveBtn, { backgroundColor: '#dc2626' }]}
                        onPress={handleExecuteDelete}
                        disabled={loading}
                      >
                        {loading ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text style={styles.confirmDestructiveText}>Delete</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* In-Modal Confirmation for Block */}
                {confirmMode === 'block' && (
                  <View style={styles.confirmWrap}>
                    <View style={[styles.confirmIconWrap, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                      <Ionicons name="ban" size={28} color="#ef4444" />
                    </View>
                    <Text style={styles.confirmTitle}>Block @{title}?</Text>
                    <Text style={styles.confirmSub}>
                      They will not be able to message you or find your profile in Matching. Existing direct messages will be deleted.
                    </Text>

                    <View style={styles.confirmBtnsRow}>
                      <TouchableOpacity
                        style={styles.confirmCancelBtn}
                        onPress={() => setConfirmMode('none')}
                        disabled={loading}
                      >
                        <Text style={styles.confirmCancelText}>Cancel</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.confirmDestructiveBtn, { backgroundColor: '#dc2626' }]}
                        onPress={handleExecuteBlock}
                        disabled={loading}
                      >
                        {loading ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text style={styles.confirmDestructiveText}>Block</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </BlurView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  sheetBlur: {
    backgroundColor: 'rgba(15, 23, 42, 0.98)',
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
  },
  handleBar: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.07)',
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#f8fafc',
  },
  sheetSub: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  actionsList: {
    gap: 8,
    marginBottom: 16,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  actionMeta: {
    flex: 1,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f8fafc',
  },
  actionDescription: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  cancelBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#cbd5e1',
  },
  confirmWrap: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  confirmIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 8,
    textAlign: 'center',
  },
  confirmSub: {
    fontSize: 13.5,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  confirmBtnsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  confirmCancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmCancelText: {
    color: '#cbd5e1',
    fontSize: 15,
    fontWeight: '600',
  },
  confirmDestructiveBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmDestructiveText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
