import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Modal, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import api from '../constants/api'; // Use the configured api instance
import { currencies } from '../constants/currencies';

interface CurrencySelectProps {
    value: string;
    onChange: (value: string) => void;
    required?: boolean;
}

const CurrencySelect: React.FC<CurrencySelectProps> = ({ value, onChange, required }) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [search, setSearch] = useState('');
    const [favoriteCurrency, setFavoriteCurrency] = useState('');
    const [loading, setLoading] = useState(false);

    const filtered = currencies.filter(c =>
        c.toLowerCase().includes(search.toLowerCase())
    );

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setLoading(true);
                // Using the api instance which handles base URL
                const res = await api.get('/api/get-fav-currency/');
                if (!mounted) return;
                const fav = res.data.favorite_currency || '';
                setFavoriteCurrency(fav);
                if (fav && (!value || value === '')) {
                    onChange(fav);
                }
            } catch (e) {
                console.log('Error fetching favorite currency:', e);
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => { mounted = false; };
        // We intentionally run this only once on mount to avoid repeated network calls.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Whenever the parent clears the value (e.g. when reopening a modal),
    // reapply the favorite currency if we already know it.
    useEffect(() => {
        if (favoriteCurrency && (!value || value === '')) {
            onChange(favoriteCurrency);
        }
    }, [favoriteCurrency, value, onChange]);

    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const themeStyles = {
        selector: {
            backgroundColor: isDark ? '#1e293b' : '#fff',
            borderColor: isDark ? '#475569' : '#ddd',
        },
        text: {
            color: isDark ? '#f1f5f9' : '#333',
        },
        modalContent: {
            backgroundColor: isDark ? '#1e293b' : '#fff',
        },
        searchInput: {
            backgroundColor: isDark ? '#334155' : '#f5f5f5',
            color: isDark ? '#f1f5f9' : '#333',
        },
        item: {
            borderBottomColor: isDark ? '#334155' : '#f0f0f0',
        },
        closeIcon: isDark ? '#fff' : '#333'
    };

    return (
        <View>
            <TouchableOpacity
                style={[styles.selector, themeStyles.selector]}
                onPress={() => setModalVisible(true)}
            >
                <Text style={[styles.selectorText, themeStyles.text]}>{value || 'Select Currency'}</Text>
                <Ionicons name="chevron-down" size={20} color={isDark ? '#94a3b8' : '#666'} />
            </TouchableOpacity>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, themeStyles.modalContent]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, themeStyles.text]}>Select Currency</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color={themeStyles.closeIcon} />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={[styles.searchInput, themeStyles.searchInput]}
                            placeholder="Search currency..."
                            placeholderTextColor={isDark ? '#94a3b8' : '#999'}
                            value={search}
                            onChangeText={setSearch}
                        />

                        <FlatList
                            data={filtered}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[styles.item, themeStyles.item, item === value && styles.selectedItem]}
                                    onPress={() => {
                                        onChange(item);
                                        setModalVisible(false);
                                        setSearch('');
                                    }}
                                >
                                    <Text style={[styles.itemText, themeStyles.text, item === value && styles.selectedItemText]}>{item}</Text>
                                    {item === value && <Ionicons name="checkmark" size={20} color="#fff" />}
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={<Text style={styles.emptyText}>No currencies found</Text>}
                        />
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    selector: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    selectorText: {
        fontSize: 16,
        color: '#333',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    searchInput: {
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 12,
        marginBottom: 20,
        fontSize: 16,
        color: '#333',
    },
    item: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    selectedItem: {
        backgroundColor: '#51adac',
        borderRadius: 8,
        borderBottomWidth: 0,
    },
    itemText: {
        fontSize: 16,
        color: '#333',
    },
    selectedItemText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    emptyText: {
        textAlign: 'center',
        color: '#999',
        marginTop: 20,
    },
});

export default CurrencySelect;
