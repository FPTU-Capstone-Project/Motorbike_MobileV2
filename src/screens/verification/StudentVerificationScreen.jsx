import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Animatable from 'react-native-animatable';

import ModernButton from '../../components/ModernButton.jsx';
import verificationService from '../../services/verificationService';
import AppBackground from '../../components/layout/AppBackground.jsx';
import CleanCard from '../../components/ui/CleanCard.jsx';
import { SoftBackHeader } from '../../components/ui/GlassHeader.jsx';
import { colors, gradients, spacing, radii } from '../../theme/designTokens';

const StudentVerificationScreen = ({ navigation }) => {
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [currentSide, setCurrentSide] = useState('front'); // 'front' or 'back'
  const [currentVerification, setCurrentVerification] = useState(null);

  // Load current verification status
  useEffect(() => {
    loadCurrentVerification();
  }, []);

  const loadCurrentVerification = async () => {
    try {
      const verification = await verificationService.getCurrentStudentVerification();
      setCurrentVerification(verification);
      
      // If user already has pending verification, show alert and go back
      if (verification && verification.status?.toLowerCase() === 'pending') {
        Alert.alert(
          'Đang chờ duyệt',
          'Bạn đã gửi yêu cầu xác minh và đang chờ admin duyệt. Vui lòng chờ kết quả.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
        return;
      }
      
      // If user already verified, show alert and go back
      if (verification && (verification.status?.toLowerCase() === 'verified' || verification.status?.toLowerCase() === 'approved' || verification.status?.toLowerCase() === 'active')) {
        Alert.alert(
          'Đã xác minh',
          'Tài khoản của bạn đã được xác minh.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
        return;
      }

      // If user's verification was rejected, just log it (don't show alert again)
      // The alert was already shown in ProfileSwitchScreen
      if (verification && verification.status?.toLowerCase() === 'rejected') {
        console.log('User has rejected verification, allowing resubmission');
        // Continue with the form to allow resubmission
        return;
      }
    } catch (error) {
      console.log('No current verification found or error:', error);
      setCurrentVerification(null);
    }
  };

  // Convert and compress image to JPEG format
  const compressImage = async (imageUri) => {
    try {
      console.log('Converting and compressing image:', imageUri);
      
      // Convert to JPEG and resize to reduce file size
      const manipResult = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          { resize: { width: 1200 } }, // Resize to reasonable size
        ],
        { 
          compress: 0.7, // Good quality (70%)
          format: ImageManipulator.SaveFormat.JPEG, // Force JPEG format
          base64: false // Don't include base64 to reduce memory usage
        }
      );
      
      console.log('Image converted to JPEG:', {
        uri: manipResult.uri,
        width: manipResult.width,
        height: manipResult.height,
        fileSize: manipResult.fileSize
      });
      
      // If still too large, compress more aggressively
      if (manipResult.fileSize && manipResult.fileSize > 5 * 1024 * 1024) { // 5MB limit
        console.log('Still too large, compressing more aggressively...');
        const secondPass = await ImageManipulator.manipulateAsync(
          manipResult.uri,
          [{ resize: { width: 800 } }],
          { 
            compress: 0.5, // Lower quality (50%)
            format: ImageManipulator.SaveFormat.JPEG,
            base64: false
          }
        );
        console.log('Second compression result:', {
          uri: secondPass.uri,
          fileSize: secondPass.fileSize
        });
        return secondPass;
      }
      
      return manipResult;
    } catch (error) {
      console.error('Error converting image to JPEG:', error);
      throw new Error('Không thể xử lý ảnh. Vui lòng chọn ảnh khác.');
    }
  };

  const pickImage = async (side) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Lỗi', 'Cần cấp quyền truy cập thư viện ảnh');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], // Only images
        allowsEditing: false,
        quality: 1, // Use full quality first, we'll convert to JPEG later
        exif: false, // Don't include EXIF data to reduce file size
      });

      if (!result.canceled && result.assets[0]) {
        const originalImage = result.assets[0];
        console.log('Original image info:', {
          uri: originalImage.uri,
          type: originalImage.type,
          fileSize: originalImage.fileSize,
          width: originalImage.width,
          height: originalImage.height
        });
        
        try {
          // Convert to JPEG format (handles HEIC, PNG, etc.)
          console.log('Converting image to JPEG format...');
          const compressedImage = await compressImage(originalImage.uri);
          
          const processedImage = {
            uri: compressedImage.uri,
            type: 'image/jpeg', // Force JPEG type
            fileName: `student_id_${side}_${Date.now()}.jpg`,
            fileSize: compressedImage.fileSize,
            width: compressedImage.width,
            height: compressedImage.height,
          };
          
          console.log('Processed image info:', processedImage);
          
          if (side === 'front') {
            setFrontImage(processedImage);
          } else {
            setBackImage(processedImage);
          }
          
        } catch (compressError) {
          console.error('Error converting image:', compressError);
          Alert.alert('Lỗi', compressError.message || 'Không thể xử lý ảnh. Vui lòng chọn ảnh khác.');
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh từ thư viện');
    }
  };

  const takePhoto = async (side) => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Lỗi', 'Cần cấp quyền truy cập camera');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'], // Only images
        allowsEditing: false,
        quality: 1, // Use full quality first, we'll convert to JPEG later
        exif: false, // Don't include EXIF data to reduce file size
      });

      if (!result.canceled && result.assets[0]) {
        const originalImage = result.assets[0];
        console.log('Original photo info:', {
          uri: originalImage.uri,
          type: originalImage.type,
          fileSize: originalImage.fileSize,
          width: originalImage.width,
          height: originalImage.height
        });
        
        try {
          // Convert to JPEG format
          console.log('Converting photo to JPEG format...');
          const compressedImage = await compressImage(originalImage.uri);
          
          const processedImage = {
            uri: compressedImage.uri,
            type: 'image/jpeg', // Force JPEG type
            fileName: `student_id_${side}_${Date.now()}.jpg`,
            fileSize: compressedImage.fileSize,
            width: compressedImage.width,
            height: compressedImage.height,
          };
          
          console.log('Processed photo info:', processedImage);
          
          if (side === 'front') {
            setFrontImage(processedImage);
          } else {
            setBackImage(processedImage);
          }
          
        } catch (compressError) {
          console.error('Error converting photo:', compressError);
          Alert.alert('Lỗi', compressError.message || 'Không thể xử lý ảnh. Vui lòng chụp lại.');
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Lỗi', 'Không thể chụp ảnh');
    }
  };

  const showImagePicker = (side) => {
    setCurrentSide(side);
    Alert.alert(
      `Chọn ảnh mặt ${side === 'front' ? 'trước' : 'sau'}`,
      'Chọn cách thức để tải ảnh thẻ sinh viên',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Chụp ảnh', onPress: () => takePhoto(side) },
        { text: 'Chọn từ thư viện', onPress: () => pickImage(side) },
      ]
    );
  };

  const submitVerification = async () => {
    if (!frontImage || !backImage) {
      Alert.alert('Lỗi', 'Vui lòng chụp đầy đủ 2 mặt thẻ sinh viên');
      return;
    }

    setUploading(true);

    try {
      // Validate files first
      verificationService.validateDocumentFile(frontImage);
      verificationService.validateDocumentFile(backImage);

      // Create document files array
      const documentFiles = [
        {
          uri: frontImage.uri,
          mimeType: frontImage.mimeType || 'image/jpeg',
          fileName: frontImage.fileName || 'student_id_front.jpg',
          fileSize: frontImage.fileSize,
        },
        {
          uri: backImage.uri,
          mimeType: backImage.mimeType || 'image/jpeg',
          fileName: backImage.fileName || 'student_id_back.jpg',
          fileSize: backImage.fileSize,
        }
      ];

      const result = await verificationService.submitStudentVerification(documentFiles);

      // After successful submission, refresh verification status
      try {
        const updatedVerification = await verificationService.getCurrentStudentVerification();
        setCurrentVerification(updatedVerification);
        console.log('Updated verification status:', updatedVerification);
      } catch (error) {
        console.log('Could not refresh verification status:', error);
      }

      Alert.alert(
        'Gửi thành công!',
        result.message || 'Thẻ sinh viên đã được gửi để xác minh. Admin sẽ duyệt trong 1-2 ngày làm việc.',
        [
          { 
            text: 'OK', 
            onPress: () => {
              // Navigate to Main screen after successful submission
              navigation.replace('Main');
            }
          }
        ]
      );
    } catch (error) {
      console.error('Student verification error:', error);
      Alert.alert('Lỗi', error.message || 'Không thể gửi thẻ sinh viên');
    } finally {
      setUploading(false);
    }
  };

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <SoftBackHeader
          title="Xác minh sinh viên"
          onBackPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.replace('Main');
            }
          }}
        />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.content}>
            {/* Instructions Card */}
            <Animatable.View animation="fadeInUp" delay={100} style={styles.cardWrapper}>
              <CleanCard contentStyle={styles.instructionsCard}>
                <View style={styles.instructionsHeader}>
                  <View style={styles.iconWrapper}>
                    <Icon name="school" size={32} color={colors.primary} />
                  </View>
                  <View style={styles.instructionsTextWrapper}>
                    <Text style={styles.instructionsTitle}>Xác minh tài khoản sinh viên</Text>
                    <Text style={styles.instructionsText}>
                      Để sử dụng dịch vụ, bạn cần xác minh là sinh viên của trường. 
                      Vui lòng chụp ảnh thẻ sinh viên rõ nét.
                    </Text>
                  </View>
                </View>
              </CleanCard>
            </Animatable.View>

            {/* Requirements Card */}
            <Animatable.View animation="fadeInUp" delay={200} style={styles.cardWrapper}>
              <CleanCard contentStyle={styles.requirementsCard}>
                <Text style={styles.cardTitle}>Yêu cầu ảnh thẻ sinh viên</Text>
                <View style={styles.requirementsList}>
                  {[
                    'Ảnh rõ nét, không bị mờ',
                    'Hiển thị đầy đủ thông tin trên thẻ',
                    'Thẻ còn hiệu lực',
                    'Định dạng JPG, PNG (tối đa 5MB)'
                  ].map((requirement, index) => (
                    <View key={index} style={styles.requirementItem}>
                      <Icon name="check-circle" size={18} color={colors.primary} />
                      <Text style={styles.requirementText}>{requirement}</Text>
                    </View>
                  ))}
                </View>
              </CleanCard>
            </Animatable.View>

            {/* Front Image Upload Card */}
            <Animatable.View animation="fadeInUp" delay={300} style={styles.cardWrapper}>
              <CleanCard contentStyle={styles.uploadCard}>
                <Text style={styles.cardTitle}>Mặt trước thẻ sinh viên</Text>
                {frontImage ? (
                  <Animatable.View animation="fadeIn" style={styles.imagePreviewWrapper}>
                    <Image source={{ uri: frontImage.uri }} style={styles.previewImage} />
                    <TouchableOpacity 
                      style={styles.changeButton}
                      onPress={() => showImagePicker('front')}
                    >
                      <Icon name="edit" size={18} color={colors.accent} />
                      <Text style={styles.changeButtonText}>Đổi ảnh</Text>
                    </TouchableOpacity>
                  </Animatable.View>
                ) : (
                  <TouchableOpacity 
                    style={styles.uploadArea}
                    onPress={() => showImagePicker('front')}
                    activeOpacity={0.7}
                  >
                    <View style={styles.uploadIconWrapper}>
                      <Icon name="camera-alt" size={40} color={colors.accent} />
                    </View>
                    <Text style={styles.uploadAreaText}>Chụp mặt trước</Text>
                    <Text style={styles.uploadAreaSubtext}>Chụp ảnh hoặc chọn từ thư viện</Text>
                  </TouchableOpacity>
                )}
              </CleanCard>
            </Animatable.View>

            {/* Back Image Upload Card */}
            <Animatable.View animation="fadeInUp" delay={400} style={styles.cardWrapper}>
              <CleanCard contentStyle={styles.uploadCard}>
                <Text style={styles.cardTitle}>Mặt sau thẻ sinh viên</Text>
                {backImage ? (
                  <Animatable.View animation="fadeIn" style={styles.imagePreviewWrapper}>
                    <Image source={{ uri: backImage.uri }} style={styles.previewImage} />
                    <TouchableOpacity 
                      style={styles.changeButton}
                      onPress={() => showImagePicker('back')}
                    >
                      <Icon name="edit" size={18} color={colors.accent} />
                      <Text style={styles.changeButtonText}>Đổi ảnh</Text>
                    </TouchableOpacity>
                  </Animatable.View>
                ) : (
                  <TouchableOpacity 
                    style={styles.uploadArea}
                    onPress={() => showImagePicker('back')}
                    activeOpacity={0.7}
                  >
                    <View style={styles.uploadIconWrapper}>
                      <Icon name="camera-alt" size={40} color={colors.accent} />
                    </View>
                    <Text style={styles.uploadAreaText}>Chụp mặt sau</Text>
                    <Text style={styles.uploadAreaSubtext}>Chụp ảnh hoặc chọn từ thư viện</Text>
                  </TouchableOpacity>
                )}
              </CleanCard>
            </Animatable.View>

            {/* Info Card */}
            <Animatable.View animation="fadeInUp" delay={500} style={styles.cardWrapper}>
              <CleanCard variant="accent" contentStyle={styles.infoCard}>
                <View style={styles.infoContent}>
                  <Icon name="info" size={20} color={colors.accent} />
                  <Text style={styles.infoText}>
                    Quá trình xác minh có thể mất 1-2 ngày làm việc. 
                    Chúng tôi sẽ thông báo kết quả qua email.
                  </Text>
                </View>
              </CleanCard>
            </Animatable.View>

            {/* Submit Button */}
            <Animatable.View animation="fadeInUp" delay={600} style={styles.buttonWrapper}>
              <ModernButton
                title={uploading ? "Đang gửi..." : "Gửi để xác minh"}
                onPress={submitVerification}
                disabled={!frontImage || !backImage || uploading}
                icon={uploading ? null : "send"}
                loading={uploading}
              />
            </Animatable.View>

            {/* Skip Button for Testing */}
            {__DEV__ && (
              <TouchableOpacity 
                style={styles.skipButton}
                onPress={() => {
                  Alert.alert(
                    'Bỏ qua xác minh',
                    'Bạn có chắc chắn muốn bỏ qua xác minh? (Chỉ để test)',
                    [
                      { text: 'Hủy', style: 'cancel' },
                      { 
                        text: 'Bỏ qua', 
                        onPress: () => navigation.replace('Main')
                      }
                    ]
                  );
                }}
              >
                <Text style={styles.skipButtonText}>Bỏ qua tạm thời (Test)</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xl * 2,
    paddingHorizontal: spacing.md,
  },
  content: {
    flex: 1,
  },
  cardWrapper: {
    marginBottom: spacing.md,
  },
  // Instructions Card
  instructionsCard: {
    paddingVertical: spacing.lg,
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: radii.md,
    backgroundColor: 'rgba(16,65,47,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  instructionsTextWrapper: {
    flex: 1,
  },
  instructionsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  instructionsText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  // Requirements Card
  requirementsCard: {
    paddingVertical: spacing.lg,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  requirementsList: {
    gap: spacing.sm,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  requirementText: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  // Upload Card
  uploadCard: {
    paddingVertical: spacing.lg,
  },
  uploadArea: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    backgroundColor: colors.glassLight,
  },
  uploadIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: radii.md,
    backgroundColor: 'rgba(59,130,246,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  uploadAreaText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  uploadAreaSubtext: {
    fontSize: 13,
    color: colors.textMuted,
  },
  // Image Preview
  imagePreviewWrapper: {
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: radii.md,
    resizeMode: 'cover',
    backgroundColor: colors.glassLight,
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  changeButtonText: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: '600',
  },
  // Info Card
  infoCard: {
    paddingVertical: spacing.md,
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  // Button
  buttonWrapper: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  // Skip Button
  skipButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.glassLight,
  },
  skipButtonText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '500',
  },
});

export default StudentVerificationScreen;
