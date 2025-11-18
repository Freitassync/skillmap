import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { TabParamList } from '../navigation/types';
import { useAuthContext } from '../contexts/AuthContext';
import ChatBotService, { type ChatMessage } from '../services/ChatBotService';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../constants';
import Markdown from 'react-native-markdown-display';

type Props = {
  navigation: BottomTabNavigationProp<TabParamList, 'ChatBot'>;
};

const SUGGESTION_CHIPS = [
  'Como criar um roadmap?',
  'Quais skills aprender primeiro?',
  'Dicas para iniciantes em programação',
  'Como acelerar meu aprendizado?',
  'Como ganhar mais XP?',
  'Qual a diferença entre hard e soft skills?',
];

/**
 * ChatBot Screen - NOVO LAYOUT SEM OVERLAY
 *
 * Estrutura Correta:
 * SafeAreaView
 *   └─ View (flex: 1, flexDirection: 'column')
 *       ├─ Header (fixo)
 *       ├─ FlatList (flex: 1 - CRESCE DINAMICAMENTE)
 *       ├─ Suggestions (mostradas quando chat vazio)
 *       ├─ Loading (opcional)
 *       └─ Input (FIXO no bottom com insets)
 *
 * GARANTIA: Input NUNCA fica abaixo do tab bar
 */
const ChatBotScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuthContext();
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadHistory();
  }, [user?.id]);

  const loadHistory = async () => {
    if (!user) {
      setIsLoadingHistory(false);
      return;
    }

    try {
      const history = await ChatBotService.loadChatHistory(user.id);
      if (history.length === 0) {
        setMessages([
          {
            id: 'welcome',
            role: 'assistant',
            content: `Olá ${user.name}! Como posso ajudar?`,
            timestamp: new Date(),
          },
        ]);
      } else {
        setMessages(history);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setIsLoadingHistory(false);
      // Auto scroll
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 50);
    }
  };

  const handleSend = useCallback(async (messageText?: string) => {
    const textToSend = messageText || inputText.trim();
    if (!textToSend || !user || isLoading) return;

    // Oculta sugestões após primeiro envio
    setShowSuggestions(false);

    const userMsg = textToSend;
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
      const response = await ChatBotService.sendMessage(user.id, userMsg);
      if (response) {
        setMessages((p) => [...p, response]);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
      }
    } catch (error) {
      console.error('Erro:', error);
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
  }, [inputText, user, isLoading]);

  /**
   * Envia sugestão como mensagem
   */
  const handleSuggestionPress = useCallback((suggestion: string) => {
    // Remove emoji do início para texto limpo
    const cleanText = suggestion.replace(/^[\u{1F300}-\u{1F9FF}]\s*/u, '');
    handleSend(cleanText);
  }, [handleSend]);

  const handleClear = async () => {
    if (!user) return;
    try {
      await ChatBotService.clearChatHistory(user.id);
      await loadHistory();
    } catch (error) {
      console.error('Erro ao limpar:', error);
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
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Assistente IA</Text>
          <Text style={styles.subtitle}>24/7 Online</Text>
        </View>
        <TouchableOpacity onPress={handleClear} style={styles.btnClear}>
          <Text style={styles.btnClearText}>Limpar</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isUser = item.role === 'user';
          return (
            <View style={[styles.msgRow, isUser && styles.msgRowUser]}>
              <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
                {isUser ? (
                  <Text style={[styles.bubbleText, styles.bubbleTextUser]}>
                    {item.content}
                  </Text>
                ) : (
                  <Markdown
                    style={{
                      body: {
                        color: COLORS.text.primary,
                        fontSize: TYPOGRAPHY.fontSize.base,
                        lineHeight: 20,
                      },
                      paragraph: {
                        marginTop: 0,
                        marginBottom: 4,
                      },
                      code_inline: {
                        backgroundColor: COLORS.bg.tertiary,
                        color: COLORS.brand.primary,
                        paddingHorizontal: 4,
                        paddingVertical: 2,
                        borderRadius: 4,
                        fontSize: TYPOGRAPHY.fontSize.sm,
                      },
                      code_block: {
                        backgroundColor: COLORS.bg.tertiary,
                        padding: SPACING.sm,
                        borderRadius: RADIUS.sm,
                        fontSize: TYPOGRAPHY.fontSize.sm,
                      },
                      fence: {
                        backgroundColor: COLORS.bg.tertiary,
                        padding: SPACING.sm,
                        borderRadius: RADIUS.sm,
                      },
                      bullet_list: {
                        marginBottom: 4,
                      },
                      ordered_list: {
                        marginBottom: 4,
                      },
                      list_item: {
                        marginBottom: 2,
                      },
                      strong: {
                        fontWeight: TYPOGRAPHY.fontWeight.bold,
                      },
                      em: {
                        fontStyle: 'italic',
                      },
                      link: {
                        color: COLORS.brand.primary,
                      },
                    }}
                  >
                    {item.content}
                  </Markdown>
                )}
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

      {isLoading && (
        <View style={styles.loading}>
          <ActivityIndicator size="small" color={COLORS.brand.primary} />
          <Text style={styles.loadingText}>Digitando...</Text>
        </View>
      )}

      {showSuggestions && messages.length <= 1 && !isLoading && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>Perguntas sugeridas</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestionsList}
          >
            {SUGGESTION_CHIPS.map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionChip}
                onPress={() => handleSuggestionPress(suggestion)}
                activeOpacity={0.7}
              >
                <Text style={styles.suggestionChipText}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

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
          onPress={() => handleSend()}
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

  // SUGGESTIONS
  suggestionsContainer: {
    paddingVertical: SPACING.base,
    borderTopWidth: 1,
    borderTopColor: COLORS.bg.secondary,
    backgroundColor: COLORS.bg.primary,
  },
  suggestionsTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text.secondary,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  suggestionsList: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  suggestionChip: {
    backgroundColor: COLORS.bg.secondary,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.brand.primary + '33',
  },
  suggestionChipText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.brand.primary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
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
