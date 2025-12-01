import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import Screen from '../components/Screen';
import {RouteProp, useRoute} from '@react-navigation/native';
import {RootStackParamList} from '../types';
import useChat from './useChat';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Colors from '../modules/Colors';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {faPaperPlane} from '@fortawesome/free-regular-svg-icons';
import AuthContext from '../components/AuthContext';
import Message from './Message';
import UserPhoto from '../components/UserPhoto';
import dayjs from 'dayjs';
import {faImage} from '@fortawesome/free-solid-svg-icons';
import ImageCropPicker from 'react-native-image-crop-picker';
import MicButton from './MicButton';
const styles = StyleSheet.create({
  container: {flex: 1},
  loadingContainer: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  chatContainer: {flex: 1, padding: 20},
  membersSection: {},
  membersTitleText: {
    fontSize: 16,
    color: Colors.BLACK,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  userProfile: {
    backgroundColor: Colors.BLACK,
    width: 34,
    height: 34,
    borderRadius: 34 / 2,
    borderWidth: 1,
    borderColor: Colors.LIGHT_GRAY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userProfileText: {
    color: Colors.WHITE,
    textAlign: 'center',
  },
  messageList: {flex: 1, marginVertical: 20},
  inputContainer: {flexDirection: 'row', alignItems: 'center'},
  textInputContainer: {
    flex: 1,
    marginRight: 10,
    borderRadius: 24,
    borderColor: Colors.BLACK,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 10,
    minHeight: 50,
    justifyContent: 'center',
  },
  textInput: {padding: 0},
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.BLACK,
    width: 50,
    height: 50,
    borderRadius: 50 / 2,
  },
  sendText: {color: Colors.WHITE},
  messageSeparator: {height: 8},
  imageButton: {
    borderWidth: 1,
    borderColor: Colors.BLACK,
    width: 50,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    marginRight: 8,
  },
  sendingContainer: {
    paddingTop: 10,
    alignItems: 'flex-end',
  },
});

const disabledSendButtonStyle = [
  styles.sendButton,
  {backgroundColor: Colors.GRAY},
];

const ChatScreen = () => {
  const {params} = useRoute<RouteProp<RootStackParamList, 'Chat'>>();
  const {other, userIds} = params;
  const {
    chat,
    loadingChat,
    sendMessage,
    messages,
    loadingMessages,
    updateMessageReadAt,
    userToMessageReadAt,
    sendImageMessage,
    sending,
    sendAudioMessage,
  } = useChat(userIds);
  const [text, setText] = useState('');
  const {user: me} = useContext(AuthContext);
  const loading = loadingChat || loadingMessages;

  useEffect(() => {
    if (me !== null && messages.length > 0) {
      updateMessageReadAt(me?.userId);
    }
  }, [me, messages.length, updateMessageReadAt]);

  const onChangeText = useCallback((newText: string) => {
    setText(newText);
  }, []);

  const sendDisabled = useMemo(() => text.length === 0, [text]);
  const onPressSendButton = useCallback(() => {
    if (me !== null) {
      sendMessage(text, me);
      setText('');
    }
  }, [me, sendMessage, text]);
  const onPressImageButton = useCallback(async () => {
    if (me != null) {
      try {
        const image = await ImageCropPicker.openPicker({cropping: true});
        sendImageMessage(image.path, me);
      } catch (error: any) {
        if (error?.code === 'E_PICKER_CANCELLED') {
          return;
        }
        Alert.alert(
          '사진 접근 권한 필요',
          '이미지 메시지를 보내려면 사진/갤러리 접근 권한이 필요합니다.\n설정에서 권한을 확인해 주세요.',
        );
      }
    }
  }, [sendImageMessage, me]);

  const onRecorded = useCallback(
    (path: string) => {
      if (me !== null) {
        Alert.alert('녹음 완료', '음성 메시지를 보낼까요?', [
          {text: '아니오'},
          {
            text: '네',
            onPress: () => {
              console.log(path);
              sendAudioMessage(path, me);
            },
          },
        ]);
      }
    },
    [sendAudioMessage, me],
  );
  const renderChat = useCallback(() => {
    if (chat == null) {
      return null;
    }
    return (
      <View style={styles.chatContainer}>
        <View style={styles.membersSection}>
          <Text style={styles.membersTitleText}>대화상대</Text>
          <FlatList
            data={chat.users}
            horizontal
            renderItem={({item: user}) => (
              <UserPhoto
                size={34}
                style={styles.userProfile}
                name={user.name}
                nameStyle={styles.userProfileText}
                imageUrl={user.profileUrl}
              />
            )}
          />
        </View>

        <FlatList
          inverted
          showsVerticalScrollIndicator={false}
          style={styles.messageList}
          data={messages}
          renderItem={({item: message}) => {
            const user = chat.users.find(u => u.userId === message.user.userId);
            const unreadUsers = chat.users.filter(u => {
              const messageReadAt = userToMessageReadAt[u.userId] ?? null;
              if (messageReadAt == null) {
                return true;
              }
              return dayjs(messageReadAt).isBefore(message.createdAt);
            });
            const unreadCount = unreadUsers.length;

            const commonProps = {
              name: user?.name ?? '',
              createdAt: message.createdAt,
              isOtherMessage: message.user.userId !== me?.userId,
              userImageUrl: user?.profileUrl ?? '',
              unreadCount: unreadCount,
            };

            if (message.text != null) {
              return (
                <Message {...commonProps} message={{text: message.text}} />
              );
            }
            if (message.imageUrl !== null) {
              return (
                <Message {...commonProps} message={{url: message.imageUrl}} />
              );
            }
            if (message.audioUrl !== null) {
              return (
                <Message
                  {...commonProps}
                  message={{audioUrl: message.audioUrl}}
                />
              );
            }
            return null;
          }}
          ItemSeparatorComponent={() => (
            <View style={styles.messageSeparator} />
          )}
          ListHeaderComponent={() => {
            if (sending) {
              return (
                <View style={styles.sendingContainer}>
                  <ActivityIndicator />
                </View>
              );
            }
            return null;
          }}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
          style={styles.inputContainer}>
          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.textInput}
              value={text}
              onChangeText={onChangeText}
              multiline
            />
          </View>
          <TouchableOpacity
            disabled={sendDisabled}
            onPress={onPressSendButton}
            style={sendDisabled ? disabledSendButtonStyle : styles.sendButton}>
            <FontAwesomeIcon
              icon={faPaperPlane}
              size={24}
              color={Colors.WHITE}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.imageButton}
            onPress={onPressImageButton}>
            <FontAwesomeIcon icon={faImage} size={32} color={Colors.BLACK} />
          </TouchableOpacity>
          <View>
            <MicButton onRecorded={onRecorded} />
          </View>
        </KeyboardAvoidingView>
      </View>
    );
  }, [
    chat,
    text,
    onChangeText,
    sendDisabled,
    onPressSendButton,
    messages,
    me?.userId,
    userToMessageReadAt,
    onPressImageButton,
    sending,
    onRecorded,
  ]);

  return (
    <Screen title={other.name}>
      <View style={styles.container}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator />
          </View>
        ) : (
          renderChat()
        )}
      </View>
    </Screen>
  );
};

export default ChatScreen;
