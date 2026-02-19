import { Text, View, StyleSheet } from 'react-native';

interface Props {
  countryCode: string;
  size?: number;
}

function countryCodeToEmoji(code: string): string {
  const codePoints = code
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export function CountryFlag({ countryCode, size = 16 }: Props) {
  return (
    <View style={styles.container}>
      <Text style={{ fontSize: size }}>{countryCodeToEmoji(countryCode)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { justifyContent: 'center', alignItems: 'center' },
});
