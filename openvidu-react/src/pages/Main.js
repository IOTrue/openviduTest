import { OpenVidu } from 'openvidu-browser';

import axios from 'axios';
import React, { useState, Component, useRef, useEffect } from 'react';
import UserVideoComponent from '../UserVideoComponent';
import CanvasTest from '../Components/CanvasTest'


/*본문*/

const APPLICATION_SERVER_URL = process.env.NODE_ENV === 'production' ? 'https://iamhyunjun.shop:5000/' : 'https://iamhyunjun.shop:5000/';



function Main () {

    //const [OV, setOV]=useState(null)
    const [myUserName, setMyUserName]=useState('Participant' + Math.floor(Math.random() * 100))
    const [mySessionId, setMySessionId]=useState('SessionA')
    const [session, setSession] = useState(undefined)
    const [subscribers, setSubscribers]=useState([])
    const [publisher, setPublisher] = useState(null)
    const [mainStreamManager, setMainStreamManager] = useState(undefined) // Main video of the page. Will be the 'publisher' or one of the 'subscribers'
    const [currentVideoDevice, setCurrentVideoDevice]=useState(undefined)
    
    //오디오, 비디오 컨트롤
    const [isPublisherAudio, setIsPublisherAudio]=useState(true)
    const [isSubscriberAudio, setIsSubscriberAudio]=useState(true)
    const [isSubscriberVideo, setIsSubscriberVideo]=useState(true)
    const [nowSubscriber, setNowSubscriber]=useState(null)
    

    useEffect(()=>{
        window.addEventListener('beforeunload', onbeforeunload);
    },[])

    const onbeforeunload = (e) => {
        leaveSession();
    }

    const handleMainVideoStream = (stream) => {
        if (mainStreamManager !== stream) {
            setMainStreamManager(stream)
        }
    }

    const deleteSubscriber = (streamManager) => {
        console.log('streamManager :::::::: ', streamManager)
        let index = subscribers.indexOf(streamManager, 0);
        if (index > -1) {
            subscribers.splice(index, 1);
            setSubscribers(subscribers)
        }
    }


    /*오디오 컨트롤*/

    const onClickPublisherAudioToggle=()=>{
        setIsPublisherAudio(!isPublisherAudio)
    }

    useEffect(()=>{
        console.log('onClickPublisherAudioToggle : ', isPublisherAudio)
        console.log('onClickPublisherAudioToggle publisher : ', publisher)
        if(publisher){
            publisher.publishAudio(isPublisherAudio)
        }
    },[isPublisherAudio])

    const onClickSubscriberAudioToggle=(subToken)=>{
        const subTokenId = subToken
        setIsSubscriberAudio(!isSubscriberAudio)
        console.log('clientId ::::: ', subTokenId)
        //console.log('onClickSubscriberAudioToggle subscribers subTokenId : ', subscribers.stream.connection.session.token)
        const subscriberFilter = subscribers.filter((sub)=>{
            console.log('filter sub : ', sub)
            console.log('filter sub.stream.connection.session.token : ', sub.stream.connection.session.token)
            console.log('filter subTokenId : ', subTokenId)
            return sub.stream.connection.session.token === subTokenId
        })
        setNowSubscriber(subscriberFilter)
        //.stream.connection.session.token === subTokenId
        console.log('❗ subscriberFilter : ', subscriberFilter)
    }

    useEffect(()=>{
        console.log('onClickSubscriberAudioToggle : ', isSubscriberAudio)
        console.log('❗ nowSubscriber : ', nowSubscriber)
        if(nowSubscriber){
            const subscriber = nowSubscriber
            subscriber[0].subscribeToAudio(isSubscriberAudio)
            return console.log('onClickSubscriberAudioToggle nowSubscriber 22222 : ', subscriber)
        }
    },[isSubscriberAudio])


    const onClickSubscriberVideoToggle=(subToken)=>{
        
        const subTokenId = subToken
        setIsSubscriberVideo(!isSubscriberVideo)
        
        const subscriberFilter = subscribers.filter((sub)=>{

            return sub.stream.connection.session.token === subTokenId
        })
        setNowSubscriber(subscriberFilter)
    }

    useEffect(()=>{
        console.log('onClickSubscriberVVVVideoToggle : ', isSubscriberVideo)
        console.log('❗ nowSubscriber : ', nowSubscriber)
        if(nowSubscriber){
            const subscriber = nowSubscriber
            subscriber[0].subscribeToVideo(isSubscriberVideo)
            return console.log('onClickSubscriberVVVVideoToggle nowSubscriber 22222 : ', subscriber)
        }
    },[isSubscriberVideo])





    /**
     * --------------------------------------------
     * GETTING A TOKEN FROM YOUR APPLICATION SERVER
     * --------------------------------------------
     * The methods below request the creation of a Session and a Token to
     * your application server. This keeps your OpenVidu deployment secure.
     *
     * In this sample code, there is no user control at all. Anybody could
     * access your application server endpoints! In a real production
     * environment, your application server must identify the user to allow
     * access to the endpoints.
     *
     * Visit https://docs.openvidu.io/en/stable/application-server to learn
     * more about the integration of OpenVidu in your application server.
     */
    const getToken = async () => {
        const sessionId = await createSession(mySessionId);
        return await createToken(sessionId);
    }

    const createSession = async (sessionId) => {
        const response = await axios.post(APPLICATION_SERVER_URL + 'api/sessions', { customSessionId: sessionId }, {
            headers: { 'Content-Type': 'application/json', },
        });
        return response.data; // The sessionId
    }

    const createToken = async (sessionId) => {
        const response = await axios.post(APPLICATION_SERVER_URL + 'api/sessions/' + sessionId + '/connections', {}, {
            headers: { 'Content-Type': 'application/json', },
        });
        console.log('토큰 : ' , response.data)
        return response.data; // The token
    }


    
    
    const joinSession = (e) => {
        e.preventDefault()
        
        let OV = new OpenVidu();
        OV.enableProdMode();
        
        //setOV(OV)

        let mySession = OV.initSession();
        setSession(mySession)
    // --- 3) Specify the actions when events take place in the session ---

    // On every new Stream received...
        mySession.on('streamCreated', (event) => {
            // Subscribe to the Stream to receive it. Second parameter is undefined
            // so OpenVidu doesn't create an HTML video by its own


            const newSubscriber = mySession.subscribe(event.stream, undefined);
            console.log('입장 아이디 : ', event.stream.connection.connectionId)
            const newSubscribers = subscribers
            newSubscribers.push(newSubscriber)
            setSubscribers([...newSubscribers])
            console.log('subscribers !#!## ::: ', subscribers)
        });
        // On every Stream destroyed...
        mySession.on('streamDestroyed', (event) => {
            deleteSubscriber(event.stream.streamManager);
            console.log('event.stream.typeOfVideo !@!@!@!@ : ' , event.stream)
            console.log('퇴장 @@@ : ', event.stream.connection.connectionId)
            //deleteSubscriber(event.stream.connection.connectionId);

        });
        // On every asynchronous exception...
        mySession.on('exception', (exception) => {
            console.warn(exception);
        });

        const connection = () => {
        // --- 4) Connect to the session with a valid user token ---
            getToken()
            .then((token)=>{
                mySession.connect(token, { clientData: myUserName })
                .then(async () => {
                    
                    
                    OV.getUserMedia({
                        audioSource: false,
                        videoSource: undefined,
                        resolution: '1280x720',
                        frameRate: 10,
                    }).then((mediaStream) => {
                        var videoTrack = mediaStream.getVideoTracks()[0];
                        //var currentVideoDeviceId = publisher.stream.getMediaStream().getVideoTracks()[0].getSettings().deviceId;
                    //var currentVideoDevice = videoDevices.find(device => device.deviceId === currentVideoDeviceId);
                    //const videoSource = videoDevices[0].deviceId
                    let publisher = OV.initPublisher(
                        myUserName, 
                        {
                        audioSource: undefined, // The source of audio. If undefined default microphone
                        videoSource: videoTrack, // The source of video. If undefined default webcam
                        publishAudio: true, // Whether you want to start publishing with your audio unmuted or not
                        publishVideo: true, // Whether you want to start publishing with your video enabled or not
                        resolution: '680x480', // The resolution of your video
                        frameRate: 30, // The frame rate of your video
                        insertMode: 'APPEND', // How the video is inserted in the target element 'video-container'
                        mirror: true, // Whether to mirror your local video or not
                        }
                    );
                    publisher.once('accessAllowed', async () => {
                        mySession.publish(publisher);
                        const devices = await OV.getDevices()
                        const videoDevices = devices.filter(device => device.kind === 'videoinput');
                        //const currentVideoDeviceId2 = publisher.stream.getMediaStream().getVideoTracks()[0].getSettings().deviceId;
                        const currentVideoDeviceId = videoDevices[0].deviceId
                        const currentVideoDevice = videoDevices.find(device => device.deviceId === currentVideoDeviceId);
                        console.log('currentVideoDevice @@@@@@@@ : ', currentVideoDevice)

                        //setPublisher(publisher)
                        setCurrentVideoDevice(currentVideoDevice)
                        setPublisher(publisher);
                        setMainStreamManager(publisher)
                    });
                    })

                    
                })
                .catch((error) => {
                    console.log('There was an error connecting to the session:', error.code, error.message);
                });
            })
        }
        connection()
    }

    const leaveSession = () => {

        const mySession = session

        if(mySession){
            mySession.disconnect();
        }

        setMySessionId('SessionA')
        setMyUserName('Participant' + Math.floor(Math.random() * 100))
        setMainStreamManager(undefined)

        setSession(undefined)
        setSubscribers([])
        setPublisher(undefined)
    }

    const switchCamera = async () => {
        let OV = new OpenVidu();
        try {
            const devices = await OV.getDevices()
            var videoDevices = devices.filter(device => device.kind === 'videoinput');
            console.log('devices : ' , devices)
            console.log('videoDevices : ' , videoDevices)

            if (videoDevices && videoDevices.length > 1) {

                var newVideoDevice = videoDevices.filter(device => device.deviceId !== currentVideoDevice.deviceId)

                if (newVideoDevice.length > 0) {
                    // Creating a new publisher with specific videoSource
                    // In mobile devices the default and first camera is the front one
                    var newPublisher = OV.initPublisher(undefined, {
                        videoSource: newVideoDevice[0].deviceId,
                        publishAudio: true,
                        publishVideo: true,
                        mirror: true
                    });

                    //newPublisher.once("accessAllowed", () => {
                    await session.unpublish(mainStreamManager)
                    await session.publish(newPublisher)
                    setCurrentVideoDevice(newVideoDevice[0])
                    setMainStreamManager(newPublisher)
                    setPublisher(newPublisher)
                }
            }
        } catch (e) {
            console.error(e);
        }
    }

    
        //const mySessionId = stateOv.mySessionId;
        //const myUserName = stateOv.myUserName;
        
        return (
            <div className="container">
                {session === undefined ? (
                    <div id="join">
                        <div id="img-div">
                            <img src="resources/images/openvidu_grey_bg_transp_cropped.png" alt="OpenVidu logo" />
                        </div>
                        <div id="join-dialog" className="jumbotron vertical-center">
                            <h1> Join a video session </h1>
                            <form className="form-group" onSubmit={(e)=>{joinSession(e)}}>
                                <p>
                                    <label>Participant: </label>
                                    <input
                                        className="form-control"
                                        type="text"
                                        id="userName"
                                        value={myUserName}
                                        //onChange={handleChangeUserName}
                                        onChange={(e)=>{setMyUserName(e.target.value)}}
                                        required
                                    />
                                </p>
                                <p>
                                    <label> Session: </label>
                                    <input
                                        className="form-control"
                                        type="text"
                                        id="sessionId"
                                        value={mySessionId}
                                        onChange={(e)=>{setMySessionId(e.target.value)}}
                                        required
                                    />
                                </p>
                                <p className="text-center">
                                    <input className="btn btn-lg btn-success" name="commit" type="submit" value="JOIN" />
                                </p>
                            </form>
                        </div>
                    </div>
                ) : null}

                {session !== undefined ? (
                    <>
                    <div id="session">
                        <div id="session-header">
                            <h1 id="session-title">{mySessionId}</h1>
                            <input
                                className="btn btn-large btn-danger"
                                type="button"
                                id="buttonLeaveSession"
                                onClick={leaveSession}
                                value="Leave session"
                            />
                            <input
                                className="btn btn-large btn-success"
                                type="button"
                                id="buttonSwitchCamera"
                                onClick={switchCamera}
                                value="Switch Camera"
                            />
                        </div>

                        {mainStreamManager !== undefined ? (
                            <div id="main-video" className="col-md-6">
                                <UserVideoComponent streamManager={mainStreamManager} />
                                <button onClick={onClickPublisherAudioToggle}>내 오디오 {isPublisherAudio}</button>
                            </div>
                        ) : null}
                        <div id="video-container" className="col-md-6">
                            {publisher !== undefined ? (
                                <>
                                {console.log('publisher 😎 # ',publisher)}
                                <div className="stream-container col-md-6 col-xs-6" onClick={() => handleMainVideoStream(publisher)}>
                                    <span>(나)</span>
                                    <UserVideoComponent
                                        streamManager={publisher} />
                                </div>
                                </>
                            ) : null}
                            {subscribers?.map((sub, i) => 
                                (
                                <>
                                    {console.log('맵 sub id @@@@@@', `${sub.stream.session.options.sessionId + Date.now() + Math.floor(Math.random() * 100)}`)}
                                    {console.log('맵 sub # ',JSON.parse(sub.stream.connection.data).clientData)}
                                <div key={sub.id} className="stream-container col-md-6 col-xs-6" onClick={() => handleMainVideoStream(sub)}>
                                    <span>{JSON.parse(sub.stream.connection.data).clientData} 님</span>
                                    <UserVideoComponent streamManager={sub} />
                                </div>
                                <button onClick={()=>{onClickSubscriberAudioToggle(sub.stream.connection.session.token)}}>{JSON.parse(sub.stream.connection.data).clientData} 님 오디오 {isSubscriberAudio}</button>
                                <button onClick={()=>{onClickSubscriberVideoToggle(sub.stream.connection.session.token)}}>{JSON.parse(sub.stream.connection.data).clientData} 님 비디오 {isSubscriberAudio}</button>
                                </>
                                )
                            )}
                        </div>
                    </div>








                    {/* canvas
                        <CanvasTest/>
                    */}
                    


                    </>
                ) : null}
            </div>
        );
}

export default Main;
