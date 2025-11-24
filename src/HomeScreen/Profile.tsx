import React, {useMemo} from 'react';
import {
  Image,
  ImageStyle,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import Colors from '../modules/Colors';

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.GRAY,
    overflow: 'hidden', // 이미지가 넘칠 때 가리기
  },
});

interface ProfileProps {
  size?: number;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  imageUrl?: string;
  text?: string;
  textStyle?: StyleProp<TextStyle>;
}
const Profile = ({
  size = 48,
  style: containerStyleProp,
  onPress,
  imageUrl,
  text,
  textStyle,
}: ProfileProps) => {
  const containerStyle = useMemo<StyleProp<ViewStyle>>(() => {
    // 외부에서 스타일을 받아온다면 그것을 사용, 없으면 현재 스타일
    return [
      styles.container,
      {width: size, height: size, borderRadius: size / 2},
      containerStyleProp,
    ];
  }, [containerStyleProp, size]);
  const imageStyle = useMemo<StyleProp<ImageStyle>>(
    () => ({width: size, height: size}),
    [size],
  );
  return (
    <TouchableOpacity onPress={onPress} disabled={onPress == null}>
      <View style={containerStyle}>
        {imageUrl ? (
          <Image source={{uri: imageUrl}} style={imageStyle} />
        ) : text ? (
          <Text style={textStyle}>{text} </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

export default Profile;
