import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Linking,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, globalStyles } from '../utils/theme';
import { supabase } from '../services/supabase';

interface B2BData {
  expert_number?: string;
  shop_links?: string[];
}

interface AIData {
  is_relevant: boolean;
  rejection_reason?: string;
  identification?: string;
  solution?: string;
  diy_feasibility?: string;
  dangers?: string;
  confidence?: number;
  required_tools?: string[];
  recommended_expert?: string;
}

interface AIResult {
  data: AIData;
  b2b?: B2BData;
  latency?: number;
}

interface Message {
  id: string;
  role: 'user' | 'ai';
  text?: string;
  imageUri?: string;
  isLoading?: boolean;
  isError?: boolean;
  aiData?: AIResult;
}

interface FormDataValue {
  uri: string;
  name: string;
  type: string;
}

export default function AIChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      return () => {
        setMessages([]);
        setInputText('');
        setSelectedImage(null);
        setActiveTaskId(null);
      };
    }, []),
  );

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let isMounted = true;

    const pollTask = async () => {
      if (!activeTaskId || !isMounted) return;

      try {
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/api/v1/tasks/${activeTaskId}`,
        );
        const json = await response.json();

        if (json.status === 'completed' || json.status === 'success') {
          setActiveTaskId(null);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.isLoading ? { ...msg, isLoading: false, aiData: json.result as AIResult } : msg,
            ),
          );
        } else if (json.status === 'failed' || json.status === 'failure') {
          setActiveTaskId(null);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.isLoading
                ? {
                    ...msg,
                    isLoading: false,
                    isError: true,
                    text: 'Došlo je do greške u AI analizi.',
                  }
                : msg,
            ),
          );
        } else {
          timeoutId = setTimeout(pollTask, 3000);
        }
      } catch {
        setActiveTaskId(null);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.isLoading
              ? { ...msg, isLoading: false, isError: true, text: 'Prekinuta veza sa serverom.' }
              : msg,
          ),
        );
      }
    };

    if (activeTaskId) {
      pollTask();
    }

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [activeTaskId]);

  const pickImage = async (useCamera: boolean) => {
    const options: ImagePicker.ImagePickerOptions = {
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    };

    let result;
    if (useCamera) {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Dozvola', 'Potrebna je dozvola za kameru.');
        return;
      }
      result = await ImagePicker.launchCameraAsync(options);
    } else {
      result = await ImagePicker.launchImageLibraryAsync(options);
    }

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleSend = async () => {
    if (!inputText && !selectedImage) return;

    const userMessageId = Date.now().toString();
    const aiMessageId = (Date.now() + 1).toString();

    setMessages((prev) => [
      ...prev,
      { id: userMessageId, role: 'user', text: inputText, imageUri: selectedImage || undefined },
    ]);
    setMessages((prev) => [...prev, { id: aiMessageId, role: 'ai', isLoading: true }]);

    const textToSend = inputText;
    const imageToSend = selectedImage;

    setInputText('');
    setSelectedImage(null);

    try {
      const formData = new FormData();

      if (imageToSend) {
        const imageFile: FormDataValue = {
          uri: imageToSend,
          name: 'photo.jpg',
          type: 'image/jpeg',
        };
        formData.append('image', imageFile as unknown as Blob);
      }

      formData.append('question', textToSend || 'Analiziraj ovu sliku.');

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/analyze`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}` },
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.task_id) {
        setActiveTaskId(data.task_id);
      } else {
        throw new Error('Server odbio zahtjev');
      }
    } catch {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMessageId
            ? {
                ...msg,
                isLoading: false,
                isError: true,
                text: 'Nisam mogao obraditi zahtjev. Molim pokušaj ponovno.',
              }
            : msg,
        ),
      );
    }
  };

  const extractLinkName = (url: string) => {
    try {
      const parts = url.split('keywords=');
      if (parts.length > 1 && parts[1]) {
        return 'Kupi: ' + decodeURIComponent(parts[1]).replace(/\+/g, ' ');
      }
    } catch {
      return 'Naruči materijal';
    }
    return 'Naruči materijal';
  };

  const renderMessage = (msg: Message) => {
    if (msg.role === 'user') {
      return (
        <View key={msg.id} style={styles.userBubble}>
          {msg.imageUri && <Image source={{ uri: msg.imageUri }} style={styles.chatImage} />}
          {msg.text ? <Text style={styles.userText}>{msg.text}</Text> : null}
        </View>
      );
    }

    if (msg.isLoading) {
      return (
        <View key={msg.id} style={styles.aiBubble}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Majstor razmišlja...</Text>
        </View>
      );
    }

    if (msg.isError) {
      return (
        <View key={msg.id} style={[styles.aiBubble, { backgroundColor: '#fee2e2' }]}>
          <Text style={{ color: colors.error }}>{msg.text}</Text>
        </View>
      );
    }

    if (msg.aiData) {
      const ai = msg.aiData.data;
      const b2b = msg.aiData.b2b;

      return (
        <View key={msg.id} style={styles.aiBubble}>
          {!ai.is_relevant ? (
            <Text style={styles.aiText}>
              ⚠️ <Text style={{ fontWeight: 'bold' }}>Nije relevantno:</Text> {ai.rejection_reason}
            </Text>
          ) : (
            <>
              <Text style={styles.aiText}>
                <Text style={{ fontWeight: 'bold' }}>Što vidim:</Text> {ai.identification}
              </Text>
              <Text style={styles.aiText}>
                <Text style={{ fontWeight: 'bold' }}>Rješenje:</Text> {ai.solution}
              </Text>

              {ai.dangers && (
                <View style={styles.warningBox}>
                  <Text style={styles.warningText}>⚠️ {ai.dangers}</Text>
                </View>
              )}

              {ai.required_tools && ai.required_tools.length > 0 && (
                <View style={{ marginTop: 10 }}>
                  <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>🧰 Potreban alat:</Text>
                  {ai.required_tools.map((tool: string, i: number) => (
                    <Text key={i}>• {tool}</Text>
                  ))}
                </View>
              )}

              {b2b && (b2b.expert_number || (b2b.shop_links && b2b.shop_links.length > 0)) && (
                <View style={styles.b2bBox}>
                  {b2b.expert_number && (
                    <Text style={{ fontWeight: 'bold', color: '#1e3a8a', marginBottom: 5 }}>
                      📞 Hitno? Zovi: {b2b.expert_number}
                    </Text>
                  )}
                  {b2b.shop_links &&
                    b2b.shop_links.map((link: string, i: number) => (
                      <TouchableOpacity key={i} onPress={() => Linking.openURL(link)}>
                        <Text
                          style={{
                            color: '#2563eb',
                            textDecorationLine: 'underline',
                            marginTop: 4,
                          }}
                        >
                          🔗 {extractLinkName(link)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                </View>
              )}
            </>
          )}
        </View>
      );
    }
    return null;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.chatContainer}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="construct-outline" size={60} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>UradiSam Majstor</Text>
            <Text style={styles.emptyText}>
              Uslikaj kvar ili postavi pitanje da bismo započeli popravak.
            </Text>
          </View>
        ) : (
          messages.map(renderMessage)
        )}
      </ScrollView>

      <View style={styles.inputArea}>
        {selectedImage && (
          <View style={styles.selectedImagePreview}>
            <Image source={{ uri: selectedImage }} style={styles.previewThumb} />
            <TouchableOpacity style={styles.removeThumbBtn} onPress={() => setSelectedImage(null)}>
              <Ionicons name="close-circle" size={24} color="red" />
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.inputRow}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => pickImage(true)}>
            <Ionicons name="camera" size={24} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => pickImage(false)}>
            <Ionicons name="image" size={24} color={colors.primary} />
          </TouchableOpacity>
          <TextInput
            style={styles.textInput}
            placeholder="Opiši problem..."
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, !inputText && !selectedImage && { opacity: 0.5 }]}
            onPress={handleSend}
            disabled={(!inputText && !selectedImage) || activeTaskId !== null}
          >
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  chatContainer: { padding: spacing.md, paddingBottom: spacing.xl },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyTitle: { fontSize: 22, fontWeight: 'bold', color: colors.text, marginTop: 10 },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: 10,
    paddingHorizontal: 40,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 16,
    borderBottomRightRadius: 4,
    maxWidth: '80%',
    marginBottom: 15,
  },
  userText: { color: '#fff', fontSize: 16 },
  chatImage: { width: 200, height: 200, borderRadius: 8, marginBottom: 5 },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    maxWidth: '90%',
    marginBottom: 15,
    ...globalStyles.shadow,
  },
  aiText: { fontSize: 16, color: colors.text, marginBottom: 8, lineHeight: 22 },
  loadingText: { marginLeft: 10, color: colors.textSecondary, marginTop: 5 },
  warningBox: { backgroundColor: '#fff1f2', padding: 10, borderRadius: 8, marginTop: 10 },
  warningText: { color: colors.error, fontWeight: '500' },
  b2bBox: {
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  inputArea: {
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  selectedImagePreview: { flexDirection: 'row', marginBottom: 10, paddingHorizontal: 10 },
  previewThumb: { width: 60, height: 60, borderRadius: 8 },
  removeThumbBtn: { position: 'absolute', top: -10, left: 60 },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { padding: 10 },
  textInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 10,
    maxHeight: 100,
    fontSize: 16,
  },
  sendBtn: {
    backgroundColor: colors.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
});
