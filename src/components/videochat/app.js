import React, { Component, useState, useRef } from 'react';
import Pusher from 'pusher-js';
import Peer from 'simple-peer';
import autoBind from 'react-autobind';
import Axios from 'axios'
import Cookies from 'js-cookie'

import {Link, Redirect } from "react-router-dom";
import Logo from '../logo'


import { Paper, IconButton, CircularProgress} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import {Navbar, Nav, Button, Row, Col, Popover, OverlayTrigger, Collapse} from 'react-bootstrap'
import {FaPhoneSlash, FaPhone, FaVideo, FaCheck} from 'react-icons/fa'
import {GoClippy} from 'react-icons/go'
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
            <Header {...props} />
            {
                calling || isPatient ?
                    <ElemenetsCall patient={patient} {...props} medecin ={isMedecin} regenereLien={() => setCalling(false)} /> :
                    <AddPatient {...props} idIdGenerated={(patient) => switchPage(patient)} medecin={medecin} />  
            }
            
        </section>
    )
}
function Header(){
    const [isToggle, setIsToggled] = useState(false)
    return(
        <header className="header-call">
             <Navbar collapseOnSelect={true} onToggle={(etat) => setIsToggled(!etat)} style={{background: "#61ccff", boxShadow: "0px 0px 30px rgba(73, 78, 92, 1)", padding: 0}} expand="lg" as="nav">
                <Row className="lg-mx-5 w-100"> 
                    <Col lg="4" md="12" className="logo-container">
                        <Row>
                            <span to="/" className="navbar-brand"  > <Logo /> </span>
                            <Navbar.Toggle aria-expanded={isToggle} aria-controls="basic-navbar-nav" className="mx-5 button-toggle" >
                                <span className="icon-bar"></span>
                                <span className="icon-bar"></span>
                                <span className="icon-bar"></span>
                            </Navbar.Toggle>
                        </Row>
                    </Col>
                    <Col lg={{ span: 6, offset: 2 }} id="nav-container">  
                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav  as="ul" className="nav menu_nav" >
                            <Nav.Item as="li"><Nav.Link as={Link} href='/' to="/"> accueil</Nav.Link></Nav.Item>
                            <Nav.Item as="li"><Nav.Link as={Link} href='/about' to="/about">a propos</Nav.Link></Nav.Item>
                            <Nav.Item as="li"><Nav.Link as={Link} href='/contact' to="/contact">contact</Nav.Link></Nav.Item>  
                        </Nav>
                    </Navbar.Collapse>
                    </Col>
                </Row>
            </Navbar>

        </header>
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
            Axios.post(`http://localhost:5000/video-call/patient`, { id: id, name: this.patientId})
            .then((res) => {
            this.setupPusher(res.data.token);
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
            authEndpoint: 'http://localhost:5000/video-call/start',
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
        const { timerTime, timerStart, timerOn, isCallVideo, isCallAudio, responding } = this.state;
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
                                <p className="text-center caller" style={{maxHeight: "20%"}}>  une appel entrante de la part de votre médecin <span className="name-caller">{this.state.callFrom}</span>  </p>
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
                                   ici vous aurez la possibiliter d'appeler votre patient 
                                </h3>
                            </Row>
                            <Row className="justify-content-around mx-5">
                            <h4>
                                verifiez que votre patient a bien entrée sur la page d'appel avant de passer l'appel
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
                                    regénerer un autre lien
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
                    <h4>ici vous pouvez communiquez avec votre médecin</h4>
                </Row>
                <Row className="justify-content-center my-5">
                <p>
                    bonjours chère utilisateur bienvenue dans votre plateforme Pelia on est content de vous voir aujourd'hui
                </p>
                <p>
                    votre médecin à était notifier par votre présence ici il va vous appelez dans quelque instent veillez patientez
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
    const [patient, setPatient] =useState("lsdsdjskdj")
    const [copySuccess, setCopySuccess] = useState(false)
    const [generteSuccess, setGenerateySuccess] = useState(false)

    // const anchorEl = currentTarget
    var refTextarea = useRef("");

    const genereId = () =>{
        let idGenerated =  Math.random().toString(36).substr(3, 9)
        refTextarea.current.value = "http://localhost:3000/video-call/" + idGenerated;
        setPatient(idGenerated)
        setGenerateySuccess(true)
    }
    const copyCodeToClipboard = (e) => {
        e.preventDefault()
        refTextarea.current.select()
        document.execCommand("copy")
        setCopySuccess(true)
        setTimeout(() => {
            props.idIdGenerated(patient)
        }, 3000);
      }

    return(
        <div className="generate-container"> 
        <Col>
            <Row className="text-center justify-content-around mt-5">
                <h3>
                    bonjour chère médecins <span style={{color:"#038DFE"}}> {props.medecin} </span>  bienvenue sur votre éspace utilisateur
                </h3>
            </Row>
            <Row className="my-5 justify-content-around ">
                <Button variant="success" onClick={genereId}> {generteSuccess ? "regénérer un autre lien": "generer un lien"}  </Button>
            </Row>
            <Row className="my-5 justify-content-around ">
            <Collapse in={generteSuccess}>
                <div className= "link-container" style={{width:"70%"}} id="example-collapse-text">
                    <div >
                        <Paper component="form" onSubmit={copyCodeToClipboard}>
                            <input className="MuiInputBase-input" type="text"  ref={refTextarea}  />
                            <OverlayTrigger delay={{ show: 250, hide: 400 }} trigger= {['hover', 'focus']} placement="top" overlay={popover}>
                            <IconButton style={ !copySuccess ? {backgroundColor:" rgb(168, 168, 168)"} : {backgroundColor: "rgba(0, 242, 96, 1)"}} className="copy-button" type="submit" aria-label="coupier le lien">
                                <GoClippy color="#000" />
                            </IconButton>
                            </OverlayTrigger>

                        </Paper>
                    </div>                   
                   {copySuccess &&
                   <Col>
                    <Row className="justify-content-around mx-5">
                       <p>
                           vous serez redirigez vers la page des appels dans quelque instant vous pouvez toujours acceder au lien de votre patient au cas où vous l'avez perdue
                       </p> 
                      
                    </Row>
                    <Row  className="justify-content-around mx-5">
                    <CircularProgress size={32} 
                       style={{color: "rgb(0, 242, 96)"}}/>
                    </Row>
                   </Col>
                  
                   }
                </div>
                        
            </Collapse>
                
            </Row> 
        </Col>
                      
        </div>
    )
}

const popover = (
    <Popover id="popover-basic">
      <Popover.Title as="h3">copier automatique</Popover.Title>
      <Popover.Content>
        afin de copier le lien <strong> et afficher </strong> la page d'appel clicker ici
      </Popover.Content>
    </Popover>
  );
  
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

