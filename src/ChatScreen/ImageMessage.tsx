import React, {useCallback, useMemo, useState} from 'react';
import {Image, StyleSheet, TouchableOpacity} from 'react-native';
import ImageView from 'react-native-image-viewing';

interface ImageMessageProps {
  url: string;
}
const styles = StyleSheet.create({image: {width: 100, height: 100}});

const ImageMessage = ({url}: ImageMessageProps) => {
  const [viewerVisible, setViewerVisible] = useState(false);
  const images = useMemo(() => (url != null ? [{uri: url}] : []), [url]);
  const showImageViewr = useCallback(() => {
    setViewerVisible(true);
  }, []);
  return (
    <>
      <TouchableOpacity onPress={showImageViewr}>
        <Image source={{uri: url}} style={styles.image} resizeMode="contain" />
      </TouchableOpacity>
      <ImageView
        images={images}
        imageIndex={0}
        visible={viewerVisible}
        onRequestClose={() => setViewerVisible(false)}
      />
    </>
  );
};

export default ImageMessage;
