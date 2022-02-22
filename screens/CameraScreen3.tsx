import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { StorageAccessFramework } from 'expo-file-system';
import { useState, useEffect } from 'react';

export default function App() {
    const [image, setImage] = useState(null)
  let openImagePickerAsync = async () => {
    let permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    let permissionResult2 = await ImagePicker.requestCameraPermissionsAsync();
    // const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
    if (permissionResult.granted === false) {
      alert('Permission to access camera roll is required!');
      return;
    }

    // ensureFolderExists() {
    //     const path = `${FileSystem.documentDirectory}MyFolder`;
    //     return FileSystem.getInfoAsync(path).then(({exists}) => {
    //       if (!exists) {
    //         return FileSystem.makeDirectoryAsync(path);
    //       } else {
    //         return Promise.resolve(true);
    //       }
    //     });
    //   };
    
    // ensureFolderExists().then(() => {

    // let pickerResult = await ImagePicker.launchImageLibraryAsync({

    let pickerResult = await ImagePicker.launchCameraAsync({
        // mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
        quality: 1,
        exif: true,
        base64:false,
      });
    pickerResult.exif["GPSLatitude"] = 14.0001;
    pickerResult.exif["GPSAltitude"] = 0;
    pickerResult.exif["GPSAltitudeRef"] = 0;
   pickerResult.exif["GPSDateStamp"] = "2022:02:20";
   pickerResult.exif["GPSLatitude"] = 14.0001;
   pickerResult.exif["GPSLatitudeRef"] = "N";
   pickerResult.exif["GPSLongitude"] = 16.121;
   pickerResult.exif["GPSLongitudeRef"] = "E";
   pickerResult.exif["GPSProcessingMethod"] = "NETWORK";
   pickerResult.exif["GPSTimeStamp"] = "20:26:06";
   Object.assign(pickerResult, {
    GPSLatitude: 1.12
   });
   
//    setImage(pickerResult);
    console.log(pickerResult);
    let options = {
        encoding : FileSystem.EncodingType.Base64
    }
    console.log(FileSystem.documentDirectory);
    // await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory + "MyFolder");
    // await FileSystem.writeAsStringAsync(FileSystem.documentDirectory + "MyFolder/1.jpg", pickerResult.base64, options);
    // let aavb = await FileSystem.getInfoAsync(FileSystem.documentDirectory + "MyFolder/1.jpg");
    // console.log(aavb);
    // console.log(FileSystem.documentDirectory + "MyFolder/1.jpg");
    // CameraRoll.saveToCameraRoll(pickerResult.uri);
    
    const asset = await MediaLibrary.createAssetAsync(pickerResult.uri).catch(console.error);
    const assetTestInfo = await MediaLibrary.getAssetInfoAsync(asset.id);
    console.log('Readed asset', assetTestInfo);
  };

  return (
    <View style={styles.container}>
      <Image source={{ uri: 'https://i.imgur.com/TkIrScD.png' }} style={styles.logo} />
      <Text style={styles.instructions}>
        To share a photo from your phone with a friend, just press the button below!
      </Text>

      <TouchableOpacity onPress={openImagePickerAsync} style={styles.button}>
        <Text style={styles.buttonText}>Pick a photo</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 305,
    height: 159,
    marginBottom: 20,
  },
  instructions: {
    color: '#888',
    fontSize: 18,
    marginHorizontal: 15,
    marginBottom: 10,
  },
  button: {
    backgroundColor: 'blue',
    padding: 20,
    borderRadius: 5,
  },
  buttonText: {
    fontSize: 20,
    color: '#fff',
  },
});
