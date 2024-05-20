import { StatusBar } from 'expo-status-bar';
import { ListViewBase, Platform, StyleSheet } from 'react-native';

import EditScreenInfo from '../components/EditScreenInfo';
import { Text, View } from '../components/Themed';

export default function ModalCamera3Screen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Instrukcja:</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      <View>
        <Text style={styles.text}>1. Udostępnić internet poprzez hotspot WiFi z telefonu (5Ghz).</Text>
        <Text style={styles.text}>2. Włączyć urządzenie i połączyć je do udostępnionej sieci.</Text>
        <Text style={styles.text}>3. Sprawdzić IP urządzenia (widoczne na górnym pasku po kliknięciu na ikonkę transmisji danych)</Text>
        <Text style={styles.text}>4. Wpisać IP urządzenia w polu "Server IP" w ustawieniach tej aplikacji </Text>
        <Text style={styles.text}>4. Uruchomić GeotagPhoneApp z pulpitu urządzenia </Text>
        {/* Use a light status bar on iOS to account for the black space above the modal */}
      </View>
      <Text style={styles.title}>Uwagi:</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      {/* <EditScreenInfo path="/screens/ModalScreen.tsx" /> */}
      <View>
        <Text style={styles.text}>1. Hotspot WiFi ustawić na 5Ghz, w przeciwnym wypadku zdjęcia będą przesyłane znacznie wolniej.</Text>
        <Text style={styles.text}>2. Aplikacja zapisuje pozycję GPS od razu po wciśnięciu przycisku.</Text>
        <Text style={styles.text}>3. Zakładki Camera I oraz Camera II można używać zamiennie, trzeba tylko sprawdzić czy zdjęcia są wykonywane w pełnej rozdzielczości.</Text>
        <Text style={styles.text}>4. Na urządzeniach z Android'em zdjęcia wykonane Camera II są dodatkowo zapisywane w pamięci cache urządzenia, więc sporadycznie trzeba go wyczyścić (Ustawienia -> Aplikacje -> Expo Go -> Pamięć -> Wyczyść pamięć (podręczną).</Text>
        <Text style={styles.text}>5. Kontakt w razie pytań lub problemów z aplikacją: krzysztof.cwian@gmail.com</Text>
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
  text: {
    fontSize: 16,
    padding:10
  },
  separator: {
    marginVertical: 10,
    height: 1,
    width: '80%',
  },
});
