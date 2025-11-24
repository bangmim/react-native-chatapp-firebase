import {faMicrophone, faStop} from '@fortawesome/free-solid-svg-icons';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import React, {useCallback, useRef, useState} from 'react';

import {StyleSheet, TouchableOpacity} from 'react-native';
import AudioRecorderPlayer, {
  AudioEncoderAndroidType,
  AVEncodingOption,
} from 'react-native-audio-recorder-player';
import Colors from '../modules/Colors';

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    borderColor: Colors.BLACK,
    width: 50,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

interface MicButtonProps {
  onRecorded: (path: string) => void;
}

const MicButton = ({onRecorded}: MicButtonProps) => {
  const [recording, setRecording] = useState(false);
  const audioRecorderPlayerRef = useRef(new AudioRecorderPlayer());

  const startRecord = useCallback(async () => {
    // if (Platform.OS === 'android') {
    //   const writeStatus = await request(
    //     PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
    //   );
    //   const readStatus = await request(
    //     PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
    //   );
    //   const grants = await PermissionsAndroid.request(
    //     PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    //   );

    //   const granted =
    //     grants === PermissionsAndroid.RESULTS.GRANTED &&
    //     writeStatus === RESULTS.GRANTED &&
    //     readStatus === RESULTS.GRANTED;
    //   console.log('writeStatus :', writeStatus);
    //   console.log('readStatus :', readStatus);
    //   if (!granted) {
    //     return;
    //   }
    // }
    await audioRecorderPlayerRef.current.startRecorder(undefined, {
      AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
      AVFormatIDKeyIOS: AVEncodingOption.aac,
    });
    audioRecorderPlayerRef.current.addRecordBackListener(() => {});
    setRecording(true);
  }, []);

  const stopRecord = useCallback(async () => {
    const uri = await audioRecorderPlayerRef.current.stopRecorder();
    audioRecorderPlayerRef.current.removeRecordBackListener();
    setRecording(false);
    onRecorded(uri);
  }, [onRecorded]);

  if (recording) {
    return (
      <TouchableOpacity style={styles.button} onPress={stopRecord}>
        <FontAwesomeIcon icon={faStop} size={30} color={Colors.BLACK} />
      </TouchableOpacity>
    );
  }
  return (
    <TouchableOpacity style={styles.button} onPress={startRecord}>
      <FontAwesomeIcon icon={faMicrophone} size={30} color={Colors.BLACK} />
    </TouchableOpacity>
  );
};

export default MicButton;
