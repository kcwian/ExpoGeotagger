import { StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import React, { useState, useEffect } from 'react';
import EditScreenInfo from '../components/EditScreenInfo';
import { Text, View } from '../components/Themed';
import { Camera } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import Constants from "expo-constants";
import { AutoFocus } from 'expo-camera/build/Camera.types';


export default function CameraScreen() {
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraRef, setCameraRef] = useState(null)
  const [mediaRef, setMediaRef] = useState(MediaLibrary)
  const [type, setType] = useState(Camera.Constants.Type.back);

  useEffect(() => {
    (async () => {
      const res1 = await Camera.requestCameraPermissionsAsync();
      const res = await MediaLibrary.requestPermissionsAsync(false)
      setHasPermission(res.granted && res1.granted);
    })();
  }, []);

  if (hasPermission === null) {
    return <View />;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  let takePicture = async () => {

    const { manifest } = Constants;
    const serverUri = `http://${manifest.debuggerHost.split(':').shift()}:5000`;
    if (cameraRef) {
      let photo = await cameraRef.takePictureAsync({
        exif: true,
        autoFocus: Camera.Constants.AutoFocus.on,
      }).then().catch(console.error);

      let localUri = photo.uri;
      let filename = localUri.split('/').pop();

      // Infer the type of the image
      let match = /\.(\w+)$/.exec(filename);
      let type = match ? `image/${match[1]}` : `image`;

      // Upload the image using the fetch and FormData APIs
      let formData = new FormData();
      // Assume "photo" is the name of the form field the server expects
      formData.append('image', { uri: localUri, name: filename, type });
      console.log("Fetching image");
      let response = await fetch(serverUri + '/image', {
        method: 'POST',
        body: formData,
        headers: {
          'content-type': 'multipart/form-data',
        },
      });
      let json = await response.json();
      let base64Code = json["base64"];
      let imageName = json['name']
      const filenameImage = FileSystem.documentDirectory + imageName;
      await FileSystem.writeAsStringAsync(filenameImage, base64Code, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const mediaResult = await MediaLibrary.createAssetAsync(filenameImage);
      console.log(mediaResult);
      console.log("Saved", filenameImage);
    }
  };
  return (
    <View style={styles.container}>
      <Camera style={styles.camera} type={type} ref={ref => { setCameraRef(ref) }} autoFocus={Camera.Constants.AutoFocus.on}  flashMode={Camera.Constants.FlashMode.auto}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={
              takePicture
              // setType(
              //   type === Camera.Constants.Type.back
              //     ? Camera.Constants.Type.front
              //     : Camera.Constants.Type.back
              // );
            }>
            <Text style={styles.text}> Photo </Text>
          </TouchableOpacity>
        </View>
      </Camera>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    margin: 10,
  },
  button: {
    flex: 1,
    alignSelf: 'flex-end',
    alignItems: 'center',
    height: "40%", // Pressable area
    justifyContent:'flex-end'

  },
  text: {
    fontSize: 18,
    color: 'white',
  },
});
