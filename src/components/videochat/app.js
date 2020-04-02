import React, { Component, useState } from 'react';
import Pusher from 'pusher-js';
import Peer from 'simple-peer';
import autoBind from 'react-autobind';
import Axios from 'axios'
import Cookies from 'js-cookie'

import { Redirect } from "react-router-dom";

import baseUrl from './../../config'

import {IconButton, CircularProgress, TextField} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Button, Row, Col} from 'react-bootstrap'
import {FaPhoneSlash, FaPhone, FaVideo, FaCheck} from 'react-icons/fa'
import {TiMessages} from 'react-icons/ti'

import callerTone from './../../assets/media/callertone.mp3'

import './../../assets/css/video-call.css';

// Cookies.set("medecinAuth", "adil")

export default function CallUsers(props){
    let medecin = Cookies.get('medecinAuth')
    let isMedecin = (medecin === undefined) ? false: true;
    const [calling, setCalling] = useState(false);
    const [patient, setPatiet] = useState(props.match.params.name)
    let isPatient = (props.match.params.name === undefined) ? false : true;
    
    const switchPage = (patient) =>{
        setPatiet(patient)
        setCalling(true)
    }
    if(!isPatient && !isMedecin ){
        return(
            <Redirect to="/" />
        )
    }
    return(
        <section>
            { calling || isPatient ?
                    <ElemenetsCall patient={patient} {...props} medecin ={isMedecin} regenereLien={() => setCalling(false)} /> :
                    <AddPatient {...props} idIdGenerated={(patient) => switchPage(patient)} medecin={medecin} />  
            }
        </section>
    )
}

class ElemenetsCall extends Component {
    constructor(props) {
        super(props);
        autoBind(this);
        this.state = {
            timerOn: false,
            timerStart: 0,
            timerTime: 0,
            isMedecin : props.match.params.name === undefined ? true : false,
            user : { prenom : ""},
            stream: null
        };
        this.peers = {};
        this.patientId = props.patient
    }

    componentDidMount() {
        
        if(this.state.isMedecin){
            // let user = this.props.medecin
            let token = Cookies.get('token')
            let userObject = JSON.parse(Cookies.get('user'))
            this.setState({user: userObject})
            setTimeout(() => {
                this.setupPusher(token); 
            }, 1000);
        }else{
                // Math.random should be unique because of its seeding algorithm.
                // Convert it to base 36 (numbers + letters), and grab the first 9 characters
                // after the decimal.
            let id = Math.random().toString(36).substr(3, 5);
            this.setState({user: {prenom: this.patientId}})
            Axios.post(`${baseUrl.node}video-call/patient`, { id: id, name: this.patientId})
            .then((res) => {
            this.setupPusher(res.data.access_token);
            }).catch((r) => console.error(r))
        }
    }
    componentDidUpdate(){
        let {stream, isCallVideo, isCallAudio, responding, isMedecin} = this.state
        if(isCallVideo && !responding){
            try {
                this.myVideo.srcObject = stream
            } catch (e) {
                this.myVideo.src = URL.createObjectURL(stream)
            }
            this.myVideo.play();
        }
        else if(isCallAudio && !responding){
            try {
                this.myAudio.srcObject = stream;
            } catch (e) {
                this.myAudio.src = URL.createObjectURL(stream)
            }
            this.myAudio.play();
        }
        if((isCallAudio || isCallVideo) && !responding && ! isMedecin){
            try {
                this.callerTone.src = callerTone
            } catch (e) {
                this.callerTone.srcObject =  URL.createObjectURL(callerTone) 
            }
            this.callerTone.play();
        }
    }

    initiatorCallVideo(){
        return new Promise((res, rej) => {
            navigator.mediaDevices.getUserMedia({video: true, audio: true})
                .then((stream) => {
                    this.setState({ stream : stream, isCallVideo:true})
                    res(stream);
                })
                .catch(err => {
                    throw new Error(`Unable to fetch stream ${err}`)
                })
        });
    }

    initiatorCallAudio(){
        return new Promise((res, rej) => {
            navigator.mediaDevices.getUserMedia({audio: true})
                .then((stream) => {
                    this.setState({stream : stream, isCallAudio:true});
                    res(stream);
                })
                .catch(err => {
                    throw new Error(`Unable to fetch stream ${err}`);
                })
        });
    }

