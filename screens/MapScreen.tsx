import { StyleSheet, Dimensions,TouchableOpacity } from 'react-native';
import EditScreenInfo from '../components/EditScreenInfo';
import { Text, View } from '../components/Themed';
import { RootTabScreenProps } from '../types';
import MapView, {Marker} from 'react-native-maps';
import { Camera } from 'expo-camera';
import { useState, useEffect } from 'react';
import * as MediaLibrary from 'expo-media-library';
import * as Location from 'expo-location';
import Constants from "expo-constants";

export default function MapScreen({ navigation }: RootTabScreenProps<'Map'>) {

  const [myMarker, setMyMarker] = useState(null)
  const [markers, setMarkers] = useState([])
  const [lastGPSMsg, setLastGPSMsg] = useState(null);
  const { manifest } = Constants;
  const serverUri = `http://${manifest.debuggerHost.split(':').shift()}:5000`;

  useEffect(() => {
    console.log("here");
    (async () => {
      const resMedia = await MediaLibrary.requestPermissionsAsync(false)
      // let { status } = await Location.requestForegroundPermissionsAsync();
      if (resMedia.granted === false) {
        alert('Permission to access camera roll is required!');
        return;
      }
    });
  }, []);

  useEffect(() => {
    let isMounted = true;
    MediaLibrary.getAlbumAsync('Geotagger').then((album) => {
      console.log(album);
      if (album != null) {
        MediaLibrary.getAssetsAsync({ album: album.id }).then(res => {
          for (let asset of res.assets) {
            MediaLibrary.getAssetInfoAsync(asset).then((assetInfo) => {
              let newMarker = assetInfo.location;
              if (isMounted)
                setMarkers(oldMarkers => [...oldMarkers, newMarker]);
            });
          }
        })
      }
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
            setLastGPSMsg(responseJson);
          }
        })
        .catch((error) => {
          console.log(error);
        });
    }, 1000);
    return () => {
      clearInterval(interval);
      isMounted = false;
    }
  }, [lastGPSMsg]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tab One</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />

      <MapView style={styles.map}
        initialRegion={{
          latitude: 52.41,
          longitude: 16.93,
          latitudeDelta: 0.0922*3,
          longitudeDelta: 0.0421*3,
        }}
        >

        <Marker
          coordinate={ lastGPSMsg != null ? { latitude: lastGPSMsg["latitude"], longitude: lastGPSMsg["longitude"] }: { latitude:0.0, longitude:0.0 }}
          title={"You"}
          description={"123"}
          pinColor='blue'
        // image={{uri: 'custom_pin'}}
        />

        {markers.map((marker, index) => (
          <Marker
            key={index}
            coordinate={{latitude: marker.latitude, longitude: marker.longitude}}
            title={"Title"}
            description={"Descr"}
            pinColor='red'
          />
        ))}
      </MapView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
});
