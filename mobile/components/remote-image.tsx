import { Image, type ImageStyle } from 'expo-image';
import { ActivityIndicator, View, type StyleProp } from 'react-native';
import { useEffect, useState } from 'react';

type RemoteImageProps = {
  uri: string;
  style: StyleProp<ImageStyle>;
  accessibilityLabel?: string;
};

export function RemoteImage({ uri, style, accessibilityLabel }: RemoteImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
  }, [uri]);

  // Show placeholder if URI is empty or invalid
  if (!uri || hasError) {
    return (
      <View style={[style, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#e1e8e3' }]}>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#c8d0cc' }} />
      </View>
    );
  }

  return (
    <View style={style}>
      {isLoading && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: '#e1e8e3' }}>
          <ActivityIndicator size="small" color="#52605a" />
        </View>
      )}
      <Image
        accessibilityLabel={accessibilityLabel}
        cachePolicy="memory-disk"
        contentFit="cover"
        recyclingKey={uri}
        source={{ uri }}
        style={{ width: '100%', height: '100%' }}
        transition={150}
        onLoadStart={() => {
          setIsLoading(true);
          setHasError(false);
        }}
        onLoad={() => setIsLoading(false)}
        onError={(error) => {
          console.log('Image load error:', error, 'URI:', uri);
          setIsLoading(false);
          setHasError(true);
        }}
      />
    </View>
  );
}
