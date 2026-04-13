import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../src/tokens/colors';

const SetupScreen = () => {
  return (
    <View style={styles.root}>
      <Text style={styles.text}>Setup — coming next PR</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.brandDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 16,
    color: colors.white,
  },
});

export default SetupScreen;
