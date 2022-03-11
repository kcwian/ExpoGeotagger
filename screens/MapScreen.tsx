import { StyleSheet, Dimensions,TouchableOpacity ,TouchableHighlight, Platform, Image} from 'react-native';
import EditScreenInfo from '../components/EditScreenInfo';
import { Text, View } from '../components/Themed';
import { RootTabScreenProps } from '../types';
import MapView, {Marker, Callout, Overlay} from 'react-native-maps';
import { Camera } from 'expo-camera';
import { useState, useEffect, useRef } from 'react';
import * as MediaLibrary from 'expo-media-library';
import * as Location from 'expo-location';
import Constants from "expo-constants";
import { getDistance, getPreciseDistance } from 'geolib';
import * as ImagePicker from 'expo-image-picker';
import {Svg, Image as ImageSvg} from 'react-native-svg';
import * as SecureStore from 'expo-secure-store';

export default function MapScreen({ navigation }: RootTabScreenProps<'Map'>) {

  const [myMarker, setMyMarker] = useState(null)
  const [markers, setMarkers] = useState([])
  const [distance, setDistance] = useState(null)
  const [lastGPSMsg, setLastGPSMsg] = useState(null);
  const [activeMarker, setActiveMarker] = useState(null);
  const [mapInitalized, setMapInitalized] = useState(false);
  const [mapType, setMapType] = useState("standard");
  const itemsRef = useRef([]);
  const mapRef = useRef();
  const activeMarker2 = useRef();
  const { manifest } = Constants;
  const serverUri = `http://${manifest.debuggerHost.split(':').shift()}:5000`;
  const keyMapType = "mapType";

  useEffect(() => {
    (async () => {
      const resMedia = await MediaLibrary.requestPermissionsAsync(false);
      let resCamera = await ImagePicker.requestCameraPermissionsAsync();
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
        MediaLibrary.getAssetsAsync({ album: album.id, first:200 }).then(res => {
          for (let asset of res.assets) {
            MediaLibrary.getAssetInfoAsync(asset).then((assetInfo) => {
              let newMarker = assetInfo.location;
              if (newMarker != null) {
                newMarker['uri'] = assetInfo.localUri;
                // console.log(assetInfo.localUri);
                if (isMounted)
                  setMarkers(oldMarkers => [...oldMarkers, newMarker]);
              }
            });
            
          }
          console.log("Reading all photos");
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
            if (mapInitalized == false) {
              setMapInitalized(true);
              mapRef.current.animateToRegion({
                latitude: responseJson["latitude"],
                longitude: responseJson["longitude"],
                latitudeDelta: 0.00922,
                longitudeDelta: 0.00922,
              });
            }
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
  }, [lastGPSMsg,mapInitalized]);

  useEffect(() => {
    let isMounted = true;
    SecureStore.getItemAsync(keyMapType).then((result) => {
      if (result != null)
        setMapType(result);
      else
      setMapType("standard");
    }).catch((error) => {
      console.log(error);
      setMapType("standard");
    });
    return () => {
      isMounted = false;
    }
  }, []);

  let calculateDistance = (marker, index) => {
    if (lastGPSMsg == null || activeMarker == null || activeMarker != index)
      return;
      // console.log(activeMarker);
      let dist = getDistance(
        {latitude: lastGPSMsg.latitude, longitude : lastGPSMsg.longitude},
        {latitude: marker.latitude, longitude : marker.longitude},
        0.01
      );

    return (
      <View style={{ alignContent: 'center', alignSelf: "center" }}>
          <Svg width={200} height={200}>
                 <ImageSvg
                     width={'100%'} 
                     height={'100%'}
                     preserveAspectRatio="xMidYMid slice"
                     href={{ uri: marker.uri}}
                 />
             </Svg>
        <Text style={{alignContent: 'center', alignSelf: 'center', }}> Distance: {dist.toFixed(2)} m </Text>
      </View>
    )
  }

  let mapCalloutPress = () => {
    if (Platform.OS == "android") {
      if (activeMarker != null) {
        itemsRef[activeMarker].hideCallout();
        setActiveMarker(null);
      }
    }
  }

  let markerCalloutPress = (marker, index) => {
    // setActiveMarker(null);
    // itemsRef[activeMarker].hideCallout();
  }

  let updateActive = (index) =>  {
    if (activeMarker == null || activeMarker != index)
      return;
      // console.log(activeMarker);
    if (Platform.OS == 'android') {
      if (itemsRef[activeMarker]) {
        // itemsRef[activeMarker].hideCallout();
        itemsRef[activeMarker].showCallout();
      }
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tab One</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />

      <MapView style={styles.map}
          ref={ref => {mapRef.current = ref}}
          onPress={mapCalloutPress}
          mapType={mapType}
        initialRegion={{
          latitude: 52.41,
          longitude: 16.93,
          latitudeDelta: 0.0922*3,
          longitudeDelta: 0.0421*3,
        }}
        >

        <Marker
        
          coordinate={lastGPSMsg != null ? { latitude: lastGPSMsg["latitude"], longitude: lastGPSMsg["longitude"] } : { latitude: 0.0, longitude: 0.0 }}
          pinColor='blue'
          ref={ref => { setMyMarker(ref) }}
          title={"Your position"}
        >
        </Marker>

        {markers.map((marker, index) => (
            <Marker
              key={index}
              onSelect={() => setActiveMarker(index)}
              onPress={() => { setActiveMarker(index) }}
              onCalloutPress={() => markerCalloutPress(marker, index)}
              coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
              pinColor='red'
              ref={ref => { itemsRef[index] = ref }}
              tracksInfoWindowChanges={true}
            // image={{uri: marker.uri, width:10, height:10, scale: 22}}
            >
              <Callout style={{ width: 220, height: 220 }}>
                {calculateDistance(marker, index)}
                {updateActive(index)}

              </Callout>
            </Marker>
          ))}

      </MapView>
    </View>

  );
}

const styles = StyleSheet.create({
  tinyLogo: {
    flex:1,
    width: 200,
    height: 100,
    backgroundColor: 'blue'
  },
  logo: {
    width: 66,
    height: 58,
  },
  picSize: {
    flex:1,
    width: 200,
    height: 200,
    backgroundColor: "#123"
  },
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
  button: {
    height: 40,
    width: 100,
    alignItems:'center',
    justifyContent:'center',
    backgroundColor: 'orange',
    borderRadius: 5,
    bottom:0
  },
});
