import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { StorageAccessFramework } from 'expo-file-system';
import { useState, useEffect } from 'react';
import Constants from "expo-constants";
import * as Permissions from 'expo-permissions';

export default function CameraScreen3() {
  const [image, setImage] = useState(null)
  const [gpsStatus, setGPSStatus] = useState(null)

  useEffect(() => {
    (async () => {
      let permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      let permissionResult2 = await ImagePicker.requestCameraPermissionsAsync();
      if (permissionResult.granted === false) {
        alert('Permission to access camera roll is required!');
        return;
      }
      // setHasPermission(res.granted && res1.granted);
    })();
  }, []);

  useEffect(() => {
    let isMounted = true;
    const interval = setInterval(() => {
      fetch(serverUri + '/dgps', {
        method: 'GET',
      })
        .then((response) => response.json())
        //If response is in json then in success
        .then((responseJson) => {
          //Success
          if(isMounted)
            setGPSStatus(responseJson["status"]);
        })
        //If response is not in json then in error
        .catch((error) => {
          if (isMounted)
            setGPSStatus("Connection error");
        });
    }, 1000);
    return () => {
      clearInterval(interval);
      isMounted = false
    };

  }, []);

  const { manifest } = Constants;
  const serverUri = `http://${manifest.debuggerHost.split(':').shift()}:5000`;

  let getGPSStatus = async (isMounted) => {
      //GET request
  }


  let openImagePickerAsync = async () => {
      ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      presentationStyle: 0,
      // quality: 1,
      exif: true,
      base64:false,
    }).then( (pickerResult) => {
      if(pickerResult.cancelled)
        return;
      let localUri = pickerResult.uri;
      let filename = localUri.split('/').pop();
      // Infer the type of the image
      let match = /\.(\w+)$/.exec(filename);
      let type = match ? `image/${match[1]}` : `image`;

      // Upload the image using the fetch and FormData APIs
      let formData = new FormData();
      // Assume "photo" is the name of the form field the server expects
      formData.append('image', { uri: localUri, name: filename, type });
      formData.append('platform', Platform.OS);
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
              // toggleSuccesAlert();
              console.log("Deleted cache");
            });
          });
        });
      }).catch((error) => {
        FileSystem.deleteAsync(localUri);
        console.log("Deleted cache");
        console.log(error);
        // toggleErrorAlert();
      });
  });
  };


  return (
    <View style={styles.container}>
      <Text style={styles.instructions}> GPS Status: {gpsStatus}
        {/* To take a photo press the button below! */}
      </Text>

      <TouchableOpacity onPress={openImagePickerAsync} style={styles.button}>
        <Text style={styles.buttonText}>Take a photo</Text>
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
    padding:20
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
    marginBottom: 80,
  },
  button: {
    backgroundColor: 'blue',
    padding: 20,
    borderRadius: 5,
    alignItems: 'flex-end',
    // flex: 1,
    // alignSelf: 'flex-end',
  },
  buttonText: {
    fontSize: 20,
    color: '#fff',
  },
});
