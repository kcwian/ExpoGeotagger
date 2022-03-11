import { StyleSheet, Dimensions, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import React, { useState, useEffect } from 'react';
import EditScreenInfo from '../components/EditScreenInfo';
import { Text, View } from '../components/Themed';
import { Camera } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import Constants from "expo-constants";
import { AutoFocus } from 'expo-camera/build/Camera.types';
import { FancyAlert } from 'react-native-expo-fancy-alerts';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import { LoadingIndicator } from 'react-native-expo-fancy-alerts';
import { selectIsLoading } from 'selectors';
import * as SecureStore from 'expo-secure-store';


export default function CameraScreen() {
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraRef, setCameraRef] = useState(null)
  const [type, setType] = useState(Camera.Constants.Type.back);
  const [errorVisible, setErrorVisible] = React.useState(false);
  const [succesVisible, setSuccesVisible] = React.useState(false);
  const [alertConfirmVisible, setAlertConfirmVisible] = useState(false);
  const [GPSStatus, setGPSStatus] = useState(null);
  const [lastGPSMsg, setLastGPSMsg] = useState(null);
  const [additionalText, setAdditionalText] = useState(null);
  const [activityRunning, setActivityRunning] = useState(false);
  const [altitudeOffset, setAltitudeOffset] = useState("0");

  const { manifest } = Constants;
  const serverUri = `http://${manifest.debuggerHost.split(':').shift()}:5000`;
  const msgNoConnection = "No connection to server";
  const msgPressPhoto = "Press to take photo";
  const msgGPSWaiting = "Waiting for GPS signal";
  const msgCapturingImage = "Taking Photo";
  const msgGettingGPS = "Getting GPS data";
  const msgSendingImage = "Sending Image";
  const keyAltitudeOffset = "altitudeOffset";

  const toggleErrorAlert = React.useCallback(() => {
    setErrorVisible(!errorVisible);
  }, [errorVisible]);
  const toggleSuccesAlert = React.useCallback(() => {
    setSuccesVisible(!succesVisible);
  }, [succesVisible]);
  const toggleConfirmAlert = React.useCallback(() => {
    setAlertConfirmVisible(!alertConfirmVisible);
  }, [alertConfirmVisible]);

  useEffect(() => {
    (async () => {
      const resCamera = await Camera.requestCameraPermissionsAsync();
      const resMedia = await MediaLibrary.requestPermissionsAsync(false);
      setHasPermission(resMedia.granted && resCamera.granted);
    })();
  }, []);

  React.useEffect(() => {
    let isMounted = true;
    SecureStore.getItemAsync(keyAltitudeOffset).then((result) => {
      if (result != null)
      setAltitudeOffset(result);
    else
      setAltitudeOffset("0");
    }).catch((error) => {
      console.log(error);
      setAltitudeOffset("0");
    });
    return () => {
      isMounted = false;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const interval = setInterval(() => {
      //GET request
      fetch(serverUri + '/lastMessage', {
        method: 'GET',
      })
        .then((response) => response.json())
        .then((responseJson) => {
          if (isMounted) {
            if (lastGPSMsg == null || responseJson["seq"] === lastGPSMsg["seq"]){
              setGPSStatus(null);
              setLastGPSMsg(responseJson);
              setAdditionalText(msgNoConnection);
            }
            else {
              setLastGPSMsg(responseJson);
              setGPSStatus(responseJson["status"]); // GPS status
              if (responseJson["status"] == -1)
                setAdditionalText(msgGPSWaiting);
              else if (additionalText === null || additionalText === msgNoConnection || additionalText === msgGPSWaiting)
                setAdditionalText(msgPressPhoto);  
            }
          }
        })
        .catch((error) => {
          if (isMounted) {
            console.log(error);
            setGPSStatus(null);
            setAdditionalText(msgNoConnection);
          }
        });
    }, 1000);
    return () => {
      clearInterval(interval);
      isMounted = false;
    }
  }, [lastGPSMsg]);

  let handleAlertConfirmCancel = async () => {
    toggleConfirmAlert()
  };

  let handleAlertConfirmOK = async () => {
    toggleConfirmAlert()
    takePicture();
  };

  let handleMainButton = async () => {
    if (GPSStatus == 3){
      takePicture();
    }
    else if (GPSStatus == null){
    }
    else{
      toggleConfirmAlert();
    }
  };

  let takePicture = async () => {

    setAdditionalText(msgGettingGPS);
    setActivityRunning(true);
    let actualMsgForGeotag = null;
    // Get last GPS coordinates
    await fetch(serverUri + '/lastMessage', {
      method: 'GET',
    })
      .then((response) => response.json())
      .then((responseJson) => {
        actualMsgForGeotag = responseJson;
      })
      .catch((error) => {
        console.log(error);
      });
    setAdditionalText(msgSendingImage);
    if (cameraRef && actualMsgForGeotag) {
      let photo = await cameraRef.takePictureAsync({
        // exif: true,
        autoFocus: Camera.Constants.AutoFocus.on,
        quality: 1,
      }).catch(console.error);
      console.log("Photo taken");
      let localPhotoUri = photo.uri;
      let filename = localPhotoUri.split('/').pop();
      // Infer the type of the image
      let match = /\.(\w+)$/.exec(filename);
      let type = match ? `image/${match[1]}` : `image`;
      // Upload the image using the fetch and FormData APIs
      let formData = new FormData();
      // Assume "photo" is the name of the form field the server expects
      setAdditionalText(msgSendingImage);
      formData.append('image', { uri: localPhotoUri, name: filename, type });
      formData.append('platform', Platform.OS);
      formData.append('GPS', JSON.stringify(actualMsgForGeotag));
      formData.append('altitudeOffset', altitudeOffset);
      console.log("Sending Image");
      fetch(serverUri + '/image', {
        method: 'POST',
        body: formData,
        headers: {
          'content-type': 'multipart/form-data',
        },
      }).then(response => {
        // setAdditionalText("Received image from server");
        setAdditionalText(msgPressPhoto);
        setActivityRunning(false);
        response.json().then(json => {
          let base64Code = json["base64"];
          let imageName = json['name']
          console.log("Received image");
          const filePhotoUri = FileSystem.documentDirectory + imageName;
          FileSystem.writeAsStringAsync(filePhotoUri, base64Code, {
            encoding: FileSystem.EncodingType.Base64,
          }).then(() => {
            // FileSystem.getInfoAsync(filePhotoUri);
            console.log("Saved to SD Card")
            MediaLibrary.createAssetAsync(filePhotoUri).then((asset) => {
              MediaLibrary.getAlbumAsync('Geotagger').then((album) => {
                if (album == null) {
                  MediaLibrary.createAlbumAsync('Geotagger', asset, false);
                } else {
                  MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
                }
              }).then(() => {
                FileSystem.deleteAsync(localPhotoUri);
                FileSystem.deleteAsync(filePhotoUri);
                // toggleSuccesAlert();
                console.log("Deleted cache");
              });
            });
          });
        });
      }).catch((error) => {
        setActivityRunning(false);
        FileSystem.deleteAsync(localPhotoUri);
        console.log(error);
        // setAdditionalText("No connection to server");
        // alert("No connection to image server. Photo was not saved");
        // toggleErrorAlert();
      });
    }
  };

  const getMainButtonColor = () => {
    let color;
    if (GPSStatus === 0) {
        color = 'red';
    } else if (GPSStatus === 1) {
        color = 'orange';
    } else if (GPSStatus === 2) {
        color = 'yellow';
    } else if (GPSStatus === 3) {
        color = 'green';
    }else{
      color = 'grey';
    }
    return color;
};
  
  if (hasPermission === null) {
    return <View />;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={styles.container}>
      <Camera style={styles.camera} type={type} ref={ref => { setCameraRef(ref) }} autoFocus={Camera.Constants.AutoFocus.on} flashMode={Camera.Constants.FlashMode.auto}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            disabled={activityRunning === true ? true : false}
            style={[styles.button, { backgroundColor: getMainButtonColor() }]}
            onPress={handleMainButton}
            >
            {activityRunning === true && <ActivityIndicator size="large" animating={true} color="white" />}
            <Text style={styles.text}> GPS Status: {GPSStatus} </Text>
            <Text style={[styles.text, {fontSize: 14}]}> {additionalText} </Text>
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

      <FancyAlert
        visible={alertConfirmVisible}
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
        <Text style={{ marginTop: -16, marginBottom: 10 }}>Do you want to take photo?</Text>
        <View style={styles.buttonContainer2}>
          <TouchableOpacity style={styles.btnError} onPress={handleAlertConfirmCancel}>
            <Text style={styles.btnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnSucces} onPress={handleAlertConfirmOK}>
            <Text style={styles.btnText}>OK</Text>
          </TouchableOpacity>
        </View>
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
    opacity:0.6,
  },
  buttonContainer2: {
    flexDirection: 'row',
    margin: 10,
  },
  button: {
    flex: 1,
    alignSelf: 'flex-end',
    alignItems: 'center',
    // backgroundColor: 'green',
    height: "20%", // Pressable area
    justifyContent:'center',
  },
  text: {
    fontSize: 18,
    color: 'black',
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
