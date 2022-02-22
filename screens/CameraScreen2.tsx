import React from 'react';
import { StyleSheet, SafeAreaView, Button } from 'react-native';
import * as Permissions from 'expo-permissions';
import * as MediaLibrary from 'expo-media-library';
import { Camera, CameraPictureOptions, CameraCapturedPicture} from 'expo-camera';


export default class CameraScreen extends React.Component {
    constructor(props) {
        super(props);

        this.camera = null;

        this.state = {
            permissions: false,
            ready: false,
        }
    }

    componentDidMount() {
        Permissions.askAsync(Permissions.CAMERA, Permissions.CAMERA_ROLL).then(permission => {
            if (permission.status === 'granted') {
                this.setState({permissions: true});
            } else {
                alert('Permission is required to take photos and access media library.');
            }
        });
    }

    onCameraReady() {
        if (this.state.permissions && this.camera) {
            this.setState({ready: true});
        }
    }

    onTakePhoto() {
      let extraExif = {
        Software: `appName`,
        Artist: "myname",
      };

      Object.assign(extraExif, {
        fixOrientation: true,
        forceUpOrientation: true,
        GPSLatitude: 1.12,
        GPSLongitude: 2.31,
        GPSAltitude: 13,
      });

        const options = {
            quality: 1,
            exif:true,
            base64: true,
            writeExif: extraExif,
            onPictureSaved: this.saveImage.bind(this),
            // CameraCaputerPic
        };
    
        this.camera.takePictureAsync(options).then().catch(
            error => alert(error)
        )
    }

    saveImage(photo) {
        // photo contains all the Exif data, for example:

        // "ApertureValue": 1.6959938131099002,
        // "BrightnessValue": -0.5381590558481736,
        // "ColorSpace": 65535,
        // "DateTimeDigitized": "2019:11:28 15:36:46",
        // "DateTimeOriginal": "2019:11:28 15:36:46",
        // "ExifVersion": "0231",
        // "ExposureBiasValue": 0,
        // "ExposureMode": 0,
        // "ExposureProgram": 2,
        // "ExposureTime": 0.02,
        // "FNumber": 1.8,
        // "Flash": 16,
        // "FocalLenIn35mmFilm": 27,
        // "FocalLength": 4.25,
        // "ISOSpeedRatings": Array [
        //       1000,
        //     ],
        //
        // ...and more...

        photo["MyData"] = 312;  
        // photo.exif["Mydata"] = 1231;
        console.log(photo) ;
        MediaLibrary.saveToLibraryAsync(photo.uri);
        MediaLibrary.createAssetAsync(photo.uri).then(asset => {
            // The return of createAssetAsync does not contain Exif data, this is expected
            // however the saved file should contain the original Exif data, but it does not
            console.log(asset);
            asset["MyData2"] = 1123;
            MediaLibrary.getAssetInfoAsync(asset.id).then(info => {
                // here Exif field is present but only with very few attributes,
                // I think it is added by getAssetInfoAsync method and is not actually in the file
                // all of the original Exif is lost
                console.log(info);
            });

        }).catch(error => {
            alert(error);
        });
    }

    render() {
        return (
            <SafeAreaView style={styles.container}>
                <Camera style={styles.camera}
                        ref={cam => {
                            this.camera = cam
                        }}
                        type={Camera.Constants.Type.back}
                        flashMode={'off'}
                        onCameraReady={() => this.onCameraReady()}
                />
                <Button disabled={!this.state.ready} title={'take photo'} onPress={() => this.onTakePhoto()} />
            </SafeAreaView>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    camera: {
        flex: 1,
   }
});