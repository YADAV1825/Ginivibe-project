//frontend-app/src/features/events/screens/CreateEventScreen.tsx
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Switch,
  Platform,
  Image,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AnimatedBackground from '../../../components/AnimatedBackground';
import { createEvent, uploadEventImage, CreateEventInput } from '../api/EventsAPI';

interface CreateEventScreenProps {
  onSuccess?: () => void;
  onBack: () => void;
}

interface InputFieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'number-pad';
  multiline?: boolean;
}

function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  multiline = false,
}: InputFieldProps) {
  return (
    <View style={styles.formGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#64748b"
        keyboardType={keyboardType}
        multiline={multiline}
      />
    </View>
  );
}

// Formats a Date for the picker button label. mode 'date' -> "Aug 29, 2026", mode 'time' -> "6:30 PM".
function formatPickerLabel(value: Date | null, mode: 'date' | 'time'): string {
  if (!value) return mode === 'date' ? 'Select date' : 'Select time';
  return mode === 'date'
    ? value.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : value.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

interface PickerFieldProps {
  label: string;
  value: Date | null;
  mode: 'date' | 'time';
  onChange: (next: Date) => void;
}

// Cross-platform "tap to open a real calendar/clock" field — never a text box the user types into.
// Native (iOS/Android): opens @react-native-community/datetimepicker.
// Web: renders a real browser <input type="date"/"time">, which is itself a calendar/time-select widget.
function PickerField({ label, value, mode, onChange }: PickerFieldProps) {
  const [open, setOpen] = useState(false);

  if (Platform.OS === 'web') {
    const toInputValue = () => {
      if (!value) return '';
      if (mode === 'date') {
        return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
      }
      return `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`;
    };

    const handleWebChange = (raw: string) => {
      if (!raw) return;
      const base = value ? new Date(value) : new Date();
      if (mode === 'date') {
        const [year, month, day] = raw.split('-').map(Number);
        base.setFullYear(year, month - 1, day);
      } else {
        const [hours, minutes] = raw.split(':').map(Number);
        base.setHours(hours, minutes, 0, 0);
      }
      onChange(base);
    };

    return (
      <View style={styles.formGroup}>
        <Text style={styles.label}>{label}</Text>
        {/* Real DOM input on web — a native browser calendar / time-select control. */}
        {React.createElement('input', {
          type: mode === 'date' ? 'date' : 'time',
          value: toInputValue(),
          onChange: (e: any) => handleWebChange(e.target.value),
          style: {
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            borderRadius: 12,
            padding: '12px 16px',
            fontSize: 15,
            color: '#f8fafc',
            width: '100%',
            colorScheme: 'dark',
          },
        })}
      </View>
    );
  }

  return (
    <View style={styles.formGroup}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.pickerButton} onPress={() => setOpen(true)}>
        <Ionicons name={mode === 'date' ? 'calendar-outline' : 'time-outline'} size={18} color="#94a3b8" style={{ marginRight: 10 }} />
        <Text style={styles.pickerButtonText}>{formatPickerLabel(value, mode)}</Text>
      </TouchableOpacity>
      {open && (
        <DateTimePicker
          value={value ?? new Date()}
          mode={mode}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event: DateTimePickerEvent, selected?: Date) => {
            if (Platform.OS === 'android') setOpen(false); // Android's dialog closes itself
            if (event.type === 'dismissed' || !selected) return;
            onChange(selected);
          }}
        />
      )}
      {Platform.OS === 'ios' && open && (
        <TouchableOpacity style={styles.pickerDoneButton} onPress={() => setOpen(false)}>
          <Text style={styles.pickerDoneButtonText}>Done</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function CreateEventScreen({ onSuccess, onBack }: CreateEventScreenProps) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const isSubmittingRef = useRef(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState<'ONLINE' | 'OFFLINE'>('ONLINE');
  
  // Date/Time state — full Date objects set only via the calendar/time pickers, never typed.
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  
  // Online-specific
  const [meetingUrl, setMeetingUrl] = useState('');
  const [platform, setPlatform] = useState('');
  
  // Offline-specific
  const [venue, setVenue] = useState('');
  const [location, setLocation] = useState('');
  
  // Other
  const [capacity, setCapacity] = useState('');

  // Banner image
  const [bannerPreviewUri, setBannerPreviewUri] = useState<string | null>(null);
  const [bannerImageUrl, setBannerImageUrl] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to add an event image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    setBannerPreviewUri(asset.uri);
    setBannerImageUrl(null); // clear any previous uploaded URL until the new upload finishes
    setImageUploading(true);

    try {
      const response = await uploadEventImage({
        uri: asset.uri,
        fileName: asset.fileName,
        mimeType: asset.mimeType,
      });
      setBannerImageUrl(response.data.url);
    } catch (error: any) {
      Alert.alert('Image upload failed', error.message || 'Please try a different image.');
      setBannerPreviewUri(null);
    } finally {
      setImageUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setBannerPreviewUri(null);
    setBannerImageUrl(null);
  };

  const handleCreate = async () => {
    if (isSubmittingRef.current) return;

    isSubmittingRef.current = true;
    setLoading(true);

    try {
      // Validation
      if (!title.trim()) {
        Alert.alert('Error', 'Please enter event title');
        return;
      }

      if (!startDate || !startTime || !endDate || !endTime) {
        Alert.alert('Error', 'Please enter start and end date/time');
        return;
      }

      if (mode === 'ONLINE') {
        if (!meetingUrl.trim()) {
          Alert.alert('Error', 'Please enter meeting URL for online events');
          return;
        }
      } else {
        if (!venue.trim() || !location.trim()) {
          Alert.alert('Error', 'Please enter venue and location for offline events');
          return;
        }
      }

      if (imageUploading) {
        Alert.alert('Please wait', 'Your event image is still uploading.');
        return;
      }

      // Combine the separately-picked date and time into one instant.
      const combine = (date: Date, time: Date) => {
        const combined = new Date(date);
        combined.setHours(time.getHours(), time.getMinutes(), 0, 0);
        return combined;
      };
      const startAt = combine(startDate, startTime).toISOString();
      const endAt = combine(endDate, endTime).toISOString();

      if (new Date(endAt) <= new Date(startAt)) {
        Alert.alert('Error', 'End time must be after start time');
        return;
      }

      const eventData: CreateEventInput = {
        title: title.trim(),
        description: description.trim() || undefined,
        startAt,
        endAt,
        mode,
        capacity: capacity ? parseInt(capacity) : undefined,
        bannerImageUrl: bannerImageUrl || undefined,
      };

      if (mode === 'ONLINE') {
        eventData.meetingUrl = meetingUrl.trim();
        eventData.platform = platform.trim() || undefined;
      } else {
        eventData.venue = venue.trim();
        eventData.location = location.trim();
      }

      const response = await createEvent(eventData);

      if (response.success) {
        if (onSuccess) onSuccess();

        Alert.alert('Success', 'Event created successfully!', [
          {
            text: 'OK',
            onPress: onBack,
          },
        ]);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create event');
    } finally {
      isSubmittingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Event</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: 140 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Banner Image Section */}
          <Animated.View entering={FadeInDown.delay(50).springify()}>
            <BlurView intensity={30} tint="dark" style={styles.section}>
              <Text style={styles.sectionTitle}>Event Image (Optional)</Text>
              {bannerPreviewUri ? (
                <View style={styles.bannerPreviewWrap}>
                  <Image source={{ uri: bannerPreviewUri }} style={styles.bannerPreview} />
                  {imageUploading && (
                    <View style={styles.bannerUploadingOverlay}>
                      <ActivityIndicator size="small" color="#fff" />
                    </View>
                  )}
                  <TouchableOpacity style={styles.bannerRemoveButton} onPress={handleRemoveImage}>
                    <Ionicons name="close-circle" size={26} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.bannerPicker} onPress={handlePickImage}>
                  <Ionicons name="image-outline" size={28} color="#94a3b8" />
                  <Text style={styles.bannerPickerText}>Add a cover photo for your event</Text>
                </TouchableOpacity>
              )}
            </BlurView>
          </Animated.View>

          {/* Title Section */}
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <BlurView intensity={30} tint="dark" style={styles.section}>
              <InputField
                label="Event Title"
                value={title}
                onChangeText={setTitle}
                placeholder="Enter event name"
              />
              <InputField
                label="Description (Optional)"
                value={description}
                onChangeText={setDescription}
                placeholder="Tell attendees about your event"
                multiline={true}
              />
            </BlurView>
          </Animated.View>

          {/* Mode Selection */}
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <BlurView intensity={30} tint="dark" style={styles.section}>
              <Text style={styles.sectionTitle}>Event Type</Text>
              <View style={styles.modeSelector}>
                <TouchableOpacity
                  style={[
                    styles.modeButton,
                    mode === 'ONLINE' && styles.modeButtonActive,
                  ]}
                  onPress={() => setMode('ONLINE')}
                >
                  <Ionicons
                    name="globe-outline"
                    size={20}
                    color={mode === 'ONLINE' ? '#10b981' : '#94a3b8'}
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    style={[
                      styles.modeButtonText,
                      mode === 'ONLINE' && styles.modeButtonTextActive,
                    ]}
                  >
                    Online
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modeButton,
                    mode === 'OFFLINE' && styles.modeButtonActive,
                  ]}
                  onPress={() => setMode('OFFLINE')}
                >
                  <Ionicons
                    name="location-outline"
                    size={20}
                    color={mode === 'OFFLINE' ? '#f59e0b' : '#94a3b8'}
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    style={[
                      styles.modeButtonText,
                      mode === 'OFFLINE' && styles.modeButtonTextActive,
                    ]}
                  >
                    In-Person
                  </Text>
                </TouchableOpacity>
              </View>
            </BlurView>
          </Animated.View>

          {/* Date/Time Section */}
          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <BlurView intensity={30} tint="dark" style={styles.section}>
              <Text style={styles.sectionTitle}>Date & Time</Text>
              <View style={styles.dateTimeRow}>
                <View style={styles.dateTimeHalf}>
                  <PickerField label="Start Date" value={startDate} mode="date" onChange={setStartDate} />
                </View>
                <View style={styles.dateTimeHalf}>
                  <PickerField label="Start Time" value={startTime} mode="time" onChange={setStartTime} />
                </View>
              </View>
              <View style={styles.dateTimeRow}>
                <View style={styles.dateTimeHalf}>
                  <PickerField label="End Date" value={endDate} mode="date" onChange={setEndDate} />
                </View>
                <View style={styles.dateTimeHalf}>
                  <PickerField label="End Time" value={endTime} mode="time" onChange={setEndTime} />
                </View>
              </View>
            </BlurView>
          </Animated.View>

          {/* Online Event Fields */}
          {mode === 'ONLINE' && (
            <Animated.View entering={FadeInDown.delay(400).springify()}>
              <BlurView intensity={30} tint="dark" style={styles.section}>
                <Text style={styles.sectionTitle}>Online Meeting Details</Text>
                <InputField
                  label="Meeting URL"
                  value={meetingUrl}
                  onChangeText={setMeetingUrl}
                  placeholder="https://zoom.us/j/..."
                />
                <InputField
                  label="Platform (Optional)"
                  value={platform}
                  onChangeText={setPlatform}
                  placeholder="e.g., Zoom, Google Meet, Microsoft Teams"
                />
              </BlurView>
            </Animated.View>
          )}

          {/* Offline Event Fields */}
          {mode === 'OFFLINE' && (
            <Animated.View entering={FadeInDown.delay(400).springify()}>
              <BlurView intensity={30} tint="dark" style={styles.section}>
                <Text style={styles.sectionTitle}>Venue Details</Text>
                <InputField
                  label="Venue Name"
                  value={venue}
                  onChangeText={setVenue}
                  placeholder="e.g., City Hall, Community Center"
                />
                <InputField
                  label="Address/Location"
                  value={location}
                  onChangeText={setLocation}
                  placeholder="Full address with city and postal code"
                  multiline={true}
                />
              </BlurView>
            </Animated.View>
          )}

          {/* Capacity Section */}
          <Animated.View entering={FadeInDown.delay(500).springify()}>
            <BlurView intensity={30} tint="dark" style={styles.section}>
              <InputField
                label="Capacity (Optional)"
                value={capacity}
                onChangeText={setCapacity}
                placeholder="Max attendees"
                keyboardType="number-pad"
              />
            </BlurView>
          </Animated.View>

          <View style={{ height: 32 }} />
        </ScrollView>

        {/* Create Button */}
        <Animated.View entering={FadeInDown.delay(600).springify()} style={styles.buttonContainer}>
          <BlurView intensity={40} tint="dark" style={styles.buttonBlur}>
            <TouchableOpacity
              style={[styles.createButton, loading && styles.createButtonDisabled]}
              onPress={handleCreate}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="add-circle-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.createButtonText}>Create Event</Text>
                </>
              )}
            </TouchableOpacity>
          </BlurView>
        </Animated.View>
      </View>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  section: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#f8fafc',
  },
  inputMultiline: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pickerButtonText: {
    fontSize: 15,
    color: '#f8fafc',
  },
  pickerDoneButton: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  pickerDoneButtonText: {
    color: '#818cf8',
    fontSize: 14,
    fontWeight: '700',
  },
  bannerPicker: {
    height: 140,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(148, 163, 184, 0.3)',
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  bannerPickerText: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
  },
  bannerPreviewWrap: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  bannerPreview: {
    width: '100%',
    height: 160,
    borderRadius: 12,
  },
  bannerUploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerRemoveButton: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  modeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
  },
  modeButtonActive: {
    backgroundColor: 'rgba(129, 140, 248, 0.15)',
    borderColor: 'rgba(129, 140, 248, 0.3)',
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
  },
  modeButtonTextActive: {
    color: '#f8fafc',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  dateTimeHalf: {
    flex: 1,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 88 : 80,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 10,
    elevation: 10,
  },
  buttonBlur: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(129, 140, 248, 0.8)',
    paddingVertical: 14,
    borderRadius: 10,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});