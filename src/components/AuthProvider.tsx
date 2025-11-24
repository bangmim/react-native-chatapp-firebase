import React, {useCallback, useEffect, useMemo, useState} from 'react';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import {Collections, User} from '../types';
import AuthContext from './AuthContext';
import storage from '@react-native-firebase/storage';
import _ from 'lodash';

const AuthProvider = ({children}: {children: React.ReactNode}) => {
  const [initialized, setInitialized] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [processingSignup, setProcessingSignup] = useState(false);
  const [processingSignin, setProcessingSignin] = useState(false);

  useEffect(() => {
    const unsubscribe = auth().onUserChanged(async fbUser => {
      console.log(fbUser);
      if (fbUser !== null) {
        // login
        setUser({
          userId: fbUser.uid,
          email: fbUser.email ?? '',
          name: fbUser.displayName ?? '',
          profileUrl: fbUser.photoURL ?? '',
        });
      } else {
        // logout
        setUser(null);
      }
    });
    setInitialized(true);
    return () => {
      unsubscribe();
    };
  }, []);

  const signup = useCallback(
    async (email: string, password: string, name: string) => {
      setProcessingSignup(true);
      try {
        const {user: currentUser} = await auth().createUserWithEmailAndPassword(
          email,
          password,
        );
        await currentUser.updateProfile({displayName: name});
        await firestore()
          .collection(Collections.USERS)
          .doc(currentUser.uid)
          .set({userId: currentUser.uid, email, name});
      } finally {
        setProcessingSignup(false);
      }
    },
    [],
  );
  const signin = useCallback(async (email: string, password: string) => {
    setProcessingSignin(true);
    try {
      await auth().signInWithEmailAndPassword(email, password);
    } finally {
      setProcessingSignin(false);
    }
  }, []);

  const updateProfileImage = useCallback(
    async (filePath: string) => {
      if (user == null) {
        throw new Error('user is undefined!');
      }

      const filename = _.last(filePath.split('/'));

      if (filename == null) {
        throw new Error('filename is undefined');
      }

      const storageFilepath = `users/${user.userId}/${filename}`;
      await storage().ref(storageFilepath).putFile(filePath);
      const url = await storage().ref(storageFilepath).getDownloadURL();
      await auth().currentUser?.updateProfile({photoURL: url});
      await firestore()
        .collection(Collections.USERS)
        .doc(user.userId)
        .update({profileUrl: url});
    },
    [user],
  );

  const value = useMemo(() => {
    return {
      initialized,
      user,
      signup,
      processingSignup,
      signin,
      processingSignin,
      updateProfileImage,
    };
  }, [
    initialized,
    user,
    signup,
    processingSignup,
    signin,
    processingSignin,
    updateProfileImage,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
