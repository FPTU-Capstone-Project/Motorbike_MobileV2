import React, { useState, useEffect } from 'react';
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
import ModernButton from '../../components/ModernButton.jsx';
import vehicleService from '../../services/vehicleService';
import authService from '../../services/authService';
import { colors } from '../../theme/designTokens';

const AddVehicleScreen = ({ navigation }) => {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState({ type: null });
  const [formData, setFormData] = useState({
    plateNumber: '',
    model: '',
    color: '',
    year: '',
    capacity: '',
    fuelType: 'gasoline',
    insuranceExpiry: null,
    lastMaintenance: null,
  });

  useEffect(() => {
    checkExistingVehicle();
  }, []);

  const checkExistingVehicle = async () => {
    try {
      setLoading(true);
      const vehiclesData = await vehicleService.getDriverVehicles({ page: 0, size: 1 });
      
      // Extract vehicles from response
      let vehicles = [];
      if (vehiclesData) {
        if (Array.isArray(vehiclesData)) {
          vehicles = vehiclesData;
        } else if (vehiclesData.content && Array.isArray(vehiclesData.content)) {
          vehicles = vehiclesData.content;
        } else if (vehiclesData.data && Array.isArray(vehiclesData.data)) {
          vehicles = vehiclesData.data;
        }
      }

      if (vehicles.length > 0) {
        // Driver already has a vehicle, redirect to edit screen directly
        const existingVehicle = vehicleService.formatVehicle(vehicles[0]);
        navigation.replace('EditVehicle', { vehicleId: existingVehicle.id });
      }
    } catch (error) {
      console.warn('Error checking existing vehicle:', error);
      // Continue if error (might be 403, 404, etc.)
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
    return new Date(date).toLocaleDateString('vi-VN', {
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
      Alert.alert('Lỗi', 'Vui lòng nhập năm sản xuất hợp lệ (từ 1990 trở lên)');
      return;
    }
    if (!formData.capacity || parseInt(formData.capacity) < 1) {
      Alert.alert('Lỗi', 'Vui lòng nhập số chỗ ngồi hợp lệ (từ 1 trở lên)');
      return;
    }

    // Validate plate number format (Vietnamese format)
    const plateRegex = /^[0-9]{2}[A-Z]{1,2}-[0-9]{3,5}$/;
    if (!plateRegex.test(formData.plateNumber.trim())) {
      Alert.alert('Lỗi', 'Biển số xe không đúng định dạng (VD: 29A-12345)');
      return;
    }

    setSaving(true);
    try {
      // Get current user to get driver ID
      const currentUser = await authService.getCurrentUserProfile();
      const driverId = currentUser?.driver_profile?.driver_id;
      
      if (!driverId) {
        Alert.alert('Lỗi', 'Không tìm thấy thông tin tài xế');
        return;
      }

      const payload = {
        driverId: driverId,
        plateNumber: formData.plateNumber.trim(),
        model: formData.model.trim(),
        color: formData.color.trim(),
        year: parseInt(formData.year),
        capacity: parseInt(formData.capacity),
        // Backend now has resolveFuelType() converter, so lowercase is OK (matches DTO validation)
        fuelType: formData.fuelType.toLowerCase(), // Lowercase: "gasoline" or "electric"
        status: 'pending', // Lowercase: "pending" (backend converts via resolveVehicleStatus())
      };

      // Add dates if they exist
      if (formData.insuranceExpiry) {
        payload.insuranceExpiry = formData.insuranceExpiry.toISOString();
      }
      if (formData.lastMaintenance) {
        payload.lastMaintenance = formData.lastMaintenance.toISOString();
      }

      await vehicleService.createVehicle(payload);
      Alert.alert('Thành công', 'Phương tiện đã được thêm thành công. Vui lòng chờ xác minh.', [
        { 
          text: 'OK', 
          onPress: () => {
            // Go back and parent screen will refresh via useFocusEffect
            navigation.goBack();
          }
        },
      ]);
    } catch (error) {
      console.error('Error creating vehicle:', error);
      let message = 'Không thể thêm phương tiện';
      if (error.message) {
        message = error.message;
      }
      Alert.alert('Lỗi', message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe}>
        <View style={styles.headerContainer}>
          <SoftBackHeader
            title="Thêm phương tiện"
            subtitle="Thêm thông tin xe mới của bạn"
            onBackPress={() => navigation.goBack()}
            rightIcon="check"
            rightIconColor={colors.accent}
            rightLoading={saving}
            onRightPress={saveVehicle}
          />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={styles.loadingText}>Đang kiểm tra...</Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
          <CleanCard contentStyle={styles.formCard}>
            <Text style={styles.sectionHeading}>Thông tin cơ bản *</Text>
            <Text style={styles.requiredNote}>Các trường có dấu * là bắt buộc</Text>
            
            <InputRow
              icon="hash"
              placeholder="Biển số xe * (VD: 29A-12345)"
              value={formData.plateNumber}
              onChangeText={(v) => updateFormData('plateNumber', v.toUpperCase())}
            />
            
            <InputRow
              icon="truck"
              placeholder="Mẫu xe * (VD: Honda Wave Alpha)"
              value={formData.model}
              onChangeText={(v) => updateFormData('model', v)}
            />
            
            <InputRow
              icon="droplet"
              placeholder="Màu sắc *"
              value={formData.color}
              onChangeText={(v) => updateFormData('color', v)}
            />
            
            <InputRow
              icon="calendar"
              placeholder="Năm sản xuất *"
              value={formData.year}
              onChangeText={(v) => updateFormData('year', v.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
            />
            
            <InputRow
              icon="users"
              placeholder="Số chỗ ngồi *"
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
          </CleanCard>

          <CleanCard contentStyle={styles.formCard}>
            <Text style={styles.sectionHeading}>Bảo hiểm & Bảo dưỡng (Tùy chọn)</Text>
            
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

          <View style={styles.infoBox}>
            <Feather name="info" size={20} color={colors.accent} />
            <Text style={styles.infoText}>
              Sau khi thêm phương tiện, bạn cần chờ quản trị viên xác minh trước khi có thể sử dụng.
            </Text>
          </View>

          <ModernButton
            title={saving ? 'Đang thêm...' : 'Thêm phương tiện'}
            onPress={saveVehicle}
            disabled={saving}
          />
          </ScrollView>
        )}

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
  requiredNote: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 12,
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
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 18,
  },
});

export default AddVehicleScreen;

