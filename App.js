import * as React from 'react';
import { Share, Text, View, StyleSheet, Button, TouchableHighlight , Image , ImageBackground} from 'react-native';
import { Audio, AVPlaybackStatus } from 'expo-av';
import * as Sharing from 'expo-sharing';
import { StatusBar } from 'expo-status-bar';
//import Share from 'react-native-share'; 

var playButton = require('./assets/play_button.png');
var stopButton = require('./assets/stop_button.png');
var recordButton = require('./assets/record_button.png');
var pauseButton = require('./assets/pause_button.png');
var bgImage = require('./assets/bgImage.jpg');

export default function App() {
  const [sound, setSound] = React.useState();

  const [recording, setRecording] = React.useState();

  const [ playRecording , setPlayRecording ] = React.useState({
    uri : undefined,
    isRecorded : false ,
  });

  const [ isPlaying , setIsPlaying] = React.useState(false);

  const [flashMessage , setFlashMessage] = React.useState({
    display : false,
    message : 'This is custom Flash message'
  });

  async function onPlaybackStatusUpdate(status) {
    if(status.didJustFinish){
      setIsPlaying(false);
      unloadSound();
    }
  }

  async function startRecording() {
    try {
      console.log('Requesting permissions..');

      if(sound && isPlaying){
        setIsPlaying(false);
        stopSound();
      }

      let permissionResponse = await Audio.requestPermissionsAsync();
      if(permissionResponse.status === 'granted'){
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true
        }); 
        console.log('Starting recording..');
        const recording = new Audio.Recording();
        await recording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
        await recording.startAsync(); 
        setRecording(recording);
        console.log('Recording started');
      }
      else{
        setFlashMessage({
          display: true,
          message : "Please give Audio Recording permission to proceed"
        });
      }
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  }

  async function stopRecording() {
    console.log('Stopping recording..');
    setRecording(undefined);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI(); 
    console.log('Recording stopped and stored at', uri);
    let playRecordingState = {...playRecording};
    playRecordingState.uri = uri;
    playRecordingState.isRecorded = true;
    setPlayRecording(playRecordingState);
    return uri;
    //enable sound play
    // console.log('Loading Sound');
    // const {sound}  = await Audio.Sound.createAsync( { uri : playRecordingState.uri } );
    // setSound(sound);
  }

  

  async function playSound(soundFile) {
    if(recording){
      stopRecording();
      soundFile = playRecording.uri;
    }
    if(soundFile !== undefined){
      console.log('Loading Sound');
      const {sound}  = await Audio.Sound.createAsync( typeof(soundFile) === 'string' ? { uri : soundFile} : soundFile);
      console.log('Playing Sound');
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
      setSound(sound);
      setIsPlaying(true);
      //console.log(AVPlaybackStatus.isPlaying);
    }
    else{
      console.log("played Sound without recording");
      setFlashMessage({
        display: true,
        message : "Please record first!"
      });
    }
  }

  async function stopSound(){
    console.log("stopping play");
    await sound.stopAsync();
    setIsPlaying(false);
    unloadSound();
  }

  function unloadSound(){
    console.log('Unloading Sound');
    if(!sound){
      sound.unloadAsync();
    }
    
  }

  function closeFlashMessage(){
    let flashMessageLocal = {...flashMessage};
    flashMessageLocal.display = false;
    flashMessageLocal.message = "This is custom Flash message";
    if(flashMessage.display === true)
      setFlashMessage(flashMessageLocal);
  }

  const onShare = async () => {
    if(Sharing.isAvailableAsync()){
      if(playRecording.uri){
        Sharing.shareAsync(playRecording.uri, { dialogTitle : "Share Your Record!"});
      }
      else{
        console.log("shared Sound without recording");
        setFlashMessage({
          display: true,
          message : "Please record to share audio!"
        });
      }
      
    }
    else{
      setFlashMessage({
        display: true,
        message : "Share hindered!!!"
      })
    }
    
  };
  

  React.useEffect(() => {
    console.log("in useEffect  : closeFlashMessage");
    setTimeout(() => closeFlashMessage(), 3000);
  },[flashMessage]);

  


  return (
    <View style={styles.container}>
      <ImageBackground source= { bgImage /*{uri : "https://ik.imagekit.io/shivam/mountain_nimH300hLK.jpg"} */} style={styles.image}> 
        {/* use light text instead of dark text in the status bar to provide more contrast with a dark background */}
        <StatusBar style="light" />
        <TouchableHighlight underlayColor ="rgba(1,87,155,0.7)" style  = {styles.iconContainer} onPress={recording ? stopRecording : startRecording} >
          <View style={{alignItems:'center',justifyContent:'space-between'}}>
            <Image source = {recording ? stopButton : recordButton} ></Image>
            <Text style={styles.shareText}>{recording ? "Stop Recording" : "Start Recording"}</Text>
          </View>
        </TouchableHighlight>
        {/* playbackStatus.isLoaded && playbackStatus.isPlaying */}
        <TouchableHighlight underlayColor ="rgba(1,87,155,0.7)" style  = {styles.iconContainer} onPress={(isPlaying) ? stopSound : () => playSound(playRecording.uri)}>
          <View style={{alignItems:'center'}}>
            <Image source = {(isPlaying) ? stopButton : playButton} ></Image>
            <Text style={styles.shareText}>{(isPlaying) ? "Stop" : "Play"}</Text>
          </View>
        </TouchableHighlight>
        <TouchableHighlight underlayColor ="rgba(1,87,155,0.7)" onPress={onShare}
         style  = {styles.iconContainer}>
          <Text style={styles.shareText}>Share Your Record!</Text>
        </TouchableHighlight>
        {flashMessage.display === true ?
            <View style={styles.flashMessage}>
              <Text style={{color:'white', fontSize:20}}>{flashMessage.message}</Text>
            </View>
            :
            null
        }
      </ImageBackground>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex : 1,    
    backgroundColor: '#B3E5FC',
    padding: 0,
  },
  flashMessage: {
    position:'absolute', 
    zIndex:10,
    backgroundColor:'#01579B', 
    width : 'auto' ,
    justifyContent:'center', 
    alignItems:'center',  
    alignSelf : 'center',
    padding : 10,
    borderRadius:10,
    borderWidth: 1,         
    height: 50, 
    bottom : '45%',
    fontSize: 20
  },
  image: {
    resizeMode: "cover",
    justifyContent: 'space-evenly',
    margin : 0,
    alignItems : 'center',
    padding: 0,
    flex : 1
  },
  iconContainer : {
    borderRadius : 100,
    borderWidth:1,
    
    alignSelf : 'center',
    borderColor:'#03A9F4',
    backgroundColor: 'rgba(3, 160, 244, 0.1)',
    //background:'rgba(0, 0, 0, 0.2)',03A9F4
    width: '70%',
    height:'20%',
    justifyContent: 'center',
    alignItems:'center',
    alignSelf:'center'
  },
  shareText : {
    color : 'white',
    fontSize: 20,
  }
});