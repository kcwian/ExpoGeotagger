import { StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import React, { useState, useEffect } from 'react';
import EditScreenInfo from '../components/EditScreenInfo';
import { Text, View } from '../components/Themed';
import { Camera } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import Constants from "expo-constants";
import { AutoFocus } from 'expo-camera/build/Camera.types';
import { FancyAlert } from 'react-native-expo-fancy-alerts';

export default function CameraScreen() {
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraRef, setCameraRef] = useState(null)
  const [mediaRef, setMediaRef] = useState(MediaLibrary)
  const [type, setType] = useState(Camera.Constants.Type.back);
  const [errorVisible, setErrorVisible] = React.useState(false);
  const [gpsStatus, setGPSStatus] = useState(null)

  const toggleErrorAlert = React.useCallback(() => {
    setErrorVisible(!errorVisible);
  }, [errorVisible]);
  const [succesVisible, setSuccesVisible] = React.useState(false);
  const toggleSuccesAlert = React.useCallback(() => {
    setSuccesVisible(!succesVisible);
  }, [succesVisible]);

  useEffect(() => {
    (async () => {
      const res1 = await Camera.requestCameraPermissionsAsync();
      const res = await MediaLibrary.requestPermissionsAsync(false)
      setHasPermission(res.granted && res1.granted);
    })();
  }, []);

    useEffect(() => {
      
    const interval = setInterval(() => {
      console.log('Fitst Camera');
      getGPSStatus();
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const { manifest } = Constants;
  const serverUri = `http://${manifest.debuggerHost.split(':').shift()}:5000`;

  let getGPSStatus = async () => {
      //GET request
      fetch(serverUri + '/dgps', {
        method: 'GET',
      })
        .then((response) => response.json())
        //If response is in json then in success
        .then((responseJson) => {
          //Success
          setGPSStatus(responseJson["status"]);
        })
        //If response is not in json then in error
        .catch((error) => {
          //Error
          // alert(JSON.stringify(error));
          // console.error(error);
          setGPSStatus("Connection error");
        });
  };

  let takePicture = async () => {

    if (cameraRef) {
      // let sizes = cameraRef.getAvailablePictureSizesAsync('4:3');
      // const ratios = await cameraRef.getSupportedRatiosAsync();
      // for (const ratio of ratios) {
      //   console.log(ratio);
      // }
      // const sizes =
      // let strings = [ ... ]
    //  let promises =  cameraRef.getAvailablePictureSizesAsync();
    //   Promise.all(promises).then(results => {
    // // results is a new array of results corresponding to the "promised" results
    // console.log(results);
    // for (res in results){
    //   console.log(res);
    // }
    //   });
      let photo = await cameraRef.takePictureAsync({
        exif: true,
        autoFocus: Camera.Constants.AutoFocus.on,
        // ratio: "4:3",
        quality: 1,
        // pictureSize: 
      }).then().catch(console.error);
      let localUri = photo.uri;
      let filename = localUri.split('/').pop();
      // console.log("Photo uri:",localUri);
      // console.log("Filename", filename);
      // Infer the type of the image
      let match = /\.(\w+)$/.exec(filename);
      let type = match ? `image/${match[1]}` : `image`;

      // Upload the image using the fetch and FormData APIs
      let formData = new FormData();
      // Assume "photo" is the name of the form field the server expects
      formData.append('image', { uri: localUri, name: filename, type });
      console.log("Sending image");
      fetch(serverUri + '/image', {
        method: 'POST',
        body: formData,
        headers: {
          'content-type': 'multipart/form-data',
        },
      }).then(response => {
        response.json().then(json => {
          let base64Code = json["base64"];
          let imageName = json['name']
          console.log("Received image");
          const filenameImage = FileSystem.documentDirectory + imageName;
          FileSystem.writeAsStringAsync(filenameImage, base64Code, {
            encoding: FileSystem.EncodingType.Base64,
          }).then(() => {
            console.log("Saved to SDCard")
            console.log(filenameImage);
            MediaLibrary.createAssetAsync(filenameImage).then(() => {
              FileSystem.deleteAsync(localUri);
              FileSystem.deleteAsync(filenameImage);
              toggleSuccesAlert();
              console.log("Deleted cache");
            });
          });
        });
      }).catch((error) => {
        FileSystem.deleteAsync(localUri);
        console.log("Deleted cache");
        console.log(error);
        // alert("No connection to image server. Photo was not saved");
        toggleErrorAlert();
      });
      // let json = await response.json();
      // let base64Code = json["base64"];
      // let imageName = json['name']
      // const filenameImage = FileSystem.documentDirectory + imageName;
      // await FileSystem.writeAsStringAsync(filenameImage, base64Code, {
      //   encoding: FileSystem.EncodingType.Base64,
      // });
      // console.log("FilenameImage:", filenameImage)
      // const mediaResult = await MediaLibrary.createAssetAsync(filenameImage);
      // // Delete from cache
      // await FileSystem.deleteAsync(localUri);
      // // console.log(mediaResult);
      // console.log("Saved", filenameImage);
    }
  };
  
  if (hasPermission === null) {
    return <View />;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

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
            <Text style={styles.text}> GPS Status {gpsStatus} </Text>
          </TouchableOpacity>
        </View>
      </Camera>
      <FancyAlert
        visible={errorVisible}
        // onRequestClose={() => { toggleErrorAlert() }}
        icon={<View style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'red',
          borderRadius: 50,
          width: '100%',
        }}><Text>✖</Text></View>}
        style={{ backgroundColor: 'white' }}>
        <Text style={{ marginTop: -16, marginBottom: 32 }}>Image not saved</Text>
        <TouchableOpacity style={styles.btnError} onPress={toggleErrorAlert}>
          <Text style={styles.btnText}>OK</Text>
        </TouchableOpacity>
      </FancyAlert>

      <FancyAlert
        visible={succesVisible}
        // onRequestClose={() => { toggleErrorAlert() }}
        icon={<View style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'green',
          borderRadius: 50,
          width: '100%',
        }}><Text>✔</Text></View>}
        style={{ backgroundColor: 'white' }}>
        <Text style={{ marginTop: -16, marginBottom: 32 }}>Image saved</Text>
        <TouchableOpacity style={styles.btnSucces} onPress={toggleSuccesAlert}>
          <Text style={styles.btnText}>OK</Text>
        </TouchableOpacity>
      </FancyAlert>
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
    backgroundColor: 'rgba(128,128,128,0.5)',
    height: "20%", // Pressable area
    justifyContent:'center'
  },
  text: {
    fontSize: 14,
    color: 'white',
  },
  btnError: {
    borderRadius: 32,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    alignSelf: 'stretch',
    backgroundColor: 'red',
    marginTop: 16,
    marginBottom: 8,
    minWidth: '50%',
    padding: 10,
  },
  btnSucces: {
    borderRadius: 32,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    alignSelf: 'stretch',
    backgroundColor: 'green',
    marginTop: 16,
    marginBottom: 8,
    minWidth: '50%',
    padding: 10,
  },
  btnText: {
    color: '#FFFFFF',
  },
});
