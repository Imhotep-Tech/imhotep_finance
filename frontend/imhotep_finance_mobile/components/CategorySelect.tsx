import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Modal, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import api from '../constants/api'; // Use the configured api instance
import { Ionicons } from '@expo/vector-icons';

interface CategorySelectProps {
    value: string;
    onChange: (value: string) => void;
    status: string; // 'deposit' or 'withdraw'
    required?: boolean;
}

const CategorySelect: React.FC<CategorySelectProps> = ({ value, onChange, status, required }) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [search, setSearch] = useState('');
    const [categoriesList, setCategoriesList] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let mounted = true;
        const fetchCategories = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/api/finance-management/get-category/?status=${status}`);
                if (!mounted) return;
                setCategoriesList(res.data.category || []);
            } catch (e) {
                console.log('Error fetching categories:', e);
                if (mounted) setCategoriesList([]);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        fetchCategories();
        return () => { mounted = false; };
    }, [status]);

    const filtered = categoriesList.filter(c =>
        c.toLowerCase().includes(search.toLowerCase())
    );

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
        closeIcon: isDark ? '#fff' : '#333',
        emptyText: {
            color: isDark ? '#94a3b8' : '#999',
        }
    };

    return (
        <View>
            <TouchableOpacity
                style={[styles.selector, themeStyles.selector]}
                onPress={() => setModalVisible(true)}
            >
                <Text style={[styles.selectorText, themeStyles.text]}>{value || 'Select Category'}</Text>
                <Ionicons name="chevron-down" size={20} color={isDark ? '#94a3b8' : '#666'} />
            </TouchableOpacity>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior="padding"
                >
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, themeStyles.modalContent]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, themeStyles.text]}>Select Category</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color={themeStyles.closeIcon} />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={[styles.searchInput, themeStyles.searchInput]}
                            placeholder="Search or add new..."
                            placeholderTextColor={isDark ? '#94a3b8' : '#999'}
                            value={search}
                            onChangeText={setSearch}
                        />

                        {loading ? (
                            <ActivityIndicator size="small" color="#51adac" />
                        ) : (
                            <FlatList
                                keyboardShouldPersistTaps="handled"
                                keyboardDismissMode="on-drag"
                                data={filtered}
                                keyExtractor={(item, index) => item + index}
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
                                ListEmptyComponent={
                                    <View style={styles.emptyContainer}>
                                        <Text style={[styles.emptyText, themeStyles.emptyText]}>No existing categories found.</Text>
                                        {search.length > 0 && (
                                            <TouchableOpacity
                                                style={styles.addNewButton}
                                                onPress={() => {
                                                    onChange(search);
                                                    setModalVisible(false);
                                                    setSearch('');
                                                }}
                                            >
                                                <Text style={styles.addNewText}>Add "{search}"</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                }
                            />
                        )}

                        {/* Allow adding if search doesn't match exactly but list is not empty */}
                        {!loading && filtered.length > 0 && search.length > 0 && !filtered.includes(search) && (
                            <TouchableOpacity
                                style={styles.addNewButtonFixed}
                                onPress={() => {
                                    onChange(search);
                                    setModalVisible(false);
                                    setSearch('');
                                }}
                            >
                                <Text style={styles.addNewText}>Add "{search}" as new</Text>
                            </TouchableOpacity>
                        )}

                        </View>
                    </View>
                </KeyboardAvoidingView>
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
    emptyContainer: {
        alignItems: 'center',
        marginTop: 20,
    },
    emptyText: {
        color: '#999',
        marginBottom: 10,
    },
    addNewButton: {
        backgroundColor: '#51adac',
        padding: 12,
        borderRadius: 8,
        width: '100%',
        alignItems: 'center',
    },
    addNewText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    addNewButtonFixed: {
        backgroundColor: '#51adac',
        padding: 12,
        borderRadius: 8,
        marginTop: 10,
        alignItems: 'center',
    },
});

export default CategorySelect;
