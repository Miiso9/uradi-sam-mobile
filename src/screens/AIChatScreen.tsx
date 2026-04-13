import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Linking,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { ThemedText } from '../components/ThemedText';
import { ThemedCard } from '../components/ThemedCard';
import { useTheme } from '../context/ThemeContext';
import { AnimatedLoader } from '../components/AnimatedLoader';
import { spacing, borderRadius, shadows } from '../utils/theme';

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
  const { colors } = useTheme();

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
                ? { ...msg, isLoading: false, isError: true, text: 'Greška u AI analizi.' }
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

    if (activeTaskId) pollTask();
    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [activeTaskId]);

  const pickImage = async (useCamera: boolean) => {
    const options: ImagePicker.ImagePickerOptions = {
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.75,
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
    if (!result.canceled) setSelectedImage(result.assets[0].uri);
  };

  const handleSend = async () => {
    if (!inputText && !selectedImage) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

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
                text: 'Nisam mogao obraditi zahtjev. Pokušaj ponovo.',
              }
            : msg,
        ),
      );
    }
  };

  const extractLinkName = (url: string) => {
    try {
      const parts = url.split('keywords=');
      if (parts.length > 1 && parts[1])
        return 'Kupi: ' + decodeURIComponent(parts[1]).replace(/\+/g, ' ');
    } catch {
      return 'Naruči materijal';
    }
    return 'Naruči materijal';
  };

  const renderMessage = (msg: Message) => {
    if (msg.role === 'user') {
      return (
        <View key={msg.id} style={styles.userMsgWrap}>
          <View style={[styles.userBubble, { backgroundColor: colors.primary }, shadows.amberSm]}>
            {msg.imageUri && <Image source={{ uri: msg.imageUri }} style={styles.chatImage} />}
            {msg.text ? (
              <Text style={[styles.userText, { color: colors.background }]}>{msg.text}</Text>
            ) : null}
          </View>
        </View>
      );
    }

    if (msg.isLoading) {
      return (
        <View key={msg.id} style={styles.aiMsgWrap}>
          <AnimatedLoader />
        </View>
      );
    }

    if (msg.isError) {
      return (
        <View key={msg.id} style={styles.aiMsgWrap}>
          <View
            style={[
              styles.errorBubble,
              { backgroundColor: `${colors.error}15`, borderColor: `${colors.error}40` },
            ]}
          >
            <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>{msg.text}</Text>
          </View>
        </View>
      );
    }

    if (msg.aiData) {
      const ai = msg.aiData.data;
      const b2b = msg.aiData.b2b;

      return (
        <View key={msg.id} style={styles.aiMsgWrap}>
          <ThemedCard style={styles.aiBubble}>
            {!ai.is_relevant ? (
              <View style={styles.notRelevantRow}>
                <Ionicons name="alert-circle" size={18} color={colors.warning} />
                <ThemedText
                  type="body"
                  style={{ flex: 1, color: colors.textSecondary, fontSize: 15 }}
                >
                  {ai.rejection_reason}
                </ThemedText>
              </View>
            ) : (
              <>
                {ai.identification && (
                  <View style={styles.aiSection}>
                    <View style={styles.aiSectionLabel}>
                      <Ionicons name="eye-outline" size={14} color={colors.primary} />
                      <ThemedText type="label" style={{ color: colors.primary }}>
                        Dijagnoza
                      </ThemedText>
                    </View>
                    <ThemedText
                      type="body"
                      style={{ color: colors.text, fontSize: 15, lineHeight: 22 }}
                    >
                      {ai.identification}
                    </ThemedText>
                  </View>
                )}

                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                {ai.solution && (
                  <View style={styles.aiSection}>
                    <View style={styles.aiSectionLabel}>
                      <Ionicons name="construct-outline" size={14} color={colors.secondary} />
                      <ThemedText type="label" style={{ color: colors.secondary }}>
                        Rješenje
                      </ThemedText>
                    </View>
                    <ThemedText
                      type="body"
                      style={{ color: colors.text, fontSize: 15, lineHeight: 22 }}
                    >
                      {ai.solution}
                    </ThemedText>
                  </View>
                )}

                {ai.dangers && (
                  <>
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <View
                      style={[
                        styles.warningBox,
                        { backgroundColor: `${colors.error}10`, borderColor: `${colors.error}30` },
                      ]}
                    >
                      <Ionicons name="warning-outline" size={16} color={colors.error} />
                      <ThemedText
                        type="caption"
                        style={{ flex: 1, color: colors.error, lineHeight: 18 }}
                      >
                        {ai.dangers}
                      </ThemedText>
                    </View>
                  </>
                )}

                {ai.required_tools && ai.required_tools.length > 0 && (
                  <>
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <View style={styles.aiSection}>
                      <View style={styles.aiSectionLabel}>
                        <Ionicons name="hammer-outline" size={14} color={colors.textSecondary} />
                        <ThemedText type="label" style={{ color: colors.textSecondary }}>
                          Alati
                        </ThemedText>
                      </View>
                      <View style={styles.toolsWrap}>
                        {ai.required_tools.map((tool: string, i: number) => (
                          <View
                            key={i}
                            style={[
                              styles.toolPill,
                              {
                                backgroundColor: colors.surfaceRaised,
                                borderColor: colors.borderStrong,
                              },
                            ]}
                          >
                            <ThemedText type="caption" style={{ color: colors.text }}>
                              {tool}
                            </ThemedText>
                          </View>
                        ))}
                      </View>
                    </View>
                  </>
                )}

                {b2b && (b2b.expert_number || (b2b.shop_links && b2b.shop_links.length > 0)) && (
                  <>
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <View
                      style={[
                        styles.b2bBox,
                        {
                          backgroundColor: colors.primaryMuted,
                          borderColor: `${colors.primary}30`,
                        },
                      ]}
                    >
                      {b2b.expert_number && (
                        <TouchableOpacity
                          style={styles.expertRow}
                          onPress={() => Linking.openURL(`tel:${b2b.expert_number}`)}
                        >
                          <Ionicons name="call" size={16} color={colors.primary} />
                          <ThemedText type="bodyMedium" style={{ color: colors.primary }}>
                            {b2b.expert_number}
                          </ThemedText>
                          <Ionicons
                            name="chevron-forward"
                            size={14}
                            color={`${colors.primary}80`}
                          />
                        </TouchableOpacity>
                      )}
                      {b2b.shop_links?.map((link: string, i: number) => (
                        <TouchableOpacity
                          key={i}
                          style={[styles.linkBtn, { borderColor: `${colors.primary}40` }]}
                          onPress={() => Linking.openURL(link)}
                        >
                          <Ionicons name="bag-outline" size={14} color={colors.primary} />
                          <ThemedText type="caption" style={{ color: colors.primary, flex: 1 }}>
                            {extractLinkName(link)}
                          </ThemedText>
                          <Ionicons name="open-outline" size={12} color={`${colors.primary}80`} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}
              </>
            )}
          </ThemedCard>
        </View>
      );
    }
    return null;
  };

  const canSend = (!!inputText || !!selectedImage) && !activeTaskId;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={[styles.chatContainer, messages.length === 0 && styles.chatEmpty]}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <View
              style={[
                styles.emptyIcon,
                { backgroundColor: colors.primaryMuted, borderColor: `${colors.primary}30` },
              ]}
            >
              <Ionicons name="construct" size={36} color={colors.primary} />
            </View>
            <ThemedText
              type="subtitle"
              style={{ color: colors.text, textAlign: 'center', marginTop: spacing.md }}
            >
              AI Majstor
            </ThemedText>
            <ThemedText
              type="body"
              style={{
                color: colors.textSecondary,
                textAlign: 'center',
                marginTop: spacing.xs,
                maxWidth: 260,
              }}
            >
              Uslikaj kvar ili opiši problem — rješenje stiže za sekunde.
            </ThemedText>

            <View style={styles.chipWrap}>
              {['Curenje cijevi', 'Električni kvar', 'Pukotina u zidu'].map((label) => (
                <TouchableOpacity
                  key={label}
                  style={[
                    styles.promptChip,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                  onPress={() => {
                    setInputText(label);
                    Haptics.selectionAsync();
                  }}
                >
                  <ThemedText type="caption" style={{ color: colors.textSecondary }}>
                    {label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          messages.map(renderMessage)
        )}
      </ScrollView>

      <View
        style={[
          styles.inputArea,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
          },
        ]}
      >
        {selectedImage && (
          <View style={styles.previewRow}>
            <Image
              source={{ uri: selectedImage }}
              style={[styles.previewThumb, { borderColor: colors.border }]}
            />
            <View style={styles.previewInfo}>
              <ThemedText type="caption" style={{ color: colors.textSecondary }}>
                Slika odabrana
              </ThemedText>
              <ThemedText type="caption" style={{ color: colors.textMuted }}>
                Spremi za slanje
              </ThemedText>
            </View>
            <TouchableOpacity onPress={() => setSelectedImage(null)} style={styles.removeBtn}>
              <Ionicons name="close" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.inputRow}>
          <TouchableOpacity
            style={[
              styles.mediaBtn,
              { backgroundColor: colors.inputBg, borderColor: colors.border },
            ]}
            onPress={() => pickImage(true)}
          >
            <Ionicons name="camera-outline" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.mediaBtn,
              { backgroundColor: colors.inputBg, borderColor: colors.border },
            ]}
            onPress={() => pickImage(false)}
          >
            <Ionicons name="image-outline" size={22} color={colors.textSecondary} />
          </TouchableOpacity>

          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: colors.inputBg,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            placeholder="Opiši problem..."
            placeholderTextColor={colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />

          <TouchableOpacity
            style={[
              styles.sendBtn,
              canSend
                ? [{ backgroundColor: colors.primary }, shadows.amberSm]
                : { backgroundColor: colors.surfaceRaised },
            ]}
            onPress={handleSend}
            disabled={!canSend}
            activeOpacity={0.85}
          >
            <Ionicons
              name={activeTaskId ? 'hourglass-outline' : 'arrow-up'}
              size={20}
              color={canSend ? colors.background : colors.textMuted}
            />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  chatContainer: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  chatEmpty: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.lg,
    justifyContent: 'center',
  },
  promptChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  userMsgWrap: {
    alignItems: 'flex-end',
    marginBottom: spacing.md,
  },
  userBubble: {
    maxWidth: '82%',
    borderRadius: borderRadius.lg,
    borderBottomRightRadius: borderRadius.xs,
    padding: spacing.md,
    gap: spacing.sm,
  },
  chatImage: {
    width: 220,
    height: 165,
    borderRadius: borderRadius.md,
  },
  userText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  aiMsgWrap: {
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    maxWidth: '92%',
  },
  errorBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  aiBubble: {
    padding: 0,
    overflow: 'hidden',
    width: '100%',
  },
  aiSection: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  aiSectionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 4,
  },
  divider: {
    height: 1,
    marginHorizontal: 0,
  },
  notRelevantRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    margin: spacing.md,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  toolsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  toolPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.xs,
    borderWidth: 1,
  },
  b2bBox: {
    margin: spacing.md,
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing.xs,
  },
  expertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 4,
  },
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 6,
    borderTopWidth: 1,
    paddingTop: spacing.xs,
    marginTop: 2,
  },
  inputArea: {
    borderTopWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? spacing.lg : spacing.sm,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  previewThumb: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  previewInfo: { flex: 1, gap: 2 },
  removeBtn: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  mediaBtn: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  textInput: {
    flex: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingTop: 12,
    paddingBottom: 12,
    maxHeight: 120,
    fontSize: 16,
    borderWidth: 1,
    lineHeight: 22,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
