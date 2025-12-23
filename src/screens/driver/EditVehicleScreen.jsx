import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import DateTimePicker from '@react-native-community/datetimepicker';

import AppBackground from '../../components/layout/AppBackground.jsx';
import CleanCard from '../../components/ui/CleanCard.jsx';
import { SoftBackHeader } from '../../components/ui/GlassHeader.jsx';
import vehicleService from '../../services/vehicleService';
import { colors } from '../../theme/designTokens';

const EditVehicleScreen = ({ navigation, route }) => {
  const vehicleId = route?.params?.vehicleId;
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState({ type: null });
  const [formData, setFormData] = useState({
    plateNumber: '',
    model: '',
    color: '',
    year: '',
    capacity: '',
    fuelType: 'gasoline',
    status: 'active',
    insuranceExpiry: null,
    lastMaintenance: null,
  });

  useEffect(() => {
    if (vehicleId) {
      loadVehicle();
    } else {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin phương tiện', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }
  }, [vehicleId]);

  const loadVehicle = async () => {
    try {
      setLoading(true);
      const vehicleData = await vehicleService.getVehicleById(vehicleId);
      const formattedVehicle = vehicleService.formatVehicle(vehicleData);
      setVehicle(formattedVehicle);
      
      // Parse dates if they exist
      let insuranceExpiry = null;
      let lastMaintenance = null;
      
      if (formattedVehicle.insuranceExpiry) {
        insuranceExpiry = new Date(formattedVehicle.insuranceExpiry);
      }
      if (formattedVehicle.lastMaintenance) {
        lastMaintenance = new Date(formattedVehicle.lastMaintenance);
      }

      setFormData({
        plateNumber: formattedVehicle.plateNumber || '',
        model: formattedVehicle.model || '',
        color: formattedVehicle.color || '',
        year: formattedVehicle.year ? formattedVehicle.year.toString() : '',
        capacity: formattedVehicle.capacity ? formattedVehicle.capacity.toString() : '',
        fuelType: formattedVehicle.fuelType?.toLowerCase() || 'gasoline',
        status: formattedVehicle.status || 'active',
        insuranceExpiry,
        lastMaintenance,
      });
    } catch (error) {
      console.error('Error loading vehicle:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin phương tiện', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (event, selectedDate, type) => {
    if (Platform.OS === 'android') {
      setShowDatePicker({ type: null });
      if (event.type === 'set' && selectedDate) {
        updateFormData(type, selectedDate);
      }
    } else {
      // iOS
      if (event.type === 'set' && selectedDate) {
        updateFormData(type, selectedDate);
      }
      setShowDatePicker({ type: null });
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Chưa cập nhật';
    const { formatDate: formatD } = require('../../utils/dateUtils');
    return formatD(date, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const saveVehicle = async () => {
    // Validation
    if (!formData.plateNumber.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập biển số xe');
      return;
    }
    if (!formData.model.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập mẫu xe');
      return;
    }
    if (!formData.color.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập màu xe');
      return;
    }
    if (!formData.year || parseInt(formData.year) < 1990) {
      Alert.alert('Lỗi', 'Vui lòng nhập năm sản xuất hợp lệ');
      return;
    }
    if (!formData.capacity || parseInt(formData.capacity) < 1) {
      Alert.alert('Lỗi', 'Vui lòng nhập số chỗ ngồi hợp lệ');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        plateNumber: formData.plateNumber.trim(),
        model: formData.model.trim(),
        color: formData.color.trim(),
        year: parseInt(formData.year),
        capacity: parseInt(formData.capacity),
        // Backend now has resolveFuelType() converter, so lowercase is OK (matches DTO validation)
        fuelType: formData.fuelType.toLowerCase(), // Lowercase: "gasoline" or "electric"
        status: formData.status.toLowerCase(), // Lowercase: "active", "inactive", "maintenance", "pending"
      };

      // Add dates if they exist
      if (formData.insuranceExpiry) {
        payload.insuranceExpiry = formData.insuranceExpiry.toISOString();
      }
      if (formData.lastMaintenance) {
        payload.lastMaintenance = formData.lastMaintenance.toISOString();
      }

      await vehicleService.updateVehicle(vehicleId, payload);
      Alert.alert('Thành công', 'Thông tin phương tiện đã được cập nhật.', [
        { 
          text: 'OK', 
          onPress: () => {
            // Go back and parent screen will refresh via useFocusEffect
            navigation.goBack();
          }
        },
      ]);
    } catch (error) {
      console.error('Error updating vehicle:', error);
      let message = 'Không thể cập nhật thông tin phương tiện';
      if (error.message) {
        message = error.message;
      }
      Alert.alert('Lỗi', message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppBackground>
        <SafeAreaView style={styles.safe}>
          <View style={styles.headerContainer}>
            <SoftBackHeader
              title="Cập nhật phương tiện"
              onBackPress={() => navigation.goBack()}
            />
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={styles.loadingText}>Đang tải thông tin...</Text>
          </View>
        </SafeAreaView>
      </AppBackground>
    );
  }

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe}>
        <View style={styles.headerContainer}>
          <SoftBackHeader
            title="Cập nhật phương tiện"
            subtitle="Chỉnh sửa thông tin xe của bạn"
            onBackPress={() => navigation.goBack()}
            rightIcon="check"
            rightIconColor={colors.accent}
            rightLoading={saving}
            onRightPress={saveVehicle}
          />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <CleanCard contentStyle={styles.formCard}>
            <Text style={styles.sectionHeading}>Thông tin cơ bản</Text>
            
            <InputRow
              icon="hash"
              placeholder="Biển số xe (VD: 29A-12345)"
              value={formData.plateNumber}
              onChangeText={(v) => updateFormData('plateNumber', v.toUpperCase())}
            />
            
            <InputRow
              icon="truck"
              placeholder="Mẫu xe (VD: Honda Wave Alpha)"
              value={formData.model}
              onChangeText={(v) => updateFormData('model', v)}
            />
            
            <InputRow
              icon="droplet"
              placeholder="Màu sắc"
              value={formData.color}
              onChangeText={(v) => updateFormData('color', v)}
            />
            
            <InputRow
              icon="calendar"
              placeholder="Năm sản xuất"
              value={formData.year}
              onChangeText={(v) => updateFormData('year', v.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
            />
            
            <InputRow
              icon="users"
              placeholder="Số chỗ ngồi"
              value={formData.capacity}
              onChangeText={(v) => updateFormData('capacity', v.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
            />
          </CleanCard>

          <CleanCard contentStyle={styles.formCard}>
            <Text style={styles.sectionHeading}>Thông tin kỹ thuật</Text>
            
            <View style={styles.selectRow}>
              <Feather name="zap" size={18} color="#8E8E93" style={{ marginRight: 12 }} />
              <Text style={styles.selectLabel}>Loại nhiên liệu:</Text>
              <View style={styles.radioGroup}>
                <TouchableOpacity
                  style={[
                    styles.radioOption,
                    formData.fuelType === 'gasoline' && styles.radioOptionActive,
                  ]}
                  onPress={() => updateFormData('fuelType', 'gasoline')}
                >
                  <Text
                    style={[
                      styles.radioText,
                      formData.fuelType === 'gasoline' && styles.radioTextActive,
                    ]}
                  >
                    Xăng
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.radioOption,
                    formData.fuelType === 'electric' && styles.radioOptionActive,
                  ]}
                  onPress={() => updateFormData('fuelType', 'electric')}
                >
                  <Text
                    style={[
                      styles.radioText,
                      formData.fuelType === 'electric' && styles.radioTextActive,
                    ]}
                  >
                    Điện
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.selectRow}>
              <Feather name="info" size={18} color="#8E8E93" style={{ marginRight: 12 }} />
              <Text style={styles.selectLabel}>Trạng thái:</Text>
              <View style={styles.radioGroup}>
                <TouchableOpacity
                  style={[
                    styles.radioOption,
                    formData.status === 'active' && styles.radioOptionActive,
                  ]}
                  onPress={() => updateFormData('status', 'active')}
                >
                  <Text
                    style={[
                      styles.radioText,
                      formData.status === 'active' && styles.radioTextActive,
                    ]}
                  >
                    Hoạt động
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.radioOption,
                    formData.status === 'maintenance' && styles.radioOptionActive,
                  ]}
                  onPress={() => updateFormData('status', 'maintenance')}
                >
                  <Text
                    style={[
                      styles.radioText,
                      formData.status === 'maintenance' && styles.radioTextActive,
                    ]}
                  >
                    Bảo dưỡng
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </CleanCard>

          <CleanCard contentStyle={styles.formCard}>
            <Text style={styles.sectionHeading}>Bảo hiểm & Bảo dưỡng</Text>
            
            <TouchableOpacity
              style={styles.dateRow}
              onPress={() => setShowDatePicker({ type: 'insuranceExpiry' })}
            >
              <Feather name="calendar" size={18} color="#8E8E93" style={{ marginRight: 12 }} />
              <View style={styles.dateContent}>
                <Text style={styles.dateLabel}>Ngày hết hạn bảo hiểm:</Text>
                <Text style={styles.dateValue}>
                  {formatDate(formData.insuranceExpiry)}
                </Text>
              </View>
              <Feather name="chevron-right" size={20} color="#8E8E93" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dateRow}
              onPress={() => setShowDatePicker({ type: 'lastMaintenance' })}
            >
              <Feather name="tool" size={18} color="#8E8E93" style={{ marginRight: 12 }} />
              <View style={styles.dateContent}>
                <Text style={styles.dateLabel}>Lần bảo dưỡng cuối:</Text>
                <Text style={styles.dateValue}>
                  {formatDate(formData.lastMaintenance)}
                </Text>
              </View>
              <Feather name="chevron-right" size={20} color="#8E8E93" />
            </TouchableOpacity>
          </CleanCard>
        </ScrollView>

        {showDatePicker.type && (
          <DateTimePicker
            value={
              formData[showDatePicker.type] || new Date()
            }
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, date) => handleDateChange(event, date, showDatePicker.type)}
          />
        )}
      </SafeAreaView>
    </AppBackground>
  );
};

const InputRow = ({ icon, editable = true, style, ...rest }) => {
  return (
    <View style={[styles.inputRow, style]}>
      <Feather name={icon} size={18} color="#8E8E93" style={{ marginRight: 12 }} />
      <TextInput
        style={[styles.input, !editable && styles.inputDisabled]}
        placeholderTextColor="#B0B0B3"
        editable={editable}
        {...rest}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  headerContainer: {
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  scrollContent: {
    paddingTop: 0,
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 24,
  },
  formCard: {
    gap: 14,
    paddingVertical: 22,
    paddingHorizontal: 20,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A0A0A',
    marginBottom: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E6E6EA',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  inputDisabled: {
    color: '#9CA3AF',
  },
  selectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  selectLabel: {
    fontSize: 15,
    color: '#111827',
    marginRight: 12,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
  },
  radioOption: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E6E6EA',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  radioOptionActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  radioText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  radioTextActive: {
    color: '#FFFFFF',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E6E6EA',
    marginBottom: 12,
  },
  dateContent: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },
});

export default EditVehicleScreen;

