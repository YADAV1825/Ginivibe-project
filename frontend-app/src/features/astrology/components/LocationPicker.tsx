import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { AstrologyApi } from '../api/api';

interface LocationPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (location: any) => void;
}

export default function LocationPicker({ visible, onClose, onSelect }: LocationPickerProps) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) {
      setSearch('');
      setResults([]);
    }
  }, [visible]);

  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (search.length >= 3) {
        setLoading(true);
        try {
          const data = await AstrologyApi.searchLocations(search);
          setResults(data);
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(searchTimeout);
  }, [search]);

  const handleSelectCity = (city: any) => {
    onSelect({
      city: city.name,
      latitude: parseFloat(city.lat),
      longitude: parseFloat(city.lng),
    });
    onClose();
  };

  const goBack = () => {
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={goBack} style={styles.iconBtn}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.title}>Select City</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#94a3b8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search..."
              placeholderTextColor="#94a3b8"
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {loading ? (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color="#c084fc" />
            </View>
          ) : (
            <FlatList
              data={results}
              keyExtractor={(item, index) => item.name + item.state + index}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.listItem}
                  onPress={() => handleSelectCity(item)}
                >
                  <Text style={styles.listText}>{item.name}, {item.state}, {item.country}</Text>
                  <Ionicons name="location" size={20} color="#64748b" />
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 60,
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    margin: 20,
    paddingHorizontal: 16,
    borderRadius: 12,
    height: 48,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    marginLeft: 12,
    fontSize: 16,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  listText: {
    color: '#fff',
    fontSize: 16,
  }
});