    setupPusher(token) {
        this.pusher = new Pusher('2e923196325bd5eddb8c', {
            authEndpoint: `${baseUrl.node}video-call/start`,
            cluster: 'eu',
            auth: {
                params: this.state.user.prenom,
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        });

        this.channel = this.pusher.subscribe('presence-video-channel');
        this.channel.bind(`client-signal-${this.state.user.prenom}`, (signal) => {
            let peer = this.peers[signal.userName];
            // if peer is: not already exists, we got an incoming call
            if(peer === undefined) {
                peer = this.startPeer(signal.userName, false);
            }
            this.setState({responding: true})
            this.startTimer()
            peer.signal(signal.data);
        });
        this.channel.bind(`client-call-${this.state.user.prenom}`, (msg) =>{
            if(msg.type === "call-video"){
                this.initiatorCallVideo()
                .then((stream) =>{
                    this.setState({callReceived: true, callFrom: msg.data.from})
                })
            }else{
                this.initiatorCallAudio()
                .then((stream) =>{
                    this.setState({callReceived: true, callFrom: msg.data.from})
                })
            }
        })
        this.channel.bind(`client-reject-${this.state.user.prenom}`, (msg) =>{
            this.setState({callRejected: true})
            let peer = this.peers[msg.userName];
            if(peer !== undefined) {
                peer.destroy();
            }else{
                this.rejectCall(this.patientId)
            }
            this.setState({rejectingProcess:false, isCallVideo:false, isCallAudio:false, stream : null})
        })
    }

    startPeer(userName, initiator = true) {
        const peer = new Peer({
            initiator,
            stream: this.state.stream,
            trickle: false
        });

        peer.on('signal', (data) => {
            this.channel.trigger(`client-signal-${userName}`, {
                type: 'signal',
                userName: this.state.user.prenom,
                data: data
            })
        })
        peer.on('stream', (stream) => {
            if(this.state.isCallVideo){
                try {
                    this.userVideo.srcObject = stream;
                } catch (e) {
                    this.userVideo.src = URL.createObjectURL(stream)
                }
                this.userVideo.play();
            }else{
                try {
                    this.userAudio.srcObject = stream;
                } catch (e) {
                    this.userAudio.src = URL.createObjectURL(stream)
                }
                this.userAudio.play();
            }
            this.setState({passingCall: true, respondingProcess:false })
        })
        peer.on('close', () => {
            let peer = this.peers[userName];
            if(peer !== undefined) {
                peer.destroy();
            }
            this.setState({passingCall: false})
            this.peers[userName] = undefined;
            this.stopTimer()
        })
        return peer;
    }
    callVideoTo(){
        this.setState({passingCallVideoPocess: true})
        this.initiatorCallVideo()
        .then(stream =>{
            this.channel.trigger(`client-call-${this.patientId}`, {
                type: 'call-video',
                userName: this.state.user.prenom,
                data:{from: this.state.user.prenom}
            })
            this.setState({passingCallVideoPocess: false})

        })
    }
    callTo() {
        this.setState({passingCallPocess: true})
        this.initiatorCallAudio().then(stream =>{
            this.channel.trigger(`client-call-${this.patientId}`, {
                type: 'call-audio',
                userName: this.state.user.prenom,
                data:{from: this.state.user.prenom}
            });
            this.setState({passingCallPocess: false})
        })
    }
    confirmCall(){
        this.peers[this.state.callFrom] = this.startPeer(this.state.callFrom);
        this.peers[this.patientId] = this.startPeer(this.patientId, false);
        this.setState({callReceived: false, respondingProcess: true})
    }
    rejectCall(userName){
        this.channel.trigger(`client-reject-${userName}`, {
            type: 'reject-call',
            userName: this.state.user.prenom
        });
        this.setState({callReceived: false, rejectingProcess:true})
    }
    resetTimer() {
        this.setState({
          timerStart: 0,
          timerTime: 0
        });
    }
       stopTimer() {
        this.setState({ timerOn: false });
        clearInterval(this.timer);
      }
       startTimer() {
        this.setState({ 
            timerOn: true,
            timerTime: this.state.timerTime,
            timerStart: Date.now() - this.state.timerTime
         });

        this.timer = setInterval(() => {
            this.setState({
                timerTime: Date.now() - this.state.timerStart
              });           
        }, 1000);      
    };
    render() {
        //  timerStart, timerOn,
        const { timerTime, isCallVideo, isCallAudio, responding } = this.state;
        let seconds = ("0" + (Math.floor(timerTime / 1000) % 60)).slice(-2);
        let minutes = ("0" + (Math.floor(timerTime / 60000) % 60)).slice(-2);
        let hours = ("0" + Math.floor(timerTime / 3600000)).slice(-2);

        return (
            <div className="video">
                
                <div className="container-fluid">
                { isCallVideo &&
                    <Row className={responding && "repondre"}>
                        <video id="peerVid" ref={(ref) => {this.userVideo = ref;}}></video>
                        <video className="my-video" id="myVid" ref={(ref) => {this.myVideo = ref;}}></video>
                    </Row>
                }
                { isCallAudio &&
                <Row className={responding && "repondre"}>
                    <audio id="peerAudio" ref={(ref) => {this.userAudio = ref;}}> </audio>
                    <audio id="myAudio" ref={(ref) => {this.myAudio = ref;}}> </audio>
                </Row>
                } 
                    
                
                { (isCallVideo || isCallAudio) &&
                    <Row className="responding">
                        
                        { !this.state.passingCall &&
                        <Row className = "w-100">
                            <div className="layer"></div>
                            <Row className="text-center d-flex justify-content-around w-100 m-5">
                                 { !this.state.isMedecin &&
                                <p className="text-center caller" style={{maxHeight: "20%"}}> Un appel entrant de la part de votre médecin
                                <span className="name-caller">{this.state.callFrom}</span>  </p>
                            }
                            </Row>
                           { !this.state.isMedecin &&
                               <audio ref={ref => this.callerTone = ref} />
                           }
                        </Row>    
                        }
                        { this.state.isMedecin &&
                            <div className="end-call">
                                <ButtonProcess 
                                        className="action" 
                                        onClick={() => this.rejectCall(this.patientId)} 
                                        type="button"   
                                        variant="danger" 
                                        success={false} 
                                        valeur="" 
                                        sending={this.state.respondingProcess} 
                                        IconSuccess={FaCheck} 
                                        Icon={<FaPhoneSlash size="1.5rem" />}
                                    />
                            </div>
                        }
                        { !this.state.isMedecin &&
                            <div className="end-call">
                                <ButtonProcess 
                                        className="action" 
                                        onClick={() => this.rejectCall(this.state.callFrom)} 
                                        type="button"   
                                        variant="danger" 
                                        success={false} 
                                        valeur="" 
                                        sending={this.state.rejectingProcess} 
                                        IconSuccess={FaCheck} 
                                        Icon={<FaPhoneSlash size="1.5rem" />}
                                    />
                                { !this.state.passingCall &&
                                    <ButtonProcess 
                                        className="action" 
                                        onClick={this.confirmCall} 
                                        type="button"   
                                        variant="success" 
                                        success={false} 
                                        valeur="" 
                                        sending={this.state.respondingProcess} 
                                        IconSuccess={FaCheck} 
                                        Icon={<FaPhone size="1.5rem" />}
                                    />
                                }
                                { !this.state.passingCall &&
                                    <ButtonProcess 
                                        className="action" 
                                        type="button"   
                                        variant="light" 
                                        success={false} 
                                        valeur="" 
                                        sending={this.state.messagingProcess} 
                                        IconSuccess={FaCheck} 
                                        Icon={<TiMessages size="1.5rem" />}
                                    />
                                    
                                }
                                
                            </div>
                        }
                    </Row>
                }
                <Row className="mt-2">   
                    { this.state.passingCall &&
                            <Col sm="12" className="text-center m-5">
                                <span> {hours} h:</span>
                                <span> {minutes} m:</span>
                                <span> {seconds} s</span>
                            </Col>  
                    }         
                   
                    { this.state.isMedecin && !(isCallVideo || isCallAudio ) &&
                        <Col sm="12" className="text-center mt-5">
                            <Row className="justify-content-around mx-5">
                                <h3>
                                vous aurez le choix d'appeler votre patient par un appel vidéo ou appel vocal. 
                                </h3>
                            </Row>
                            <Row className="justify-content-around mx-5">
                            <h4>
                            Vérifiez que votre patient est bien entrée sur la page d'appel avant de passer l'appel.
                            </h4>
                            </Row>
                            <Row className="justify-content-around mx-5">
                                <ButtonProcess 
                                    className="action" 
                                    onClick={this.callTo} 
                                    type="button"   
                                    variant="success" 
                                    success={false} 
                                    valeur="" 
                                    sending={this.state.passingCallPocess} 
                                    IconSuccess={FaCheck} 
                                    Icon={<FaPhone size="1.5rem" />}
                                />
                                <ButtonProcess 
                                    className="action" 
                                    onClick={this.callVideoTo} 
                                    type="button"   
                                    variant="info" 
                                    success={false} 
                                    valeur="" 
                                    sending={this.state.passingCallVideoPocess} 
                                    IconSuccess={FaCheck} 
                                    Icon={<FaVideo size="1.5rem" />}
                                />
                            </Row>
                            <Row className="justify-content-around mx-5">
                                <Button onClick={() => this.props.regenereLien()}>
                                Régénérer un autre lien
                                </Button>
                            </Row>

                        </Col>
                    }
                    { !this.state.isMedecin && !(isCallVideo || isCallAudio ) &&
                        <Col sm="12" className="text-center">
                                <PatientAcceuil />
                        </Col>
                    }
                </Row>
                </div>
            </div>
        );
    }
}

function PatientAcceuil() {
    return(
            <Col>
                <Row className="justify-content-center my-5">
                    <h4>ici vous pouvez communiquer avec votre médecin</h4>
                </Row>
                <Row className="justify-content-center my-5">
                <p>
                Bonjours cher utilisateur bienvenue dans votre plateforme Pelia on est content de vous voir aujourd'hui
                </p>
                <p>
                votre médecin a été notifier par votre présence ici il va vous appeler dans quelques instants veillez patientez.
                </p>
                </Row>
                <Row className="justify-content-center my-5">
                <CircularProgress size={24} 
                       style={{color: "#8dc63f"}}/>
                </Row>
            </Col>
    )
}

function AddPatient(props){
    const [patient, setPatient] =useState(Math.random().toString(36).substr(3, 9))
    const [copySuccess, setCopySuccess] = useState(false)


    const genereId = () =>{
        let idGenerated =  Math.random().toString(36).substr(3, 9)
        setPatient(idGenerated)
    }
    const copyCodeToClipboard = (e) => {
        e.preventDefault()
        setCopySuccess(true)
        setTimeout(() => {
            props.idIdGenerated(patient)
        }, 400);
      }
      const handleChange =(e) =>{
          if(e.target.name === "link"){
            e.target.select()
          }
         
      }
      
 
    return(
        <div className="generate-container"> 
        <Col>
            <Row className="text-center justify-content-around mt-5">
                <h3>
                    bonjour cher médecin <span style={{color:"#038DFE"}}> {props.medecin}</span>. Bienvenue dans votre espace utilisateur.
                </h3>
            </Row>
            <Row className="my-5 justify-content-around ">
                <div className= "link-container" style={{width:"70%"}} id="example-collapse-text">
                    <Col >
                        <Row>
                            <TextField 
                            id="standard-basic" 
                            label="Il faut envoyer le lien d’invitation au patient affin qi il puisse vous rejoindre dans l'appel" 
                            fullWidth
                            onChange={handleChange}
                            onClick={handleChange}
                            name="link"
                            helperText="si vous avez partagé ce lien avec votre patient clicker sur le bouton pour aller à la page de l'appel"
                            value={`${baseUrl.overlays}/profil/medecin/` + patient} 
                            />
                        </Row>
                        <Row className="my-4 justify-content-around">
                            <IconButton onClick={copyCodeToClipboard} className={ !copySuccess ? "copy-button" : "copy-button copy-success"} type="button" aria-label="coupier le lien">
                                Démarrer la vidéo conférence
                            </IconButton>
                            <IconButton className="copy-button" onClick={genereId}>Générer un autre lien </IconButton>
                        </Row>                        
                    </Col>                   
                </div>                
            </Row> 
        </Col>
                      
        </div>
    )
}

  
const useStyles = makeStyles(theme => ({
    wrapper: {
      margin: theme.spacing(1),
      display:"flex",
      justifyContent:"center",
      position: 'relative',
    },
    buttonProgress: {
      color: "#8dc63f",
      position: 'absolute',
      top: '50%',
      left: '50%',
      marginTop: -12,
      marginLeft: -12,
    },
  }));

function ButtonProcess(props) {
  const classes = useStyles();
  return (
      <div className={classes.wrapper} style={{width:"20%"}}>
        <Button
        onClick={props.onClick}
        className={props.className}
          type={props.type}
          variant= {props.variant}
          disabled={props.sending}
        >
          {props.valeur}
          {props.success ? <props.IconSuccess /> : props.Icon }
        </Button>
        {props.sending && <CircularProgress size={24} className={classes.buttonProgress} />}
      </div>
  );
}

