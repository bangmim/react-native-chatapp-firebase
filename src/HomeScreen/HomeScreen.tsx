import React, {useCallback, useContext, useEffect, useState} from 'react';
import Screen from '../components/Screen';
import AuthContext from '../components/AuthContext';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Colors from '../modules/Colors';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {Collections, RootStackParamList, User} from '../types';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import ImageCropPicker from 'react-native-image-crop-picker';
import Profile from './Profile';
import UserPhoto from '../components/UserPhoto';

const styles = StyleSheet.create({
  container: {flex: 1, padding: 20},
  sectionTitleText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: Colors.BLACK,
  },
  userSectionContent: {
    backgroundColor: Colors.BLACK,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    flexDirection: 'row',
  },
  myProfile: {flex: 1},

  myNameText: {color: Colors.WHITE, fontSize: 16, fontWeight: 'bold'},
  myEmailText: {color: Colors.WHITE, fontSize: 14, marginTop: 4},
  logoutText: {color: Colors.WHITE, fontSize: 14},
  userListSection: {flex: 1, marginTop: 40},
  loadingContainer: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  userList: {flex: 1},
  userListItem: {
    backgroundColor: Colors.LIGHT_GRAY,
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  otherNameText: {fontSize: 16, fontWeight: 'bold', color: Colors.BLACK},
  otherEmailText: {marginTop: 4, fontSize: 14, color: Colors.BLACK},
  separator: {height: 10},
  emptyText: {color: Colors.BLACK},
  profile: {
    marginRight: 10,
  },
  userPhoto: {
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

const HomeScreen = () => {
  const {user: me, updateProfileImage} = useContext(AuthContext);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [users, setUsers] = useState<User[]>([]);

  const {navigate} =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const onPressLogout = useCallback(() => {
    auth().signOut();
  }, []);
  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const snapshot = await firestore().collection(Collections.USERS).get();
      setUsers(
        snapshot.docs
          .map(doc => doc.data() as User)
          .filter(u => u.userId !== me?.userId),
      );
    } finally {
      setLoadingUsers(false);
    }
  }, [me?.userId]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const renderLoading = useCallback(
    () => (
      <View style={styles.loadingContainer}>
        <ActivityIndicator />
      </View>
    ),
    [],
  );
  const onPressProfile = useCallback(async () => {
    try {
      //이미지 선택
      const image = await ImageCropPicker.openPicker({
        cropping: true,
        cropperCircleOverlay: true,
      });
      console.log('image :', image);
      await updateProfileImage(image.path);
    } catch (error: any) {
      // 사용자가 단순 취소한 경우는 무시
      if (error?.code === 'E_PICKER_CANCELLED') {
        return;
      }
      // 권한 거절 또는 기타 오류에 대한 안내
      Alert.alert(
        '사진 접근 권한 필요',
        '프로필 이미지를 변경하려면 사진/갤러리 접근 권한이 필요합니다.\n설정에서 권한을 확인해 주세요.',
      );
    }
  }, [updateProfileImage]);

  if (me == null) {
    return null;
  }

  return (
    <Screen title="홈">
      <View style={styles.container}>
        <View>
          <Text style={styles.sectionTitleText}>나의 정보</Text>
          <View style={styles.userSectionContent}>
            <Profile
              style={styles.profile}
              onPress={onPressProfile}
              imageUrl={me.profileUrl}
            />
            <View style={styles.myProfile}>
              <Text style={styles.myNameText}>{me.name}</Text>
              <Text style={styles.myEmailText}>{me.email}</Text>
            </View>
            <TouchableOpacity onPress={onPressLogout}>
              <Text style={styles.logoutText}>로그아웃</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.userListSection}>
          {loadingUsers ? (
            renderLoading()
          ) : (
            <>
              <Text style={styles.sectionTitleText}>
                다른 사용자와 대화해보세요!
              </Text>
              <FlatList
                data={users}
                style={styles.userList}
                renderItem={({item: user}) => (
                  <TouchableOpacity
                    style={styles.userListItem}
                    onPress={() => {
                      navigate('Chat', {
                        userIds: [me.userId, user.userId],
                        other: user,
                      });
                    }}>
                    <UserPhoto
                      style={styles.userPhoto}
                      imageUrl={user.profileUrl}
                      name={user.name}
                    />
                    <View>
                      <Text style={styles.otherNameText}>{user.name}</Text>
                      <Text style={styles.otherEmailText}>{user.email}</Text>
                    </View>
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                ListEmptyComponent={() => {
                  return (
                    <Text style={styles.emptyText}> 사용자가 없습니다</Text>
                  );
                }}
              />
            </>
          )}
        </View>
      </View>
    </Screen>
  );
};

export default HomeScreen;
