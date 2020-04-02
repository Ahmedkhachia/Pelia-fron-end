import React, { Component } from 'react'
import { Navbar, Nav, Col, Row } from 'react-bootstrap';
import {Link } from "react-router-dom";
import autoBind from 'react-autobind';

import Logo from '../logo'

import Cookies from 'js-cookie'

let lang = Cookies.get('lang')
lang = (lang === undefined)? "fr" : lang

let style = (lang === "ar")? {
  all:{
    direction: 'rtl',
  },
  logo:{
    marginRight: "25px",
    marginLeft: 0
  }
}: {

}
export default class NavbarPublic extends Component {
    constructor(props) {
        super(props);
        autoBind(this);
        this.state = {
          activeKey: null,
          colapsed: false
        };
      }
      movingHoriselector(activeElement){
        let height, width, left, top;
        let hori = document.querySelector('.hori-selector')
        if(activeElement !== undefined && activeElement !== null ){
          

        if(activeElement.classList[0] === "inscription-btn"){
          let boutonElement =  document.querySelector('.bouton-container')
          height= activeElement.parentElement.clientHeight - 10
          width= activeElement.clientWidth
          left = activeElement.offsetLeft + boutonElement.offsetLeft 
          top = activeElement.parentElement.offsetTop +boutonElement.offsetTop
        }
        else{
          height=  activeElement.clientHeight -3
          width= activeElement.clientWidth
          left =  activeElement.offsetLeft + 15
          top =  activeElement.offsetTop  
        }
        hori.style.height = height + "px"
        hori.style.width = width + "px"
        hori.style.left = left + "px"
        hori.style.top = top + "px"
      }
      }

      isToggled(etat){
        this.setState({colapsed : etat})
        let hori = document.querySelector('.hori-selector')
        hori.style.height = 50 + "px"
        hori.style.width = window.innerWidth * 2 / 3 + "px"
        hori.style.left = window.innerWidth /3 + "px"
        hori.style.top = 0 + "px"

        if(etat){ 
          setTimeout(() => {
            let activeElement = document.querySelector('.nav-link.active')
            this.movingHoriselector(activeElement)
          }, 400);
        }
      }
      handleSelectRight(eventKey, e){
        this.setState({
          activeKey: eventKey
        });
        this.movingHoriselector(e.target.parentElement)
      }
      handleSelect(eventKey, e) {
        this.movingHoriselector(e.target)
        this.setState({
          activeKey: eventKey
        });
      }
      navbarFixing () {
          if(window.pageYOffset < 100)  {
              this.setState({navFix : false})
          }else{
            this.setState({navFix : true})
          }
      }
      
      componentDidUpdate(){
        let activeElement = document.querySelector('.nav-link.active')
        window.addEventListener("resize", () => this.movingHoriselector(activeElement) )
      }
      
      componentDidMount(){
        if(window.innerWidth > 991){
          let activeElement = document.querySelector('.nav-link.active')
          this.movingHoriselector(activeElement)
        }
      }

      componentWillUnmount() {
        window.removeEventListener("scroll", this.navbarFixing);
      }
    render() {

      const { location } = this.props;
        const {  colapsed } = this.state;
        return (
                <header className= "header_area">
                    <div className="main_menu">
                        <div className="nav-wrapper">
                          <Navbar collapseOnSelect={true}  onSelect={this.handleSelectRight}  expand="lg" as="nav" onToggle={this.isToggled}>
                                <Row className="lg-mx-5 w-100"> 

                                    <Col lg="2" md="12" className="logo-container" >
                                    <Row style={style.all}>
                                    <span to="/" style={style.logo} className="navbar-brand" ><Logo /> </span>
                                      <Navbar.Toggle aria-expanded={colapsed} aria-controls="basic-navbar-nav" className="mx-5" >
                                        <span className="icon-bar"></span>
                                        <span className="icon-bar"></span>
                                        <span className="icon-bar"></span>
                                      </Navbar.Toggle>
                                    </Row>
                                    </Col>
                                    <Col lg="10" id="nav-container">
                                        <Navbar.Collapse id="basic-navbar-nav">
                                        <div className="hori-selector">
                                            <div className="left"></div>
                                            <div className="right"></div>
                                            </div>
                                          <Col lg="6">
                                          <Nav 
                                            activeKey={location.pathname} 
                                            as="ul" 
                                            className="nav menu_nav">
                                          
                                            <Nav.Item as="li"><Nav.Link as={Link} href='/' to="/"> {content.home[lang]}</Nav.Link></Nav.Item>
                                            <Nav.Item as="li"><Nav.Link as={Link} href='/about' to="/about">{content.about[lang]}</Nav.Link></Nav.Item>
                                            <Nav.Item as="li"><Nav.Link as={Link} href='/contact' to="/contact">{content.contact[lang]}</Nav.Link></Nav.Item>  
                                        </Nav>
                                          </Col>
                                          <Col lg="6" className="bouton-container">
                                            <Nav as="ul"activeKey={location.pathname} style={style.all} className="nav justify-content-around" >
                                                <Nav.Item className="py-4" as="li">
                                                  <Nav.Link as={Link} href='/medecin' style={{lineHeight: "0"}} className="inscription-btn" to="/medecin"> 
                                                    <span className="inscrire navbar-right btn_btn">
                                                    {   content.medecin[lang] }
                                                    </span>
                                                  </Nav.Link> 
                                              </Nav.Item>
                                              <Nav.Item className="py-4" as="li">
                                              <Nav.Link style={{lineHeight: "0"}} className="inscription-btn" as={Link} href='/authentification' to="/authentification"> 
                                                  <span className="inscrire navbar-right btn_btn">
                                                  {content.inscription[lang]}
                                                  </span>
                                                </Nav.Link> 
                                              </Nav.Item>  
                                            </Nav>
                                          </Col>
                                      </Navbar.Collapse>
                                    </Col>
                                </Row>
                          </Navbar>
                        </div>
                    </div>
                </header>
        )
    }
}

let content ={
    home:{fr:"Accueil", ar:"الرئيسية"},
    about:{fr:"A propos de nous", ar:"عنا"},
    contact:{fr:"Contactez-nous", ar:"اتصل بنا"},
    inscription:{fr:"espace médecins", ar:"منطقة الأطبا"},
    medecin:{fr:"Vous êtes médecin?", ar:"هل انت طبيب"}
}
