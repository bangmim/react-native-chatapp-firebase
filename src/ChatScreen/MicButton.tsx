import {faMicrophone, faStop} from '@fortawesome/free-solid-svg-icons';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import React, {useCallback, useRef, useState} from 'react';

import {
  Alert,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import AudioRecorderPlayer, {
  AudioEncoderAndroidType,
  AVEncodingOption,
} from 'react-native-audio-recorder-player';
import {PERMISSIONS, RESULTS, request} from 'react-native-permissions';
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
    // Android / iOS 모두에서 녹음 권한을 먼저 요청합니다.
    if (Platform.OS === 'android') {
      const audioStatus = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      );

      const granted = audioStatus === PermissionsAndroid.RESULTS.GRANTED;
      if (!granted) {
        Alert.alert(
          '마이크 권한 필요',
          '음성 메시지를 보내려면 마이크 권한이 필요합니다.\n설정 > 앱 > 권한에서 마이크를 허용해 주세요.',
        );
        // 권한이 없으면 녹음을 시작하지 않습니다.
        return;
      }
    } else {
      const microphoneStatus = await request(PERMISSIONS.IOS.MICROPHONE);

      if (microphoneStatus !== RESULTS.GRANTED) {
        Alert.alert(
          '마이크 권한 필요',
          '음성 메시지를 보내려면 마이크 권한이 필요합니다.\n설정 앱에서 마이크 권한을 허용해 주세요.',
        );
        // 권한이 없으면 녹음을 시작하지 않습니다.
        return;
      }
    }

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
