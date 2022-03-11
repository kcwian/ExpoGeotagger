import { StatusBar } from 'expo-status-bar';
import { Text, View } from '../components/Themed';
import * as React from 'react';
import {StyleSheet, TextInput, Button, Keyboard, TouchableOpacity } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export default function SettingsScreen() {
  const [key, onChangeKey] = React.useState('Your key here');
  const [value, onChangeValue] = React.useState('Your value here');
  const [altitudeOffset, setAltitudeOffset] = React.useState("0");
  const keyAltitudeOffset = "altitudeOffset";

  async function save(key, value) {
    if(!value)
      value = "0";
    await SecureStore.setItemAsync(key, value);
  }

  React.useEffect(() => {
    let isMounted = true;
    getValueForAltitude(keyAltitudeOffset);
    return () => {
      isMounted = false;
    }
  }, []);

  async function getValueForAltitude(key) {
    let result = await SecureStore.getItemAsync(key);
    if (result) {
      setAltitudeOffset(result);
    } else {
      setAltitudeOffset("0");
    }
  }

  function onChanged(text) {
    text = text.replace(',', '.');
    setAltitudeOffset(text);
  }

  return (
    <View style={styles.container}>
      {/* {Add some TextInput components... } */}
      <View style={{ flex: 0.1, marginTop: 20, flexDirection: 'row', alignContent: 'center', alignSelf: 'center', justifyContent: 'center' }}>
        <Text style={styles.text}> Antenna mount height</Text>
        <TextInput
          style={styles.textInput}
          keyboardType='numeric'
          onChangeText={(text) => onChanged(text)}
          value={altitudeOffset.toString()}
          onPressOut={() => Keyboard.dismiss()}
        />
        <Text style={styles.text}>m</Text>
      </View>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          save(keyAltitudeOffset, altitudeOffset);
          setAltitudeOffset(altitudeOffset);
        }}
      >
        <Text>Save</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
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
  textInput: {
    height: 40,
    // margin: 12,
    borderWidth: 1,
    padding: 10,
  },
  text2: {
    color: '#000',
    fontSize: 18,
    marginHorizontal: 15,
    // marginBottom: 10,
  },
  button: {
    backgroundColor: "#00A0FF",
    padding: 20,
    borderRadius: 5,
    alignItems: 'center',
    width:100,
    // flex: 1,
    // alignSelf: 'flex-end',
  },
});
