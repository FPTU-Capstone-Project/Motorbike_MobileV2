import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Animatable from 'react-native-animatable';

import ModernButton from '../../components/ModernButton.jsx';
import GlassHeader, { SoftBackHeader } from '../../components/ui/GlassHeader.jsx';
import AppBackground from '../../components/layout/AppBackground.jsx';
import reportService from '../../services/reportService';
import { ApiError } from '../../services/api';
import { colors, typography, spacing } from '../../theme/designTokens';

const ReportScreen = ({ navigation }) => {
  const [reportType, setReportType] = useState(null);
  const [priority, setPriority] = useState('MEDIUM');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const reportTypes = [
    { value: 'SAFETY', label: 'An toàn', icon: 'security', color: '#EF4444' },
    { value: 'BEHAVIOR', label: 'Hành vi', icon: 'people', color: '#F59E0B' },
    { value: 'RIDE_EXPERIENCE', label: 'Trải nghiệm chuyến đi', icon: 'star', color: '#3B82F6' },
    { value: 'PAYMENT', label: 'Thanh toán', icon: 'payment', color: '#10B981' },
    { value: 'ROUTE', label: 'Tuyến đường', icon: 'route', color: '#8B5CF6' },
    { value: 'TECHNICAL', label: 'Kỹ thuật', icon: 'build', color: '#6366F1' },
    { value: 'OTHER', label: 'Khác', icon: 'more-horiz', color: '#6B7280' },
  ];

  const priorities = [
    { value: 'LOW', label: 'Thấp', color: '#6B7280' },
    { value: 'MEDIUM', label: 'Trung bình', color: '#F59E0B' },
    { value: 'HIGH', label: 'Cao', color: '#EF4444' },
    { value: 'CRITICAL', label: 'Khẩn cấp', color: '#DC2626' },
  ];

  const isFormValid = () => {
    return reportType && description.trim().length >= 10 && description.trim().length <= 2000;
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      if (!reportType) {
        Alert.alert('Lỗi', 'Vui lòng chọn loại báo cáo');
      } else if (description.trim().length < 10) {
        Alert.alert('Lỗi', 'Mô tả phải có ít nhất 10 ký tự');
      } else if (description.trim().length > 2000) {
        Alert.alert('Lỗi', 'Mô tả không được vượt quá 2000 ký tự');
      }
      return;
    }

    try {
      setLoading(true);
      const result = await reportService.submitReport(
        reportType,
        description.trim(),
        priority
      );

      if (result.success) {
        Alert.alert(
          'Thành công',
          'Báo cáo của bạn đã được gửi đến quản trị viên. Chúng tôi sẽ xem xét và phản hồi sớm nhất có thể.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Reset form
                setReportType(null);
                setPriority('MEDIUM');
                setDescription('');
                navigation.goBack();
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Report submission error:', error);
      let errorMessage = 'Không thể gửi báo cáo. Vui lòng thử lại sau.';

      if (error instanceof ApiError) {
        switch (error.status) {
          case 400:
            errorMessage = error.message || 'Thông tin không hợp lệ';
            break;
          case 401:
            errorMessage = 'Phiên đăng nhập đã hết hạn';
            break;
          case 403:
            errorMessage = 'Bạn không có quyền gửi báo cáo';
            break;
          default:
            errorMessage = error.message || errorMessage;
        }
      }

      Alert.alert('Lỗi', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <SafeAreaView style={styles.safe}>
          <SoftBackHeader
            title="Gửi báo cáo"
            subtitle="Báo cáo vấn đề cho quản trị viên"
            onBackPress={() => navigation.goBack()}
          />

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <Animatable.View animation="fadeInUp" duration={300}>
              {/* Report Type Selection */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Loại báo cáo *</Text>
                <View style={styles.typeGrid}>
                  {reportTypes.map((type) => (
                    <TouchableOpacity
                      key={type.value}
                      style={[
                        styles.typeCard,
                        reportType === type.value && styles.typeCardActive,
                        reportType === type.value && { borderColor: type.color },
                      ]}
                      onPress={() => setReportType(type.value)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.typeIconContainer,
                          { backgroundColor: reportType === type.value ? type.color + '15' : '#F3F4F6' },
                        ]}
                      >
                        <Icon
                          name={type.icon}
                          size={24}
                          color={reportType === type.value ? type.color : colors.textSecondary}
                        />
                      </View>
                      <Text
                        style={[
                          styles.typeLabel,
                          reportType === type.value && { color: type.color, fontFamily: 'Inter_600SemiBold' },
                        ]}
                      >
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Priority Selection */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Mức độ ưu tiên</Text>
                <View style={styles.priorityContainer}>
                  {priorities.map((p) => (
                    <TouchableOpacity
                      key={p.value}
                      style={[
                        styles.priorityButton,
                        priority === p.value && styles.priorityButtonActive,
                        priority === p.value && { borderColor: p.color, backgroundColor: p.color + '15' },
                      ]}
                      onPress={() => setPriority(p.value)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.priorityText,
                          priority === p.value && { color: p.color, fontFamily: 'Inter_600SemiBold' },
                        ]}
                      >
                        {p.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Description Input */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Mô tả chi tiết *</Text>
                <TextInput
                  style={styles.descriptionInput}
                  placeholder="Mô tả chi tiết vấn đề bạn gặp phải (tối thiểu 10 ký tự)..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={8}
                  value={description}
                  onChangeText={setDescription}
                  maxLength={2000}
                  textAlignVertical="top"
                />
                <View style={styles.charCount}>
                  <Text style={styles.charCountText}>
                    {description.length}/2000 ký tự
                  </Text>
                </View>
                {description.length > 0 && description.length < 10 && (
                  <Text style={styles.helperText}>
                    Mô tả phải có ít nhất 10 ký tự
                  </Text>
                )}
              </View>

              {/* Submit Button */}
              <ModernButton
                title={loading ? 'Đang gửi...' : 'Gửi báo cáo'}
                onPress={handleSubmit}
                disabled={loading || !isFormValid()}
                style={styles.submitButton}
                icon={loading ? null : 'send'}
              />

              {/* Info Note */}
              <View style={styles.infoCard}>
                <Icon name="info" size={20} color={colors.accent} />
                <Text style={styles.infoText}>
                  Báo cáo của bạn sẽ được gửi trực tiếp đến quản trị viên. Chúng tôi sẽ xem xét và phản hồi trong thời gian sớm nhất.
                </Text>
              </View>
            </Animatable.View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </AppBackground>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: typography.subheading,
    fontFamily: 'Inter_600SemiBold',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(148,163,184,0.25)',
  },
  typeCardActive: {
    borderWidth: 2,
  },
  typeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: typography.small,
    fontFamily: 'Inter_500Medium',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  priorityButton: {
    flex: 1,
    minWidth: '22%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(148,163,184,0.3)',
    alignItems: 'center',
  },
  priorityButtonActive: {
    borderWidth: 2,
  },
  priorityText: {
    fontSize: typography.small,
    fontFamily: 'Inter_500Medium',
    color: colors.textSecondary,
  },
  descriptionInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.25)',
    fontFamily: 'Inter_400Regular',
    color: colors.textPrimary,
    fontSize: 15,
    minHeight: 120,
  },
  charCount: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  charCountText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
  },
  helperText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#EF4444',
    marginTop: 8,
    marginLeft: 4,
  },
  submitButton: {
    marginTop: 8,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#EEF7FF',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    gap: 12,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: typography.small,
    fontFamily: 'Inter_400Regular',
    color: colors.textSecondary,
    lineHeight: 20,
  },
});

export default ReportScreen;






