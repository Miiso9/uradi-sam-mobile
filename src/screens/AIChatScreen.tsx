import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Linking,
  Platform,
  Alert,
  StatusBar,
  Modal,
  FlatList,
  ActivityIndicator,
  Dimensions,
  ListRenderItemInfo,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  useAnimatedKeyboard,
} from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { supabase } from '../services/supabase';
import { api } from '../services/api';
import { Chat } from '../types';
import { ThemedText } from '../components/ThemedText';
import { ThemedCard } from '../components/ThemedCard';
import { useTheme } from '../context/ThemeContext';
import { AnimatedLoader } from '../components/AnimatedLoader';
import { spacing, borderRadius, shadows } from '../utils/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const DRAWER_WIDTH = SCREEN_WIDTH * 0.75;

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

interface ApiMessage {
  id: string | number;
  role: string;
  content?: string;
  image_url?: string;
  ai_data?: AIResult;
}

export default function AIChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [chatHistory, setChatHistory] = useState<Chat[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isLoadingChat, setIsLoadingChat] = useState(false);

  const flatListRef = useRef<FlatList<Message>>(null);
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const keyboard = useAnimatedKeyboard();

  const animatedSpacerStyle = useAnimatedStyle(() => {
    return {
      height: keyboard.height.value,
    };
  });

  const drawerTranslateX = useSharedValue(-DRAWER_WIDTH);
  const backdropOpacity = useSharedValue(0);

  const drawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: drawerTranslateX.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const openSidebar = useCallback(() => {
    setIsSidebarVisible(true);
    fetchChatHistory();
    drawerTranslateX.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) });
    backdropOpacity.value = withTiming(0.6, { duration: 300 });
  }, []);

  const closeSidebar = useCallback(() => {
    drawerTranslateX.value = withTiming(-DRAWER_WIDTH, {
      duration: 250,
      easing: Easing.in(Easing.ease),
    });
    backdropOpacity.value = withTiming(0, { duration: 250 });
    setTimeout(() => {
      setIsSidebarVisible(false);
    }, 260);
  }, []);

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          style={{ marginLeft: spacing.md, marginRight: spacing.sm }}
          onPress={() => {
            Haptics.selectionAsync();
            openSidebar();
          }}
        >
          <Ionicons name="menu" size={26} color={colors.text} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, colors, openSidebar]);

  const fetchChatHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await api.get('/api/v1/chats');
      setChatHistory(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const startNewChat = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMessages([]);
    setCurrentChatId(null);
    setActiveTaskId(null);
    closeSidebar();
  }, [closeSidebar]);

  const loadChat = useCallback(
    async (chatId: string) => {
      closeSidebar();
      setIsLoadingChat(true);
      setMessages([]);
      setCurrentChatId(chatId);
      setActiveTaskId(null);
      setSelectedImage(null);
      setInputText('');

      try {
        const response = await api.get(`/api/v1/chats/${chatId}`);
        const chatData = response.data;

        if (chatData?.messages) {
          const loadedMessages: Message[] = chatData.messages.map((msg: ApiMessage) => ({
            id: msg.id.toString(),
            role: msg.role === 'user' ? 'user' : 'ai',
            text: msg.content,
            imageUri: msg.image_url || undefined,
            aiData: msg.ai_data || undefined,
          }));
          setMessages(loadedMessages);
        }
      } catch (error) {
        console.error(error);
        Alert.alert('Greška', 'Nije moguće učitati razgovor.');
      } finally {
        setIsLoadingChat(false);
      }
    },
    [closeSidebar],
  );

  useFocusEffect(
    useCallback(() => {
      return () => setSelectedImage(null);
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

        if (!isMounted) return;

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
        if (!isMounted) return;
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

  const pickImage = useCallback(async (useCamera: boolean) => {
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
  }, []);

  const handleSend = useCallback(async () => {
    if ((!inputText && !selectedImage) || activeTaskId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const textToSend = inputText;
    const imageToSend = selectedImage;
    const userMessageId = Date.now().toString();
    const aiMessageId = (Date.now() + 1).toString();

    setInputText('');
    setSelectedImage(null);

    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });

    setMessages((prev) => [
      ...prev,
      { id: userMessageId, role: 'user', text: textToSend, imageUri: imageToSend || undefined },
      { id: aiMessageId, role: 'ai', isLoading: true },
    ]);

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

      if (currentChatId) formData.append('chat_id', currentChatId);

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
        if (data.chat_id && !currentChatId) setCurrentChatId(data.chat_id);
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
  }, [inputText, selectedImage, activeTaskId, currentChatId]);

  const renderEmptyState = useCallback(
    () => (
      <View style={styles.emptyStateContainer}>
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
      </View>
    ),
    [colors],
  );

  const renderMessage = useCallback(
    ({ item: msg }: ListRenderItemInfo<Message>) => {
      if (msg.role === 'user') {
        return (
          <View style={styles.userMsgWrap}>
            <View style={[styles.userBubble, { backgroundColor: colors.primary }, shadows.amberSm]}>
              {msg.imageUri && <Image source={{ uri: msg.imageUri }} style={styles.chatImage} />}
              {msg.text ? (
                <Text style={[styles.userText, { color: isDark ? colors.background : '#FFFFFF' }]}>
                  {msg.text}
                </Text>
              ) : null}
            </View>
          </View>
        );
      }

      if (msg.isLoading) {
        return (
          <View style={styles.aiMsgWrap}>
            <AnimatedLoader />
          </View>
        );
      }

      if (msg.isError) {
        return (
          <View style={styles.aiMsgWrap}>
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
          <View style={styles.aiMsgWrap}>
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
                          {
                            backgroundColor: `${colors.error}10`,
                            borderColor: `${colors.error}30`,
                          },
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
    },
    [colors, isDark],
  );

  const canSend = (!!inputText || !!selectedImage) && !activeTaskId;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <Modal
        visible={isSidebarVisible}
        transparent
        animationType="none"
        onRequestClose={closeSidebar}
      >
        <View style={StyleSheet.absoluteFill}>
          <Animated.View
            style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }, backdropStyle]}
          >
            <TouchableOpacity style={{ flex: 1 }} onPress={closeSidebar} activeOpacity={1} />
          </Animated.View>

          <Animated.View
            style={[styles.drawerContent, { backgroundColor: colors.surface }, drawerStyle]}
          >
            <View style={[styles.drawerHeader, { paddingTop: insets.top + spacing.md }]}>
              <TouchableOpacity
                style={[styles.newChatBtn, { backgroundColor: colors.primary }]}
                onPress={startNewChat}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={20} color={isDark ? colors.background : '#FFFFFF'} />
                <ThemedText
                  type="button"
                  style={{ color: isDark ? colors.background : '#FFFFFF', fontSize: 15 }}
                >
                  Novi popravak
                </ThemedText>
              </TouchableOpacity>
            </View>

            <View style={{ flex: 1, paddingHorizontal: spacing.md, marginTop: spacing.md }}>
              <ThemedText
                type="label"
                style={{ marginBottom: spacing.sm, color: colors.textSecondary }}
              >
                POVIJEST POPRAVAKA
              </ThemedText>

              {isLoadingHistory ? (
                <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
              ) : chatHistory.length === 0 ? (
                <ThemedText
                  type="caption"
                  style={{ color: colors.textMuted, marginTop: spacing.sm }}
                >
                  Još nemaš spremljenih razgovora.
                </ThemedText>
              ) : (
                <FlatList
                  data={chatHistory}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => {
                    const isSelected = item.id === currentChatId;
                    return (
                      <TouchableOpacity
                        style={[
                          styles.historyItem,
                          isSelected && { backgroundColor: `${colors.primary}15` },
                        ]}
                        onPress={() => {
                          Haptics.selectionAsync();
                          loadChat(item.id);
                        }}
                      >
                        <Ionicons
                          name={isSelected ? 'chatbubble' : 'chatbubble-outline'}
                          size={18}
                          color={isSelected ? colors.primary : colors.textSecondary}
                        />
                        <View style={{ flex: 1 }}>
                          <ThemedText
                            type="bodyMedium"
                            numberOfLines={1}
                            style={{ color: isSelected ? colors.primary : colors.text }}
                          >
                            {item.title || 'Popravak...'}
                          </ThemedText>
                          <ThemedText
                            type="caption"
                            style={{ color: colors.textMuted, fontSize: 11 }}
                          >
                            {new Date(item.created_at).toLocaleDateString('hr-HR')}
                          </ThemedText>
                        </View>
                      </TouchableOpacity>
                    );
                  }}
                />
              )}
            </View>
          </Animated.View>
        </View>
      </Modal>

      {isLoadingChat ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : messages.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          ref={flatListRef}
          inverted
          data={[...messages].reverse()}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.chatContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}

      <View
        style={[
          styles.inputArea,
          { backgroundColor: colors.surface, borderTopColor: colors.border },
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
              { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text },
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
              color={canSend ? (isDark ? colors.background : '#FFFFFF') : colors.textMuted}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* NEVIDLJIVI ŠTIT: Ovdje je magija za fluidni swipe-back! */}
      <Animated.View style={[{ backgroundColor: colors.surface }, animatedSpacerStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  drawerContent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  drawerHeader: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128,128,128,0.2)',
  },
  newChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: 12,
    borderRadius: borderRadius.md,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  chatContainer: { padding: spacing.md, paddingBottom: spacing.sm, flexGrow: 1 },
  emptyStateContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', paddingHorizontal: spacing.xl },
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
  userMsgWrap: { alignItems: 'flex-end', marginBottom: spacing.md },
  userBubble: {
    maxWidth: '82%',
    borderRadius: borderRadius.lg,
    borderBottomRightRadius: borderRadius.xs,
    padding: spacing.md,
    gap: spacing.sm,
  },
  chatImage: { width: 220, height: 165, borderRadius: borderRadius.md },
  userText: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  aiMsgWrap: { alignItems: 'flex-start', marginBottom: spacing.md, maxWidth: '92%' },
  errorBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  errorText: { fontSize: 14, flex: 1, lineHeight: 20 },
  aiBubble: { padding: 0, overflow: 'hidden', width: '100%' },
  aiSection: { padding: spacing.md, gap: spacing.xs },
  aiSectionLabel: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: 4 },
  divider: { height: 1, marginHorizontal: 0 },
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
  toolsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
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
  expertRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 4 },
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
  previewThumb: { width: 52, height: 52, borderRadius: borderRadius.sm, borderWidth: 1 },
  previewInfo: { flex: 1, gap: 2 },
  removeBtn: { width: 28, height: 28, justifyContent: 'center', alignItems: 'center' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs },
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
