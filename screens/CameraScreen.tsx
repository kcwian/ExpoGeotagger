import { StyleSheet,Dimensions,TouchableOpacity } from 'react-native';
import React, { useState, useEffect } from 'react';
import EditScreenInfo from '../components/EditScreenInfo';
import { Text, View } from '../components/Themed';
import { Camera } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';

export default function CameraScreen() {
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraRef, setCameraRef] = useState(null)
  const [mediaRef, setMediaRef] = useState(MediaLibrary)
  const [type, setType] = useState(Camera.Constants.Type.back);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      let { status2 } = await MediaLibrary.requestPermissionsAsync(false)
      setHasPermission(status === 'granted');
    })();
  }, []);

  // let media = MediaLibrary.getAssetsAsync({
      // mediaType: ['photo'],
    // })
  // const asset = MediaLibrary.createAssetAsync().catch(console.error);

  if (hasPermission === null) {
    return <View />;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }
  
  // takePicture = async () => {
  //   if (this.camera) {
  //     const photo = await this.camera.takePictureAsync({
  //       exif: true, // adjust if needed
  //     }).catch(console.error);

  //     alert(JSON.stringify(photo));
      
  //     if (this.state.shouldPersistPhoto) {
  //       const asset = await MediaLibrary.createAssetAsync(photo.uri).catch(console.error);
  //       console.log('Saved asset', asset);
  //     }
  //   }
  // };
  return (
    <View style={styles.container}>
      <Camera style={styles.camera} type={type} ref={ref => {setCameraRef(ref)}}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              setType(
                type === Camera.Constants.Type.back
                  ? Camera.Constants.Type.front
                  : Camera.Constants.Type.back
              );
            }}>
            <Text style={styles.text}> Flip </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={async() => {
              let photo = await cameraRef.takePictureAsync({
                exif: true, // adjust if needed
              }).then().catch(console.error);
              // alert(JSON.stringify(photo));
              // console.log("Before", photo);
              // photo.exif.ApertureValue = "51.0"
              // photo["location"] = {}
              // photo.location["latitude"] = 52.1079;
              // photo.location["longitude"] = 16.648496694444443;
              // photo.exif["GPSAltitudeRef"] = 0;
              // photo.exif["GPSDateStamp"] = "2022:02:20";
              // photo.exif["GPSLatitudeRef"] = "N";
              // photo.exif["GPSLongitudeRef"] = "E";
              // photo.exif["GPSProcessingMethod"] = "NETWORK";
              // photo.exif["GPSTimeStamp"] = "13:44:27";
              // photo["height"] = 33;
              // photo.exif.latitude = "32.0"
              // console.log("After", photo);
              // let photo2 = photo;
              // console.log("Photo2", photo2)
              // let pathTest ="file:///testNew.jpg"
              let localUri = photo.uri;
              let filename = localUri.split('/').pop();

              // Infer the type of the image
              let match = /\.(\w+)$/.exec(filename);
              let type = match ? `image/${match[1]}` : `image`;

              // Upload the image using the fetch and FormData APIs
              let formData = new FormData();
              // Assume "photo" is the name of the form field the server expects
              formData.append('image', { uri: localUri, name: filename, type });
              console.log("fetching");
              fetch("http://192.168.0.113:5000/image", {
                method: 'POST',
                body: formData,
                headers: {
                  'content-type': 'multipart/form-data',
                },
              }).then((response) => {
                response.json().then(json => {
                // console.log(json["image"]);
                console.log(json["a"]);
                let myimage = json["image"];
                  let imageUri = `data:image/jpg;base64,${myimage}`;
                  const base64Code = imageUri.split("data:image/jpg;base64,")[1];

                  const filename = FileSystem.documentDirectory + "got.png";
                  FileSystem.writeAsStringAsync(filename, base64Code, {
                    encoding: FileSystem.EncodingType.Base64,
                  });

                  const mediaResult = MediaLibrary.saveToLibraryAsync(filename);

                // console.log({uri: imageUri.slice(0, 100)});
                // const assetTest = MediaLibrary.createAssetAsync(filename).catch(console.error);
                 console.log("saved");
                // console.log(response.url + json["file"]);
                // FileSystem.readAsStringAsync(response.url +'/' + json["file"], { encoding: FileSystem.EncodingType.Base64 });
                });
                // console.log(response);
                // console.log(response.blob());
                // const blob = response.blob();
                // var reader = new FileReader();
                // reader.onload = () => {
                //   console.log(reader.result);
                // }
                // reader.readAsDataURL(blob);
              // const base64 = FileSystem.readAsStringAsync(blob, { encoding: 'base64' });
          });
              // const ab = await MediaLibrary.saveToLibraryAsync(photo.uri).catch(console.error);
              // const asset = await MediaLibrary.createAssetAsync(photo.uri).catch(console.error);
              // asset["location"] = 333;
              // console.log(asset)
                // const assetTest = await MediaLibrary.createAssetAsync(photo.uri).catch(console.error);
              // const assetTestInfo = await MediaLibrary.getAssetInfoAsync(asset);
              // console.log('Readed asset', assetTestInfo);
              // const aa = await MediaLibrary.getAssetInfoAsync(asset);
              // console.log("Info", aa);
              // aa["location"] = "Dom";
              // console.log("Info", aa["location"]);
              // const asset2 = await MediaLibrary.createAssetAsync(aa.uri).catch(console.error);
            }}>
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
  },
  text: {
    fontSize: 18,
    color: 'white',
  },
});
