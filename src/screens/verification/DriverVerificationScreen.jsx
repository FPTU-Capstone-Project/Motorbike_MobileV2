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
import CleanCard from '../../components/ui/CleanCard.jsx';
import { SoftBackHeader } from '../../components/ui/GlassHeader.jsx';
import AppBackground from '../../components/layout/AppBackground.jsx';
import authService from '../../services/authService';
import verificationService from '../../services/verificationService';
import { ApiError } from '../../services/api';
import { colors, spacing, radii } from '../../theme/designTokens';

const DriverVerificationScreen = ({ navigation }) => {
  // State for each document type
  const [licenseFront, setLicenseFront] = useState(null);
  const [licenseBack, setLicenseBack] = useState(null);
  const [vehicleRegistrationFront, setVehicleRegistrationFront] = useState(null);
  const [vehicleRegistrationBack, setVehicleRegistrationBack] = useState(null);
  const [vehicleAuthorizationFront, setVehicleAuthorizationFront] = useState(null);
  const [vehicleAuthorizationBack, setVehicleAuthorizationBack] = useState(null);
  
  const [uploading, setUploading] = useState(false);
  const [currentDocument, setCurrentDocument] = useState('license'); // license, vehicleRegistration, vehicleAuthorization
  const [currentSide, setCurrentSide] = useState('front'); // front, back
  const [currentVerification, setCurrentVerification] = useState(null);

  // Load current verification status
  useEffect(() => {
    loadCurrentVerification();
  }, []);

  const loadCurrentVerification = async () => {
    try {
      // First check if user has rider verification (required for driver verification)
      const riderVerification = await verificationService.getCurrentStudentVerification();
      if (!riderVerification || riderVerification.status?.toLowerCase() !== 'approved') {
        Alert.alert(
          'Cần xác minh rider trước',
          'Bạn cần xác minh tài khoản sinh viên trước khi có thể xác minh tài xế. Vui lòng gửi thẻ sinh viên để admin duyệt.',
          [
            { text: 'Hủy', onPress: () => navigation.goBack() },
            { text: 'Xác minh sinh viên', onPress: () => navigation.navigate('StudentVerification') }
          ]
        );
        return;
      }

      const verification = await verificationService.getCurrentDriverVerification();
      setCurrentVerification(verification);
      
      // If user already has pending verification, show alert and go back
      if (verification && verification.status?.toLowerCase() === 'pending') {
        Alert.alert(
          'Đang chờ duyệt',
          'Bạn đã gửi yêu cầu xác minh tài xế và đang chờ admin duyệt. Vui lòng chờ kết quả.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
        return;
      }
      
      // If user already verified, show alert and go back
      if (verification && (verification.status?.toLowerCase() === 'verified' || verification.status?.toLowerCase() === 'approved' || verification.status?.toLowerCase() === 'active')) {
        Alert.alert(
          'Đã xác minh',
          'Tài khoản tài xế của bạn đã được xác minh.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
        return;
      }

      // If user's verification was rejected, just log it (don't show alert again)
      // The alert was already shown in ProfileSwitchScreen
      if (verification && verification.status?.toLowerCase() === 'rejected') {
        console.log('User has rejected driver verification, allowing resubmission');
        // Continue with the form to allow resubmission
        return;
      }
    } catch (error) {
      console.log('No current driver verification found or error:', error);
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

  const pickImage = async (documentType, side) => {
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
            fileName: `${documentType}_${side}_${Date.now()}.jpg`,
            fileSize: compressedImage.fileSize,
            width: compressedImage.width,
            height: compressedImage.height,
          };
          
          console.log('Processed image info:', processedImage);
          
          // Set the appropriate state based on document type and side
          if (documentType === 'license') {
            if (side === 'front') {
              setLicenseFront(processedImage);
            } else {
              setLicenseBack(processedImage);
            }
          } else if (documentType === 'vehicleRegistration') {
            if (side === 'front') {
              setVehicleRegistrationFront(processedImage);
            } else {
              setVehicleRegistrationBack(processedImage);
            }
          } else if (documentType === 'vehicleAuthorization') {
            if (side === 'front') {
              setVehicleAuthorizationFront(processedImage);
            } else {
              setVehicleAuthorizationBack(processedImage);
            }
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

  const takePhoto = async (documentType, side) => {
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
            fileName: `${documentType}_${side}_${Date.now()}.jpg`,
            fileSize: compressedImage.fileSize,
            width: compressedImage.width,
            height: compressedImage.height,
          };
          
          console.log('Processed photo info:', processedImage);
          
          // Set the appropriate state based on document type and side
          if (documentType === 'license') {
            if (side === 'front') {
              setLicenseFront(processedImage);
            } else {
              setLicenseBack(processedImage);
            }
          } else if (documentType === 'vehicleRegistration') {
            if (side === 'front') {
              setVehicleRegistrationFront(processedImage);
            } else {
              setVehicleRegistrationBack(processedImage);
            }
          } else if (documentType === 'vehicleAuthorization') {
            if (side === 'front') {
              setVehicleAuthorizationFront(processedImage);
            } else {
              setVehicleAuthorizationBack(processedImage);
            }
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

  const showImagePicker = (documentType, side) => {
    setCurrentDocument(documentType);
    setCurrentSide(side);
    
    const documentNames = {
      license: 'bằng lái xe',
      vehicleRegistration: 'giấy chứng nhận đăng ký xe',
      vehicleAuthorization: 'giấy ủy quyền phương tiện'
    };
    
    const sideNames = {
      front: 'mặt trước',
      back: 'mặt sau'
    };
    
    Alert.alert(
      `Chọn ảnh ${sideNames[side]} ${documentNames[documentType]}`,
      'Chọn cách thức để tải ảnh',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Chọn từ thư viện', onPress: () => pickImage(documentType, side) },
        { text: 'Chụp ảnh mới', onPress: () => takePhoto(documentType, side) }
      ]
    );
  };

  const submitVerification = async () => {
    // Check if all required documents are uploaded
    if (!licenseFront || !licenseBack || !vehicleRegistrationFront || !vehicleRegistrationBack) {
      Alert.alert('Thiếu giấy tờ', 'Vui lòng chụp đầy đủ bằng lái xe và giấy chứng nhận đăng ký xe (cả 2 mặt)');
      return;
    }

    setUploading(true);

    try {
      // Prepare documents grouped by type for separate API calls
      const documentFiles = {
        license: [
          {
            uri: licenseFront.uri,
            mimeType: licenseFront.type || 'image/jpeg',
            fileName: licenseFront.fileName || 'license_front.jpg',
            fileSize: licenseFront.fileSize,
          },
          {
            uri: licenseBack.uri,
            mimeType: licenseBack.type || 'image/jpeg',
            fileName: licenseBack.fileName || 'license_back.jpg',
            fileSize: licenseBack.fileSize,
          }
        ],
        vehicleRegistration: [
          {
            uri: vehicleRegistrationFront.uri,
            mimeType: vehicleRegistrationFront.type || 'image/jpeg',
            fileName: vehicleRegistrationFront.fileName || 'vehicle_registration_front.jpg',
            fileSize: vehicleRegistrationFront.fileSize,
          },
          {
            uri: vehicleRegistrationBack.uri,
            mimeType: vehicleRegistrationBack.type || 'image/jpeg',
            fileName: vehicleRegistrationBack.fileName || 'vehicle_registration_back.jpg',
            fileSize: vehicleRegistrationBack.fileSize,
          }
        ]
      };

      // Add vehicle authorization if provided
      if (vehicleAuthorizationFront && vehicleAuthorizationBack) {
        documentFiles.vehicleAuthorization = [
          {
            uri: vehicleAuthorizationFront.uri,
            mimeType: vehicleAuthorizationFront.type || 'image/jpeg',
            fileName: vehicleAuthorizationFront.fileName || 'vehicle_authorization_front.jpg',
            fileSize: vehicleAuthorizationFront.fileSize,
          },
          {
            uri: vehicleAuthorizationBack.uri,
            mimeType: vehicleAuthorizationBack.type || 'image/jpeg',
            fileName: vehicleAuthorizationBack.fileName || 'vehicle_authorization_back.jpg',
            fileSize: vehicleAuthorizationBack.fileSize,
          }
        ];
      }

      const result = await verificationService.submitDriverVerification(documentFiles);

      // After successful submission, refresh verification status
      try {
        const updatedVerification = await verificationService.getCurrentDriverVerification();
        setCurrentVerification(updatedVerification);
        console.log('Updated driver verification status:', updatedVerification);
      } catch (error) {
        console.log('Could not refresh driver verification status:', error);
      }

      Alert.alert(
        'Gửi thành công!',
        result.message || 'Giấy tờ tài xế đã được gửi để xác minh. Admin sẽ duyệt trong 1-2 ngày làm việc.',
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
      console.error('Driver verification error:', error);
      Alert.alert('Lỗi', error.message || 'Không thể gửi giấy tờ tài xế');
    } finally {
      setUploading(false);
    }
  };

  const renderDocumentSection = (documentType, title, description, frontImage, backImage, setFrontImage, setBackImage, isOptional = false) => {
    return (
      <Animatable.View animation="fadeInUp">
        <CleanCard contentStyle={styles.documentCard}>
          <View style={styles.documentHeader}>
            <Text style={styles.documentTitle}>{title}</Text>
            {isOptional && (
              <View style={styles.optionalBadge}>
                <Text style={styles.optionalText}>Tùy chọn</Text>
              </View>
            )}
          </View>
          {description && (
            <Text style={styles.documentDescription}>{description}</Text>
          )}
          
          <View style={styles.imageContainer}>
            {/* Front Image */}
            <View style={styles.imageWrapper}>
              <Text style={styles.imageLabel}>Mặt trước</Text>
              <TouchableOpacity 
                style={styles.imageButton}
                onPress={() => showImagePicker(documentType, 'front')}
                activeOpacity={0.7}
              >
                {frontImage ? (
                  <View style={styles.imagePreviewWrapper}>
                    <Image source={{ uri: frontImage.uri }} style={styles.imagePreview} />
                    <TouchableOpacity 
                      style={styles.editOverlay}
                      onPress={() => showImagePicker(documentType, 'front')}
                    >
                      <Icon name="edit" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Icon name="add-a-photo" size={32} color={colors.accent} />
                    <Text style={styles.placeholderText}>Chụp mặt trước</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Back Image */}
            <View style={styles.imageWrapper}>
              <Text style={styles.imageLabel}>Mặt sau</Text>
              <TouchableOpacity 
                style={styles.imageButton}
                onPress={() => showImagePicker(documentType, 'back')}
                activeOpacity={0.7}
              >
                {backImage ? (
                  <View style={styles.imagePreviewWrapper}>
                    <Image source={{ uri: backImage.uri }} style={styles.imagePreview} />
                    <TouchableOpacity 
                      style={styles.editOverlay}
                      onPress={() => showImagePicker(documentType, 'back')}
                    >
                      <Icon name="edit" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Icon name="add-a-photo" size={32} color={colors.accent} />
                    <Text style={styles.placeholderText}>Chụp mặt sau</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </CleanCard>
      </Animatable.View>
    );
  };

  return (
    <AppBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
        <SoftBackHeader
          title="Xác minh tài xế"
          onBackPress={() => navigation.goBack()}
        />
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.content}>
            {/* Instructions Card */}
            <Animatable.View animation="fadeInUp" delay={100} style={styles.cardWrapper}>
              <CleanCard variant="accent" contentStyle={styles.instructionsCard}>
                <View style={styles.instructionsHeader}>
                  <View style={styles.instructionsIconWrapper}>
                    <Icon name="info" size={24} color={colors.accent} />
                  </View>
                  <View style={styles.instructionsContent}>
                    <Text style={styles.instructionsTitle}>Hướng dẫn gửi giấy tờ</Text>
                    <Text style={styles.instructionsText}>
                      Vui lòng chụp rõ nét các giấy tờ sau để xác minh tài khoản tài xế:
                    </Text>
                    <View style={styles.instructionsList}>
                      <Text style={styles.instructionsListItem}>• Bằng lái xe (2 mặt)</Text>
                      <Text style={styles.instructionsListItem}>• Giấy chứng nhận đăng ký xe (2 mặt)</Text>
                      <Text style={styles.instructionsListItem}>• Giấy ủy quyền phương tiện (2 mặt) - nếu có</Text>
                    </View>
                  </View>
                </View>
              </CleanCard>
            </Animatable.View>

            {/* License Section */}
            <Animatable.View animation="fadeInUp" delay={200} style={styles.cardWrapper}>
              {renderDocumentSection(
                'license',
                'Bằng lái xe',
                'Chụp ảnh mặt trước và mặt sau của bằng lái xe',
                licenseFront,
                licenseBack,
                setLicenseFront,
                setLicenseBack
              )}
            </Animatable.View>

            {/* Vehicle Registration Section */}
            <Animatable.View animation="fadeInUp" delay={300} style={styles.cardWrapper}>
              {renderDocumentSection(
                'vehicleRegistration',
                'Giấy chứng nhận đăng ký xe',
                'Chụp ảnh mặt trước và mặt sau của giấy chứng nhận đăng ký xe mô tô, xe gắn máy',
                vehicleRegistrationFront,
                vehicleRegistrationBack,
                setVehicleRegistrationFront,
                setVehicleRegistrationBack
              )}
            </Animatable.View>

            {/* Vehicle Authorization Section (Optional) */}
            <Animatable.View animation="fadeInUp" delay={400} style={styles.cardWrapper}>
              {renderDocumentSection(
                'vehicleAuthorization',
                'Giấy ủy quyền phương tiện',
                'Nếu bạn không phải chủ xe, vui lòng chụp giấy ủy quyền phương tiện',
                vehicleAuthorizationFront,
                vehicleAuthorizationBack,
                setVehicleAuthorizationFront,
                setVehicleAuthorizationBack,
                true
              )}
            </Animatable.View>

            {/* Submit Button */}
            <Animatable.View animation="fadeInUp" delay={500} style={styles.buttonWrapper}>
              <ModernButton
                title={uploading ? "Đang gửi..." : "Gửi giấy tờ xác minh"}
                onPress={submitVerification}
                disabled={uploading || !licenseFront || !licenseBack || !vehicleRegistrationFront || !vehicleRegistrationBack}
                loading={uploading}
                icon={uploading ? null : "send"}
              />
            </Animatable.View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
};

const styles = StyleSheet.create({
  container: {
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
  instructionsIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: 'rgba(59,130,246,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  instructionsContent: {
    flex: 1,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  instructionsText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  instructionsList: {
    gap: spacing.xs,
  },
  instructionsListItem: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  // Document Card
  documentCard: {
    paddingVertical: spacing.lg,
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  documentTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  optionalBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.sm,
    backgroundColor: 'rgba(148,163,184,0.15)',
  },
  optionalText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  documentDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  imageContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  imageWrapper: {
    flex: 1,
  },
  imageLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  imageButton: {
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  imagePreviewWrapper: {
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 140,
    borderRadius: radii.md,
    resizeMode: 'cover',
    backgroundColor: colors.glassLight,
  },
  editOverlay: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholder: {
    width: '100%',
    height: 140,
    backgroundColor: colors.glassLight,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  // Button
  buttonWrapper: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
});

export default DriverVerificationScreen;