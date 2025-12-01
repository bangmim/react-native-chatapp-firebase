import dayjs from 'dayjs';
import React, {useCallback} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import Colors from '../modules/Colors';
import UserPhoto from '../components/UserPhoto';
import ImageMessage from './ImageMessage';
import AudioMessage from './AudioMessage';

interface TextMessage {
  text: string;
}
interface ImageMessageContent {
  url: string;
}
interface AudioMessageContent {
  audioUrl: string;
}

type ChatMessage = TextMessage | ImageMessageContent | AudioMessageContent;

interface MessageProps {
  name: string;
  message: ChatMessage;
  createdAt: Date;
  isOtherMessage: boolean;
  userImageUrl?: string;
  unreadCount: number;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
    flex: 1,
  },
  nameText: {fontSize: 12, color: Colors.GRAY, marginBottom: 4},
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  timeText: {fontSize: 12, color: Colors.GRAY},
  bubble: {
    backgroundColor: Colors.BLACK,
    padding: 12,
    borderRadius: 12,
    // 컨텐츠가 모두 보이도록 해준다
    flexShrink: 1,
  },
  messageText: {fontSize: 14, color: Colors.WHITE},
  root: {flexDirection: 'row'},
  userPhoto: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  unreadCountText: {fontSize: 12, color: Colors.GRAY},
  metaInfo: {
    marginRight: 4,
    alignItems: 'flex-end',
  },
});

const otherMessageStyles = {
  container: [styles.container, {alignItems: 'flex-start' as const}],
  bubble: [styles.bubble, {backgroundColor: Colors.LIGHT_GRAY}],
  messageText: [styles.messageText, {color: Colors.BLACK}],
  timeText: [styles.timeText],
  metaInfo: [
    styles.metaInfo,
    {marginLeft: 4, alignItems: 'flex-start' as const},
  ],
};

const Message = ({
  name,
  message,
  createdAt,
  isOtherMessage,
  userImageUrl,
  unreadCount,
}: MessageProps) => {
  const messageStyles = isOtherMessage ? otherMessageStyles : styles;

  const renderMessage = useCallback(() => {
    if ('text' in message) {
      return <Text style={messageStyles.messageText}>{message.text}</Text>;
    }
    if ('url' in message) {
      return <ImageMessage url={message.url} />;
    }
    if ('audioUrl' in message) {
      return <AudioMessage url={message.audioUrl} />;
    }
    return null;
  }, [message, messageStyles.messageText]);

  const renderMessageContainer = useCallback(() => {
    const components = [
      <View key="metaInfo" style={messageStyles.metaInfo}>
        {unreadCount > 0 && (
          <Text style={styles.unreadCountText}>{unreadCount} </Text>
        )}
        <Text key={'timeText'} style={otherMessageStyles.timeText}>
          {dayjs(createdAt).format('HH:mm')}
        </Text>
      </View>,
      <View key={'message'} style={messageStyles.bubble}>
        {renderMessage()}
      </View>,
    ];
    return isOtherMessage ? components.reverse() : components;
  }, [createdAt, messageStyles, isOtherMessage, unreadCount, renderMessage]);

  return (
    <View style={styles.root}>
      {isOtherMessage && (
        <UserPhoto
          style={styles.userPhoto}
          imageUrl={userImageUrl}
          name={name}
          size={34}
        />
      )}
      <View style={messageStyles.container}>
        <Text style={styles.nameText}>{name} </Text>
        <View style={styles.messageContainer}>{renderMessageContainer()}</View>
      </View>
    </View>
  );
};

export default Message;
