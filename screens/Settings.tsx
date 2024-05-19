import { StatusBar } from 'expo-status-bar';
import { Text, View } from '../components/Themed';
import * as React from 'react';
import { StyleSheet, TextInput, Button, Keyboard, TouchableOpacity, ScrollView, KeyboardAvoidingView } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Picker } from '@react-native-picker/picker'
import { Platform } from 'react-native';


export default function SettingsScreen() {
  const [altitudeOffset, setAltitudeOffset] = React.useState("0");
  const [mapType, setMapType] = React.useState("standard");
  const keyAltitudeOffset = "altitudeOffset";
  const keyMapType = "mapType";

  async function saveAltitudeOffset() {
    let value = altitudeOffset;
    if (value == null || value == "")
      value = "0";
    await SecureStore.setItemAsync(keyAltitudeOffset, value);
  }

  async function saveMapType() {
    let value = mapType;
    if (!value || value == null || value == "")
      value = "standard";
    await SecureStore.setItemAsync(keyMapType, value);
  }

  async function getAltitudeOffset() {
    let result = await SecureStore.getItemAsync(keyAltitudeOffset);
    if (result) {
      setAltitudeOffset(result);
    } else {
      setAltitudeOffset("0");
    }
  }

  async function getMapType() {
    let result = await SecureStore.getItemAsync(keyMapType);
    if (result != null) {
      setMapType(result);
    } else {
      setMapType("standard");
    }
  }

  React.useEffect(() => {
    let isMounted = true;
    getAltitudeOffset();
    getMapType();
    return () => {
      isMounted = false;
    }
  }, []);

  function onChanged(text) {
    text = text.replace(',', '.');
    setAltitudeOffset(text);
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView>
        <View style={styles.container}>
          {/* {Add some TextInput components... } */}
          <View style={styles.item}>
            <Text style={styles.text}> Antenna mount height</Text>
            <TextInput
              style={styles.textInput}
              keyboardType='numeric'
              onChangeText={(text) => onChanged(text)}
              value={altitudeOffset.toString()}
              // onPressOut={() => Keyboard.dismiss()}
            />
            <Text style={styles.text}>m</Text>
          </View>

          <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />

          <View style={styles.item}>
            <Text style={styles.text}> Map type:</Text>
            <Picker
              selectedValue={mapType}
              mode="dropdown"
              itemStyle={{fontSize: 14}}
              style={{ color: 'red', flex: 0.5, borderRadius: 0, alignContent: 'center', alignSelf: 'center', justifyContent: 'center' }}
              onValueChange={(itemValue, itemIndex) => setMapType(itemValue)}
            >
              <Picker.Item label="Street" value="standard" />
              <Picker.Item label="Satellite" value="satellite" />
              <Picker.Item label="Hybrid" value="hybrid" />
            </Picker>
          </View>
          <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              saveAltitudeOffset();
              saveMapType();
            }}
          >
            <Text>Save</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    padding: 10,
    alignContent: 'center',
    alignSelf: 'center',
    justifyContent: 'center'
  },
  separator: {
    marginTop: 10,
    marginBottom: 10,
    height: 5,
    width: '80%',
  },
  textInput: {
    height: 40,
    color: 'red',
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
    width: 100,
    marginTop: 20,
    // flex: 1,
    // alignSelf: 'flex-end',
  },
  item: {
    flex: 0.1,
    marginTop: 20,
    flexDirection: 'row',
    alignContent: 'center',
    alignSelf: 'center',
    justifyContent: 'center'
  }
});
