import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, globalStyles } from '../utils/theme';
import { api } from '../services/api';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Camera'>;

interface FormDataValue {
  uri: string;
  name: string;
  type: string;
}

export default function CameraScreen({ navigation }: Props) {
  const [image, setImage] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Dozvola odbijena',
        'Potrebna nam je dozvola za kameru kako biste uslikali kvar.',
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!image || !question) return;
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      const imageFile: FormDataValue = {
        uri: image,
        name: 'photo.jpg',
        type: 'image/jpeg',
      };
      formData.append('image', imageFile as unknown as Blob);
      formData.append('question', question);

      const response = await api.post('/api/v1/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      navigation.navigate('AnalysisResult', { taskId: response.data.task_id });
    } catch (error) {
      console.error(error);
      Alert.alert('Greška na serveru', 'Nismo uspjeli poslati sliku na analizu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>Novi Popravak 🛠️</Text>

      <View style={styles.imagePlaceholder}>
        {image ? (
          <Image source={{ uri: image }} style={styles.previewImage} />
        ) : (
          <Text style={styles.placeholderText}>Nema odabrane slike</Text>
        )}
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.secondaryButton} onPress={takePhoto}>
          <Text style={styles.buttonText}>Uslikaj</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={pickImage}>
          <Text style={styles.buttonText}>Galerija</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Opišite što se dogodilo:</Text>
      <TextInput
        style={styles.input}
        placeholder="npr. Bušilica se dimi ili ne okreće..."
        multiline
        numberOfLines={4}
        value={question}
        onChangeText={setQuestion}
      />

      <TouchableOpacity
        style={[styles.mainButton, (!image || !question) && { opacity: 0.5 }]}
        onPress={handleSubmit}
        disabled={isSubmitting || !image || !question}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.mainButtonText}>Pošalji AI Majstoru</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  imagePlaceholder: {
    width: '100%',
    height: 250,
    backgroundColor: '#e2e8f0',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewImage: { width: '100%', height: '100%' },
  placeholderText: { color: colors.textSecondary },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg },
  secondaryButton: {
    backgroundColor: colors.textSecondary,
    padding: 12,
    borderRadius: 8,
    flex: 0.48,
    alignItems: 'center',
  },
  buttonText: { color: colors.surface, fontWeight: '600' },
  label: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 10,
    textAlignVertical: 'top',
    fontSize: 16,
    ...globalStyles.shadow,
    marginBottom: spacing.xl,
  },
  mainButton: {
    backgroundColor: colors.primary,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  mainButtonText: { color: colors.surface, fontWeight: 'bold', fontSize: 18 },
});
