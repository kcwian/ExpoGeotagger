import { StatusBar } from 'expo-status-bar';
import { ListViewBase, Platform, StyleSheet } from 'react-native';

import EditScreenInfo from '../components/EditScreenInfo';
import { Text, View } from '../components/Themed';

export default function ModalCamera3Screen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Uwagi:</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      {/* <EditScreenInfo path="/screens/ModalScreen.tsx" /> */}
      <View>
        <Text style={styles.text}>1. Aplikacja zapisuje pozycję GPS od razu po wciśnięciu przycisku.</Text>
        <Text style={styles.text}>2. Zakładki Camera I oraz Camera II można używać zamiennie, trzeba tylko sprawdzić czy zdjęcia są wykonywane w pełnej rozdzielczości.</Text>
        <Text style={styles.text}>3. Na urządzeniach z Android'em zdjęcia wykonane Camera II są dodatkowo zapisywane w pamięci cache urządzenia, więc sporadycznie trzeba go wyczyścić (Ustawienia -> Aplikacje -> Expo Go -> Pamięć -> Wyczyść pamięć (podręczną).</Text>
        {/* Use a light status bar on iOS to account for the black space above the modal */}
      </View>
      {/* <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} /> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  text: {
    fontSize: 16,
    padding:10
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});
