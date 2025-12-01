import {useCallback, useEffect, useState} from 'react';
import {Chat, Collections, Message, User} from '../types';
import firestore, {
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';
import _ from 'lodash';
import storage from '@react-native-firebase/storage';

const getChatKey = (userIds: string[]) => {
  // 특정 property에 따라 정렬할 수 있게 도와줌
  return _.orderBy(userIds, userId => userId, 'asc');
};

const useChat = (userIds: string[]) => {
  const [chat, setChat] = useState<Chat | null>(null);
  const [loadingChat, setLoadingChat] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sending, setSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const addNewMessages = useCallback((newMessages: Message[]) => {
    // 중복방지! sendMessage에서도 메시지가 업데이트되기때문 -> lodash 를 이용하여 같은 메시지를 없애도록
    setMessages(prevMessages => {
      return _.uniqBy(newMessages.concat(prevMessages), m => m.id);
    });
  }, []);

  const loadUsers = async (uids: string[]) => {
    const usersSnapshot = await firestore()
      .collection(Collections.USERS)
      .where('userId', 'in', uids)
      .get();
    const users = usersSnapshot.docs.map(doc => doc.data() as User);
    return users;
  };

  const loadChat = useCallback(async () => {
    try {
      setLoadingChat(true);
      // 생성방이 있는지 체크!
      const chatSnapshot = await firestore()
        .collection(Collections.CHATS)
        .where('userIds', '==', getChatKey(userIds))
        .get();
      if (chatSnapshot.docs.length > 0) {
        const doc = chatSnapshot.docs[0];
        const chatUserIds = doc.data().userIds as string[];
        const users = await loadUsers(chatUserIds);

        setChat({
          id: doc.id,
          userIds: chatUserIds,
          users: users,
        });
        return;
      }
      // 채팅방 생성
      const users = await loadUsers(userIds);

      const data = {
        userIds: getChatKey(userIds),
        users,
      };
      const doc = await firestore().collection(Collections.CHATS).add(data);
      setChat({id: doc.id, ...data});
    } finally {
      setLoadingChat(false);
    }
  }, [userIds]);

  useEffect(() => {
    loadChat();
  }, [loadChat]);

  const sendMessage = useCallback(
    async (text: string, user: User) => {
      if (chat?.id == null) {
        throw new Error('Chat is not loaded');
      }
      try {
        setSending(true);
        const doc = await firestore()
          .collection(Collections.CHATS)
          .doc(chat.id)
          .collection(Collections.MESSAGES)
          .add({
            text: text,
            user: user,
            createdAt: firestore.FieldValue.serverTimestamp(), // db 저장은 서버 시간으로
          });
        addNewMessages([
          {
            id: doc.id,
            text: text,
            imageUrl: null,
            audioUrl: null,
            user: user,
            createdAt: new Date(), // 로컬에서는 유저의 시간으로 (db에서 사용되는 시간을 가져올 수 없다)
          },
        ]);
      } finally {
        setSending(false);
      }
    },
    [chat?.id, addNewMessages],
  );

  useEffect(() => {
    if (chat?.id == null) {
      return;
    }
    setLoadingMessages(true);
    // messages가 변경될 때마다 호출됨
    const unsubscribe = firestore()
      .collection(Collections.CHATS)
      .doc(chat.id)
      .collection(Collections.MESSAGES)
      .orderBy('createdAt', 'desc')
      .onSnapshot(snapshot => {
        // snapshot 이 null 이 될 수 있으므로 방어 코드 추가
        if (!snapshot || snapshot.metadata?.hasPendingWrites) {
          return;
        }
        const newMessages = snapshot
          .docChanges()
          .filter(({type}) => type === 'added')
          .map(docChange => {
            const {doc} = docChange;
            const docData = doc.data();
            const createdAt =
              docData.createdAt?.toDate != null
                ? docData.createdAt.toDate()
                : new Date();
            const newMessage: Message = {
              id: doc.id,
              text: docData.text ?? null,
              // 과거 필드명(imgaeUrl)과 새 필드명(imageUrl)을 모두 지원
              imageUrl: docData.imageUrl ?? docData.imgaeUrl ?? null,
              audioUrl: docData.audioUrl ?? null,
              user: docData.user,
              createdAt,
            };
            return newMessage;
          });
        addNewMessages(newMessages);
        setLoadingMessages(false);
      });
    return () => {
      // useEffect가 호출되거나 언마운트 될 때 호출된다
      unsubscribe();
    };
  }, [chat?.id, addNewMessages]);

  const updateMessageReadAt = useCallback(
    async (userId: string) => {
      if (chat == null) {
        return null;
      }
      firestore()
        .collection(Collections.CHATS)
        .doc(chat.id)
        .update({
          [`userToMessageReadAt.${userId}`]:
            firestore.FieldValue.serverTimestamp(), // 모든 유저가 동일한 시간으로 비교해야하므로 서버 시간을 사용한다
        });
    },
    [chat],
  );
  const [userToMessageReadAt, setUserToMessageReadAt] = useState<{
    [userId: string]: Date;
  }>({});
  //실시간 업데이트가 필요
  useEffect(() => {
    if (chat == null) {
      return;
    }
    // chat에 변경이 있을 때마다 업데이트가 이루어짐
    const unsubscribe = firestore()
      .collection(Collections.CHATS)
      .doc(chat.id)
      .onSnapshot(snapshot => {
        if (!snapshot || snapshot.metadata?.hasPendingWrites) {
          // 로컬 변경 되었을 때 또는 snapshot 이 없는 경우에는 업데이트 무시
          return;
        }
        const chatData = snapshot.data() ?? {}; //data가 null일 수도 있으므로
        const userToMessageReadTimestamp =
          (chatData.userToMessageReadAt as {
            [userId: string]: FirebaseFirestoreTypes.Timestamp;
          }) ?? {};

        const userToMessageReadDate = _.mapValues(
          // mapValue : 오브젝트에서 value에 해당되는 것을 return 및 변경할 수 있게 해준다
          userToMessageReadTimestamp,
          updateMessageReadTimestamp => updateMessageReadTimestamp.toDate(),
        );
        setUserToMessageReadAt(userToMessageReadDate);
        return () => unsubscribe();
      });
  }, [chat]);

  const sendImageMessage = useCallback(
    async (filePath: string, user: User) => {
      setSending(true);
      try {
        if (chat == null) {
          throw new Error('Undefined chat');
        }
        if (user == null) {
          throw new Error('Undefined user');
        }

        const originalFilename = _.last(filePath.split('/'));
        if (originalFilename == null) {
          throw new Error('Undefined filename');
        }
        // file - 확장자명 변경
        const fileExt = originalFilename.split('.')[1];
        const filename = `${Date.now()}.${fileExt}`; // 이름이 중복될 경우가 적다
        const storagePath = `chat/${chat.id}/${filename}`;
        await storage().ref(storagePath).putFile(filePath); // 이미지를 서버에 저장
        const url = await storage().ref(storagePath).getDownloadURL();

        const doc = await firestore()
          .collection(Collections.CHATS)
          .doc(chat.id)
          .collection(Collections.MESSAGES)
          .add({
            // 새 필드명(imageUrl)을 기본으로 사용하고, 과거 필드명(imgaeUrl)도 함께 기록
            imageUrl: url,
            imgaeUrl: url,
            user: user,
            createdAt: firestore.FieldValue.serverTimestamp(),
          });
        addNewMessages([
          {
            id: doc.id,
            text: null,
            imageUrl: url,
            audioUrl: null,
            user: user,
            createdAt: new Date(),
          },
        ]);
      } finally {
        setSending(false);
      }
    },
    [addNewMessages, chat],
  );
  const sendAudioMessage = useCallback(
    async (filePath: string, user: User) => {
      setSending(true);
      try {
        if (chat == null) {
          throw new Error('Undefined Chat');
        }
        if (filePath == null) {
          throw new Error('Undefined FilePath');
        }
        const originalFilename = _.last(filePath.split('/'));
        if (originalFilename == null) {
          throw new Error('Undefined filename');
        }
        const fileExt = originalFilename.split('.')[1];
        const filename = `${Date.now()}.${fileExt}`;
        const storagePath = `chat/${chat.id}/${filename}`;
        await storage().ref(storagePath).putFile(filePath);
        const url = await storage().ref(storagePath).getDownloadURL();
        const doc = await firestore()
          .collection(Collections.CHATS)
          .doc(chat.id)
          .collection(Collections.MESSAGES)
          .add({
            audioUrl: url,
            user: user,
            createdAt: firestore.FieldValue.serverTimestamp(),
          });
        addNewMessages([
          {
            id: doc.id,
            text: null,
            imageUrl: null,
            audioUrl: url,
            user: user,
            createdAt: new Date(),
          },
        ]);
      } finally {
        setSending(false);
      }
    },
    [addNewMessages, chat],
  );
  return {
    chat,
    loadingChat,
    sendMessage,
    messages,
    sending,
    loadingMessages,
    updateMessageReadAt,
    userToMessageReadAt,
    sendImageMessage,
    sendAudioMessage,
  };
};

export default useChat;
