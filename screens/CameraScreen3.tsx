import React from 'react';
import { ImageBackground, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { StorageAccessFramework } from 'expo-file-system';
import { useState, useEffect } from 'react';
import Constants from "expo-constants";
import { FancyAlert } from 'react-native-expo-fancy-alerts';
import { LinearGradient } from 'expo-linear-gradient';
import { Dimensions } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export default function CameraScreen3() {
  const [image, setImage] = useState(null)
  const [GPSStatus, setGPSStatus] = useState(null)
  const [lastGPSMsg, setLastGPSMsg] = useState(null);
  const [GPSCoordinates, setGPSCoordinates] = useState(null);
  const [additionalText, setAdditionalText] = useState(null);
  const [activityRunning, setActivityRunning] = useState(false);
  const [alertConfirmVisible, setAlertConfirmVisible] = useState(false);
  const [altitudeOffset, setAltitudeOffset] = useState("0");

  const { manifest } = Constants;

  const serverUri =   Constants?.expoConfig?.hostUri ? `http://${Constants.expoConfig.hostUri.split(`:`).shift().concat(`:5000`)}` : `yourapi.com`;
  // const serverUri = "exp://localhost:5000"
  const msgNoConnection = "No connection to server";
  const msgPressPhoto = "Press to take photo";
  const msgGPSWaiting = "Waiting for GPS signal";
  const msgCapturingImage = "Taking Photo";
  const msgGettingGPS = "Getting GPS data";
  const msgSendingImage = "Sending Image";
  const keyAltitudeOffset = "altitudeOffset";

  useEffect(() => {
    (async () => {
      let resMedia = await ImagePicker.requestMediaLibraryPermissionsAsync();
      let resCamera = await ImagePicker.requestCameraPermissionsAsync();
      if (resCamera.granted === false || resMedia.granted === false) {
        alert('Permission to access camera roll is required!');
        return;
      }
      // setHasPermission(res.granted && res1.granted);
    })();
  }, []);

  useEffect(() => {
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
      SecureStore.getItemAsync(keyAltitudeOffset).then((result) => {
        if (result != null)
        setAltitudeOffset(result);
      else
        setAltitudeOffset("0");
      }).catch((error) => {
        console.log(error);
        setAltitudeOffset("0");
      });
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
  }, [lastGPSMsg, altitudeOffset]);

  const toggleConfirmAlert = React.useCallback(() => {
    setAlertConfirmVisible(!alertConfirmVisible);
  }, [alertConfirmVisible]);

  const getMainButtonColor = () => {
    let color;
    if (GPSStatus === 0) {
        color = 'tomato';
    } else if (GPSStatus === 1) {
        color = 'orange';
    } else if (GPSStatus === 2) {
        color = 'gold';
    } else if (GPSStatus === 3) {
        color = 'green';
    }else{
      color = 'grey';
    }
    return color;
  };

  let handleAlertConfirmCancel = async () => {
    toggleConfirmAlert();
  };

  let handleAlertConfirmOK = async () => {
    if (Platform.OS != "ios")
      toggleConfirmAlert();
    takePicture();
  };

  let handleMainButton = async () => {
    if (GPSStatus == 3) {
      takePicture();
    }
    else if (GPSStatus == null) {
    }
    else {
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
    setAdditionalText(msgCapturingImage);
    ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      // allowsEditing: true,
      // presentationStyle: 0,
      quality: 1,
      exif: true,
      base64: false,
    }).then((pickerResult) => {
      if (pickerResult.canceled || actualMsgForGeotag == null){
        setActivityRunning(false);
        setAdditionalText(msgPressPhoto);
        if (Platform.OS == "ios")
        setAlertConfirmVisible(false);
        return;
      }
      if (Platform.OS == "ios")
        setAlertConfirmVisible(false);
      console.log("Photo taken");
      let localPhotoUri = pickerResult.assets[0].uri;
      let filename = localPhotoUri.split('/').pop();
      // Infer the type of the image
      let match = /\.(\w+)$/.exec(filename);
      let type = match ? `image/${match[1]}` : `image`;
      // Upload the image using the fetch and FormData APIs
      let formData = new FormData();
      // Assume "photo" is the name of the form field the server expects
      setAdditionalText(msgSendingImage);
      formData.append('image', {uri: localPhotoUri, name: filename, type });
      formData.append('platform', Platform.OS);
      formData.append('GPS', JSON.stringify(actualMsgForGeotag));
      formData.append('altitudeOffset', altitudeOffset);
      console.log("Sending Image");
      fetch(serverUri + '/image', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
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
                  MediaLibrary.createAlbumAsync('Geotagger', asset, true);
                } else {
                  MediaLibrary.addAssetsToAlbumAsync([asset], album, true);
                }
              }).then(() => {
                FileSystem.deleteAsync(localPhotoUri);
                FileSystem.deleteAsync(filePhotoUri); // Working but somewhere else is caching
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
    }).catch(console.log)
  };

  const getNiceLat = () => {
    if (lastGPSMsg == null)
      return null;
    else {
      return (
        <View>
          <Text style={[styles.instructions, {fontWeight: 'bold', marginBottom: 0 }]}>
            {lastGPSMsg["latitude"].toFixed(8)}      {lastGPSMsg["longitude"].toFixed(8)}
          </Text>
          <Text style={styles.instructions2}>
            latitude                               longitude
          </Text>
          <Text style={[styles.instructions, { textAlign: "center", fontWeight: 'bold', marginBottom: 0 }]}>
               {(lastGPSMsg["altitude"]-altitudeOffset).toFixed(2)} {altitudeOffset != "0" && <Text style={{fontWeight:"normal"}} >+ {altitudeOffset} m</Text>}
          </Text>
          <Text style={[styles.instructions2, {marginBottom: 0 + Dimensions.get('window').height * 0.2 }]}>
                altitude
          </Text>
        </View>
      )
    }
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[getMainButtonColor(), 'rgba(255,255,255,1.0)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.85 }}
        style={styles.background}
      />
      {getNiceLat()}
      {activityRunning === true && <ActivityIndicator size="large" animating={true} color="black" />}
      <Text> </Text>
      <TouchableOpacity onPress={handleMainButton}
        disabled={activityRunning === true ? true : false}
        style={[styles.button, { backgroundColor: getMainButtonColor() }]}
      >
        {/* <Text style={[styles.text, {fontSize: 14}]}> {additionalText} </Text> */}
        <Text style={styles.text}> GPS Status: {GPSStatus} </Text>
        <Text style={styles.buttonText}>{additionalText}</Text>
      </TouchableOpacity>
      {/* <Text style={[styles.instructions, {fontSize: 14, marginTop: 12}]}> {additionalText} </Text> */}
      <FancyAlert
        visible={alertConfirmVisible}
        onRequestClose={() => { toggleConfirmAlert() }}
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
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    padding:20,
  },
  logo: {
    width: 305,
    height: 159,
    marginBottom: 20,
  },
  instructions: {
    color: '#000',
    fontSize: Dimensions.get('window').width *0.05,
    marginHorizontal: 15,
    marginBottom: 10,
  },
  instructions2: {
    color: '#000',
    fontSize: Dimensions.get('window').width *0.035,
    marginHorizontal: 15,
    marginBottom: 20,
    textAlign: "center", 
  },
  button: {
    backgroundColor: 'blue',
    padding: 20,
    // paddingHorizontal: 80,
    borderRadius: 15,
    alignItems: 'center',
    // flex: 1,
    // alignSelf: 'flex-end',
  },
  text: {
    fontSize: Dimensions.get('window').width *0.05,
    color: 'black',
  },
  buttonText: {
    fontSize: Dimensions.get('window').width *0.035,
    color: '#000',
  },
  buttonContainer2: {
    flexDirection: 'row',
    margin: 10,
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
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: Dimensions.get('window').height,
  },
  btnText: {
    color: '#FFFFFF',
  },
});
