import { StyleSheet, Dimensions,TouchableOpacity } from 'react-native';
import EditScreenInfo from '../components/EditScreenInfo';
import { Text, View } from '../components/Themed';
import { RootTabScreenProps } from '../types';
import MapView, {Marker} from 'react-native-maps';
import { Camera } from 'expo-camera';
import { useState, useEffect } from 'react';
import * as MediaLibrary from 'expo-media-library';
import * as Location from 'expo-location';

export default function MapScreen({ navigation }: RootTabScreenProps<'Map'>) {

  const [markers, setMarkers] = useState([])
  useEffect(() => {
    (async () => {
      const res = await MediaLibrary.requestPermissionsAsync(false)
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (res.granted === false) {
        alert('Permission to access camera roll is required!');
        return;
      }
      MediaLibrary.getAlbumAsync('Geotagger').then((album) => {
        console.log(album);
        if (album != null) {
          MediaLibrary.getAssetsAsync({ album: album.id }).then(res => {
            // console.log(res.assets[0]);
            for (let asset of res.assets) {
              MediaLibrary.getAssetInfoAsync(asset).then((assetInfo) => {
                let newMarker = assetInfo.location;
                setMarkers(oldMarkers => [...oldMarkers, newMarker]);
                console.log(newMarker);
              });
            }
          })
        }
      });
    })();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tab One</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />

      <MapView style={styles.map}>

        <Marker
          coordinate={{ latitude: 37.78825, longitude: -122.4324 }}
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
