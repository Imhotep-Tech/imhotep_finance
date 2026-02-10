import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    RefreshControl,
    Modal,
    Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from '@/hooks/use-color-scheme';
import api from '@/constants/api';

const FilterModal = ({ visible, options, onSelect, onClose, title, selectedValue }: any) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: isDark ? '#1e293b' : 'white' }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>{title}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={isDark ? '#94a3b8' : '#64748b'} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={true}>
                        {options.map((opt: any) => (
                            <TouchableOpacity
                                key={opt.value}
                                style={[
                                    styles.optionItem,
                                    {
                                        borderBottomColor: isDark ? '#334155' : '#f1f5f9',
                                        backgroundColor: selectedValue === opt.value ? (isDark ? '#334155' : '#f0f9ff') : 'transparent'
                                    }
                                ]}
                                onPress={() => onSelect(opt.value)}
                            >
                                <Text style={[
                                    styles.optionText,
                                    {
                                        color: selectedValue === opt.value ? '#366c6b' : (isDark ? '#f1f5f9' : '#1e293b'),
                                        fontWeight: selectedValue === opt.value ? '600' : 'normal'
                                    }
                                ]}>
                                    {opt.label}
                                </Text>
                                {selectedValue === opt.value && (
                                    <Ionicons name="checkmark-circle" size={22} color="#366c6b" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};


export default function ReportsScreen() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const [reportType, setReportType] = useState<'monthly' | 'yearly'>('monthly');
    const [loading, setLoading] = useState(true);
    const [dataLoading, setDataLoading] = useState(false);
    const [recalculateLoading, setRecalculateLoading] = useState(false);
    const [error, setError] = useState('');
    const [favoriteCurrency, setFavoriteCurrency] = useState('USD');

    // History Data
    const [historicalMonths, setHistoricalMonths] = useState<any[]>([]);
    const [availableYears, setAvailableYears] = useState<number[]>([]);

    // Selected Values
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedYear, setSelectedYear] = useState<string>('');

    // Report Data
    const [reportData, setReportData] = useState<any>(null);

    // Selectors Visibility
    const [showMonthSelector, setShowMonthSelector] = useState(false);
    const [showYearSelector, setShowYearSelector] = useState(false);

    // Initial Load
    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Currency
            try {
                const currencyRes = await api.get('/api/get-fav-currency/');
                setFavoriteCurrency(currencyRes.data.favorite_currency || 'USD');
            } catch (e) {
                console.warn('Failed to fetch currency');
            }

            // 2. Fetch History
            const monthsRes = await api.get('/api/finance-management/get-report-history-months/');
            const months = monthsRes.data.report_history_months || [];
            setHistoricalMonths(months);

            const yearsRes = await api.get('/api/finance-management/get-report-history-years/');
            const years = yearsRes.data.report_history_years || [new Date().getFullYear()];
            setAvailableYears(years);

            // 3. Set Defaults
            const now = new Date();
            const currentM = now.getMonth() + 1;
            const currentY = now.getFullYear();

            // Default Month
            const currentMonthExists = months.some((m: any) => m.month === currentM && m.year === currentY);
            if (currentMonthExists) {
                setSelectedMonth(`${currentM}-${currentY}`);
            } else if (months.length > 0) {
                setSelectedMonth(`${months[0].month}-${months[0].year}`);
            }

            // Default Year
            setSelectedYear(currentY.toString());

        } catch (err) {
            console.error('Initial load error:', err);
            setError('Failed to load initial data');
        } finally {
            setLoading(false);
        }
    };

    // Fetch Report Data
    useEffect(() => {
        if (!loading) {
            fetchReportData();
        }
    }, [selectedMonth, selectedYear, reportType]);

    const fetchReportData = async () => {
        if (reportType === 'monthly' && !selectedMonth) return;
        if (reportType === 'yearly' && !selectedYear) return;

        setDataLoading(true);
        setError('');
        setReportData(null);

        try {
            let res;
            if (reportType === 'monthly') {
                const [m, y] = selectedMonth.split('-');
                res = await api.get(`/api/finance-management/get-monthly-report-history/?month=${m}&year=${y}`);
                setReportData(res.data.report_data);
            } else {
                res = await api.get(`/api/finance-management/get-yearly-report/?year=${selectedYear}`);
                setReportData(res.data);
            }

            // Update currency if returned
            if (res.data.favorite_currency || res.data.report_data?.favorite_currency) {
                const newCurr = res.data.favorite_currency || res.data.report_data?.favorite_currency;
                if (newCurr !== favoriteCurrency) setFavoriteCurrency(newCurr);
            }

        } catch (err: any) {
            console.error('Report fetch error:', err);
            setError(err.response?.data?.error || 'Failed to load report data');
        } finally {
            setDataLoading(false);
        }
    };

    const handleRecalculate = async () => {
        Alert.alert(
            "Recalculate Reports",
            "This will recalculate all monthly reports from your first to last transaction. This may take a moment. Continue?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Continue", onPress: async () => {
                        setRecalculateLoading(true);
                        try {
                            const response = await api.post('/api/finance-management/recalculate-reports/');
                            const summary = response.data.summary;
                            Alert.alert(
                                "Success",
                                `Processed: ${summary.total_months_processed}\nCreated: ${summary.months_created}\nUpdated: ${summary.months_updated}`
                            );
                            // Refresh history
                            loadInitialData();
                        } catch (err: any) {
                            Alert.alert("Error", err.response?.data?.error || "Recalculation failed");
                        } finally {
                            setRecalculateLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const getMonthName = (monthNum: number) => {
        const date = new Date();
        date.setMonth(monthNum - 1);
        return date.toLocaleString('default', { month: 'long' });
    };

    // Prepare Selector Options
    const monthOptions = historicalMonths.map(m => ({
        label: `${getMonthName(m.month)} ${m.year}`,
        value: `${m.month}-${m.year}`
    }));

    const yearOptions = availableYears.map(y => ({
        label: y.toString(),
        value: y.toString()
    }));

    // Visualization Components
    const ProgressBar = ({ percentage, color }: { percentage: number, color: string }) => (
        <View style={styles.progressContainer}>
            <LinearGradient
                colors={[color, `${color}99`]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressBar, { width: `${Math.max(percentage, 2)}%` }]}
            />
        </View>
    );

    const formatCurrency = (amount: number) => {
        return `${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${favoriteCurrency}`;
    };

    const themeStyles = {
        container: {
            backgroundColor: isDark ? '#0f172a' : '#f8fafc',
        },
        card: {
            backgroundColor: isDark ? '#1e293b' : 'white',
            borderColor: isDark ? '#334155' : '#e2e8f0',
        },
        text: {
            color: isDark ? '#f1f5f9' : '#1e293b',
        },
        subText: {
            color: isDark ? '#94a3b8' : '#64748b',
        },
        activeTab: {
            backgroundColor: '#366c6b',
        },
        inactiveTab: {
            backgroundColor: isDark ? '#1e293b' : 'white',
            borderColor: isDark ? '#334155' : '#cbd5e1',
        },
        activeTabText: {
            color: 'white',
        },
        inactiveTabText: {
            color: isDark ? '#cbd5e1' : '#475569',
        },
        selector: {
            backgroundColor: isDark ? '#1e293b' : 'white',
            borderColor: isDark ? '#334155' : '#cbd5e1',
        }
    };

    if (loading) {
        return (
            <View style={[styles.centerContainer, themeStyles.container]}>
                <ActivityIndicator size="large" color="#366c6b" />
                <Text style={[styles.loadingText, themeStyles.subText]}>Loading reports...</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, themeStyles.container]}>
            <ScrollView
                contentContainerStyle={{ paddingBottom: 40 }}
                refreshControl={<RefreshControl refreshing={dataLoading} onRefresh={fetchReportData} tintColor="#366c6b" />}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={[styles.title, themeStyles.text]}>Financial Reports</Text>
                        <Text style={[styles.subtitle, themeStyles.subText]}>Track your financial performance</Text>
                    </View>
                    <TouchableOpacity
                        onPress={handleRecalculate}
                        disabled={recalculateLoading}
                        style={styles.refreshButton}
                    >
                        <Ionicons name="refresh-circle" size={32} color={recalculateLoading ? '#94a3b8' : '#366c6b'} />
                    </TouchableOpacity>
                </View>

                {/* Toggles */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[
                            styles.tab,
                            reportType === 'monthly' ? themeStyles.activeTab : themeStyles.inactiveTab,
                            reportType === 'monthly' && styles.activeTabShadow
                        ]}
                        onPress={() => setReportType('monthly')}
                    >
                        <Ionicons
                            name="calendar"
                            size={18}
                            color={reportType === 'monthly' ? 'white' : (isDark ? '#cbd5e1' : '#475569')}
                        />
                        <Text style={[styles.tabText, reportType === 'monthly' ? themeStyles.activeTabText : themeStyles.inactiveTabText]}>
                            Monthly
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.tab,
                            reportType === 'yearly' ? themeStyles.activeTab : themeStyles.inactiveTab,
                            reportType === 'yearly' && styles.activeTabShadow
                        ]}
                        onPress={() => setReportType('yearly')}
                    >
                        <Ionicons
                            name="stats-chart"
                            size={18}
                            color={reportType === 'yearly' ? 'white' : (isDark ? '#cbd5e1' : '#475569')}
                        />
                        <Text style={[styles.tabText, reportType === 'yearly' ? themeStyles.activeTabText : themeStyles.inactiveTabText]}>
                            Yearly
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Selector */}
                <TouchableOpacity
                    style={[styles.selector, themeStyles.selector]}
                    onPress={() => reportType === 'monthly' ? setShowMonthSelector(true) : setShowYearSelector(true)}
                >
                    <View style={styles.selectorLeft}>
                        <Ionicons
                            name={reportType === 'monthly' ? "calendar-outline" : "time-outline"}
                            size={20}
                            color="#366c6b"
                        />
                        <Text style={[styles.selectorText, themeStyles.text]}>
                            {reportType === 'monthly'
                                ? (selectedMonth ? monthOptions.find(o => o.value === selectedMonth)?.label : 'Select Month')
                                : (selectedYear || 'Select Year')
                            }
                        </Text>
                    </View>
                    <Ionicons name="chevron-down" size={20} color={isDark ? '#cbd5e1' : '#475569'} />
                </TouchableOpacity>

                {/* Content */}
                {dataLoading ? (
                    <View style={{ padding: 60, alignItems: 'center' }}>
                        <ActivityIndicator size="large" color="#366c6b" />
                        <Text style={[styles.loadingText, themeStyles.subText]}>Loading data...</Text>
                    </View>
                ) : error ? (
                    <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle" size={48} color="#ef4444" />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                ) : !reportData ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="document-text-outline" size={64} color={isDark ? '#475569' : '#cbd5e1'} />
                        <Text style={[styles.emptyText, themeStyles.subText]}>Select a period to view reports</Text>
                    </View>
                ) : (
                    <View style={styles.content}>
                        {/* Summary Cards */}
                        <View style={styles.summaryRow}>
                            <View style={[styles.summaryCard, themeStyles.card]}>
                                <LinearGradient
                                    colors={['#ef4444', '#dc2626']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.summaryGradient}
                                >
                                    <Ionicons name="trending-down" size={24} color="white" />
                                    <View style={styles.summaryContent}>
                                        <Text style={styles.summaryLabel}>Total Expenses</Text>
                                        <Text style={styles.summaryValue}>
                                            {formatCurrency(reportData.total_withdraw || 0)}
                                        </Text>
                                    </View>
                                </LinearGradient>
                            </View>
                            <View style={[styles.summaryCard, themeStyles.card]}>
                                <LinearGradient
                                    colors={['#22c55e', '#16a34a']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.summaryGradient}
                                >
                                    <Ionicons name="trending-up" size={24} color="white" />
                                    <View style={styles.summaryContent}>
                                        <Text style={styles.summaryLabel}>Total Income</Text>
                                        <Text style={styles.summaryValue}>
                                            {formatCurrency(reportData.total_deposit || 0)}
                                        </Text>
                                    </View>
                                </LinearGradient>
                            </View>
                        </View>

                        {/* Net Balance Card */}
                        <View style={[styles.netBalanceCard, themeStyles.card]}>
                            <LinearGradient
                                colors={isDark ? ['#1e3a8a', '#1e40af'] : ['#3b82f6', '#2563eb']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.netBalanceGradient}
                            >
                                <Text style={styles.netBalanceLabel}>Net Balance</Text>
                                <Text style={styles.netBalanceValue}>
                                    {formatCurrency((reportData.total_deposit || 0) - (reportData.total_withdraw || 0))}
                                </Text>
                            </LinearGradient>
                        </View>

                        {/* Breakdown Sections */}
                        <View style={[styles.section, themeStyles.card]}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="wallet" size={22} color="#ef4444" />
                                <Text style={[styles.sectionTitle, themeStyles.text]}>Expense Breakdown</Text>
                            </View>
                            {(!reportData.user_withdraw_on_range || reportData.user_withdraw_on_range.length === 0) ? (
                                <View style={styles.noDataContainer}>
                                    <Ionicons name="information-circle-outline" size={32} color={isDark ? '#475569' : '#cbd5e1'} />
                                    <Text style={[styles.noDataText, themeStyles.subText]}>No expense data available</Text>
                                </View>
                            ) : (
                                reportData.user_withdraw_on_range.map((item: any, idx: number) => (
                                    <View key={idx} style={styles.breakdownItem}>
                                        <View style={styles.breakdownHeader}>
                                            <Text style={[styles.categoryName, themeStyles.text]}>{item.category}</Text>
                                            <Text style={[styles.categoryValue, { color: '#ef4444' }]}>{item.percentage}%</Text>
                                        </View>
                                        <ProgressBar
                                            percentage={parseFloat(item.percentage)}
                                            color={`hsl(${0 + (idx * 25)}, 70%, 50%)`}
                                        />
                                        <Text style={[styles.categoryAmount, themeStyles.subText]}>
                                            {formatCurrency(item.converted_amount)}
                                        </Text>
                                    </View>
                                ))
                            )}
                        </View>

                        <View style={[styles.section, themeStyles.card]}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="cash" size={22} color="#22c55e" />
                                <Text style={[styles.sectionTitle, themeStyles.text]}>Income Breakdown</Text>
                            </View>
                            {(!reportData.user_deposit_on_range || reportData.user_deposit_on_range.length === 0) ? (
                                <View style={styles.noDataContainer}>
                                    <Ionicons name="information-circle-outline" size={32} color={isDark ? '#475569' : '#cbd5e1'} />
                                    <Text style={[styles.noDataText, themeStyles.subText]}>No income data available</Text>
                                </View>
                            ) : (
                                reportData.user_deposit_on_range.map((item: any, idx: number) => (
                                    <View key={idx} style={styles.breakdownItem}>
                                        <View style={styles.breakdownHeader}>
                                            <Text style={[styles.categoryName, themeStyles.text]}>{item.category}</Text>
                                            <Text style={[styles.categoryValue, { color: '#22c55e' }]}>{item.percentage}%</Text>
                                        </View>
                                        <ProgressBar
                                            percentage={parseFloat(item.percentage)}
                                            color={`hsl(${120 + (idx * 25)}, 65%, 45%)`}
                                        />
                                        <Text style={[styles.categoryAmount, themeStyles.subText]}>
                                            {formatCurrency(item.converted_amount)}
                                        </Text>
                                    </View>
                                ))
                            )}
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Modals */}
            <FilterModal
                visible={showMonthSelector}
                options={monthOptions}
                onSelect={(val: string) => {
                    setSelectedMonth(val);
                    setShowMonthSelector(false);
                }}
                onClose={() => setShowMonthSelector(false)}
                title="Select Month"
                selectedValue={selectedMonth}
            />
            <FilterModal
                visible={showYearSelector}
                options={yearOptions}
                onSelect={(val: string) => {
                    setSelectedYear(val);
                    setShowYearSelector(false);
                }}
                onClose={() => setShowYearSelector(false)}
                title="Select Year"
                selectedValue={selectedYear}
            />
        </View>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        marginTop: 2,
    },
    refreshButton: {
        padding: 4,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
    },
    tabContainer: {
        flexDirection: 'row',
        marginHorizontal: 20,
        marginBottom: 20,
        gap: 12,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
        borderWidth: 1,
        gap: 8,
    },
    activeTabShadow: {
        shadowColor: '#366c6b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    tabText: {
        fontWeight: '600',
        fontSize: 15,
    },
    selector: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 18,
        marginHorizontal: 20,
        marginBottom: 24,
        borderRadius: 16,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    selectorLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    selectorText: {
        fontSize: 16,
        fontWeight: '600',
    },
    content: {
        paddingHorizontal: 20,
        gap: 20,
    },
    summaryRow: {
        flexDirection: 'row',
        gap: 12,
    },
    summaryCard: {
        flex: 1,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    summaryGradient: {
        padding: 20,
        gap: 12,
    },
    summaryContent: {
        gap: 4,
    },
    summaryLabel: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.9)',
        fontWeight: '500',
    },
    summaryValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },
    netBalanceCard: {
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
    },
    netBalanceGradient: {
        padding: 24,
        alignItems: 'center',
        gap: 8,
    },
    netBalanceLabel: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    netBalanceValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: 'white',
    },
    section: {
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    breakdownItem: {
        marginBottom: 16,
    },
    breakdownHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
        alignItems: 'center',
    },
    categoryName: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
    },
    categoryValue: {
        fontSize: 15,
        fontWeight: 'bold',
    },
    progressContainer: {
        height: 10,
        backgroundColor: '#e2e8f0',
        borderRadius: 10,
        overflow: 'hidden',
        marginBottom: 6,
    },
    progressBar: {
        height: '100%',
        borderRadius: 10,
    },
    categoryAmount: {
        fontSize: 13,
        textAlign: 'right',
    },
    errorContainer: {
        padding: 40,
        alignItems: 'center',
        gap: 16,
    },
    errorText: {
        color: '#ef4444',
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '500',
    },
    emptyContainer: {
        padding: 60,
        alignItems: 'center',
        gap: 16,
    },
    emptyText: {
        textAlign: 'center',
        fontSize: 16,
    },
    noDataContainer: {
        paddingVertical: 24,
        alignItems: 'center',
        gap: 12,
    },
    noDataText: {
        fontStyle: 'italic',
        fontSize: 14,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '70%',
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
    },
    optionItem: {
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderRadius: 8,
        marginBottom: 4,
    },
    optionText: {
        fontSize: 16,
    }
});

