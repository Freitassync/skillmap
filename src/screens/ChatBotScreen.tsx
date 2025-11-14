import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { TabParamList } from '../navigation/types';
import { useAuthContext } from '../contexts/AuthContext';
import ChatBotService, { type ChatMessage } from '../services/ChatBotService';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../constants';

type Props = {
  navigation: BottomTabNavigationProp<TabParamList, 'ChatBot'>;
};

/**
 * ChatBot Screen - NOVO LAYOUT SEM OVERLAY
 *
 * Estrutura Correta:
 * SafeAreaView
 *   └─ View (flex: 1, flexDirection: 'column')
 *       ├─ Header (fixo)
 *       ├─ FlatList (flex: 1 - CRESCE DINAMICAMENTE)
 *       ├─ Loading (opcional)
 *       └─ Input (FIXO no bottom com insets)
 *
 * GARANTIA: Input NUNCA fica abaixo do tab bar
 */
const ChatBotScreen: React.FC<Props> = ({ navigation }) => {
  const { usuario } = useAuthContext();
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    console.log('🤖 ChatBotScreen mounted', usuario?.nome || 'sem usuário');
    loadHistory();
  }, [usuario?.id]);

  const loadHistory = async () => {
    if (!usuario) {
      setIsLoadingHistory(false);
      return;
    }

    try {
      const history = await ChatBotService.loadChatHistory(usuario.id);
      if (history.length === 0) {
        setMessages([
          {
            id: 'welcome',
            role: 'assistant',
            content: `Olá ${usuario.nome}! 👋 Como posso ajudar?`,
            timestamp: new Date(),
          },
        ]);
      } else {
        setMessages(history);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar histórico:', error);
    } finally {
      setIsLoadingHistory(false);
      // Auto scroll
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 50);
    }
  };

  const handleSend = useCallback(async () => {
    if (!inputText.trim() || !usuario || isLoading) return;

    const userMsg = inputText.trim();
    setMessages((p) => [
      ...p,
      {
        id: `msg_${Date.now()}`,
        role: 'user',
        content: userMsg,
        timestamp: new Date(),
      },
    ]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await ChatBotService.sendMessage(userMsg, usuario.id);
      if (response) {
        setMessages((p) => [...p, response]);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
      }
    } catch (error) {
      console.error('❌ Erro:', error);
      setMessages((p) => [
        ...p,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          content: 'Erro ao enviar. Tente novamente.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [inputText, usuario, isLoading]);

  const handleClear = async () => {
    if (!usuario) return;
    try {
      await ChatBotService.clearChatHistory(usuario.id);
      await loadHistory();
    } catch (error) {
      console.error('❌ Erro ao limpar:', error);
    }
  };

  if (isLoadingHistory) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.brand.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView 
      style={[
        styles.root,
        { paddingBottom: 0 } // Tab bar agora não é absolute, não precisa compensar
      ]} 
      edges={['top']}
    >
      {/* TOP HEADER - FIXO */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>💬 Assistente IA</Text>
          <Text style={styles.subtitle}>24/7 Online</Text>
        </View>
        <TouchableOpacity onPress={handleClear} style={styles.btnClear}>
          <Text style={styles.btnClearText}>Limpar</Text>
        </TouchableOpacity>
      </View>

      {/* MESSAGES - FLEX GROW (preenche o espaço) */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isUser = item.role === 'user';
          return (
            <View style={[styles.msgRow, isUser && styles.msgRowUser]}>
              <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
                <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>
                  {item.content}
                </Text>
                <Text style={[styles.time, isUser && styles.timeUser]}>
                  {new Date(item.timestamp).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            </View>
          );
        }}
        contentContainerStyle={styles.msgList}
        scrollEnabled={true}
        keyboardShouldPersistTaps="handled"
      />

      {/* LOADING - se estiver enviando */}
      {isLoading && (
        <View style={styles.loading}>
          <ActivityIndicator size="small" color={COLORS.brand.primary} />
          <Text style={styles.loadingText}>Digitando...</Text>
        </View>
      )}

      {/* INPUT AREA - FIXO NO BOTTOM */}
      <View style={styles.inputArea}>
        <TextInput
          style={styles.input}
          placeholder="Digite..."
          placeholderTextColor={COLORS.text.muted}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
          editable={!isLoading}
          scrollEnabled
        />
        <TouchableOpacity
          style={[
            styles.btnSend,
            (!inputText.trim() || isLoading) && styles.btnSendDisabled,
          ]}
          onPress={handleSend}
          disabled={!inputText.trim() || isLoading}
        >
          <Text style={styles.btnSendText}>➤</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // CONTAINER RAIZ - A CHAVE DO FIX
  root: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: COLORS.bg.primary,
  },

  // TOP HEADER
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.base,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bg.secondary,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  btnClear: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    backgroundColor: COLORS.bg.secondary,
    borderRadius: RADIUS.sm,
  },
  btnClearText: {
    color: COLORS.brand.primary,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },

  // MESSAGES LIST - FLEX GROW
  msgList: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.base,
    flexGrow: 1,
  },
  msgRow: {
    flexDirection: 'row',
    marginBottom: SPACING.base,
    justifyContent: 'flex-start',
  },
  msgRowUser: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
  },
  bubbleUser: {
    backgroundColor: COLORS.brand.primary,
  },
  bubbleBot: {
    backgroundColor: COLORS.bg.secondary,
  },
  bubbleText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    lineHeight: 20,
    color: COLORS.text.primary,
  },
  bubbleTextUser: {
    color: COLORS.bg.primary,
  },
  time: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text.muted,
    marginTop: 4,
  },
  timeUser: {
    color: `${COLORS.bg.primary}99`,
    textAlign: 'right',
  },

  // LOADING
  loading: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.secondary,
    fontStyle: 'italic',
  },

  // INPUT AREA - FIXO NO BOTTOM
  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.base,
    paddingBottom: SPACING.base,
    borderTopWidth: 1,
    borderTopColor: COLORS.bg.secondary,
    gap: SPACING.sm,
    backgroundColor: COLORS.bg.primary,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.bg.secondary,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text.primary,
    maxHeight: 100,
  },
  btnSend: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnSendDisabled: {
    backgroundColor: COLORS.bg.secondary,
    opacity: 0.5,
  },
  btnSendText: {
    fontSize: 20,
    color: COLORS.bg.primary,
  },

  // UTILITY
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatBotScreen;
