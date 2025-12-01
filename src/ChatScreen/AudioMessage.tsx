import React, {useCallback, useEffect, useRef, useState} from 'react';
import {StyleSheet, TouchableOpacity} from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import Colors from '../modules/Colors';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {faPause, faPlay} from '@fortawesome/free-solid-svg-icons';

interface AudioMessageProps {
  url: string;
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  text: {
    color: Colors.WHITE,
  },
});

const AudioMessage = ({url}: AudioMessageProps) => {
  const audioRecorderPlayerRef = useRef(new AudioRecorderPlayer());
  const [playing, setPlaying] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);

  const stop = useCallback(async () => {
    try {
      await audioRecorderPlayerRef.current.stopPlayer();
      audioRecorderPlayerRef.current.removePlayBackListener();
    } catch {
      // ignore
    } finally {
      setPlaying(false);
      setHasPlayed(false);
    }
  }, []);

  const togglePlay = useCallback(async () => {
    if (playing) {
      // 현재 재생 중이면 일시정지
      try {
        await audioRecorderPlayerRef.current.pausePlayer();
      } catch {
        // ignore
      } finally {
        setPlaying(false);
      }
      return;
    }
    try {
      if (!hasPlayed) {
        // 처음 재생
        await audioRecorderPlayerRef.current.startPlayer(url);
        audioRecorderPlayerRef.current.addPlayBackListener(e => {
          // Android 에서 duration 이 약간 덜 채워지거나 0인 경우가 있어서
          // 약간의 오차(tolerance)를 두고, duration 이 0보다 클 때만 종료로 판단
          const toleranceMs = 300;
          if (e.duration > 0 && e.currentPosition >= e.duration - toleranceMs) {
            // 재생이 끝나면 자동으로 정지 상태로 전환
            stop();
          }
          return;
        });
        setHasPlayed(true);
      } else {
        // 일시정지 후 재개
        await audioRecorderPlayerRef.current.resumePlayer();
      }
      setPlaying(true);
    } catch {
      setPlaying(false);
    }
  }, [playing, hasPlayed, stop, url]);

  useEffect(() => {
    return () => {
      // cleanup when component unmounts
      stop();
    };
  }, [stop]);

  return (
    <TouchableOpacity onPress={togglePlay} style={styles.button}>
      {playing ? (
        <FontAwesomeIcon icon={faPause} size={30} color={Colors.WHITE} />
      ) : (
        <FontAwesomeIcon icon={faPlay} size={30} color={Colors.WHITE} />
      )}
    </TouchableOpacity>
  );
};

export default AudioMessage;
