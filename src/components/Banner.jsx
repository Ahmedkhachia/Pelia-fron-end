import React,{useState} from 'react';


import BannerAnim from 'rc-banner-anim';
import TweenOne from 'rc-tween-one';

// import WOW from 'wow.js'
import PeliaBanner from './../assets/img/pelia_banner.jpg'

import {FiPlay} from 'react-icons/fi'
import { Link } from 'react-router-dom';

import Cookies from 'js-cookie'

import ModalVideo from 'react-modal-video'



let lang = Cookies.get('lang')
lang = (lang === undefined)? "fr" : lang

let style = (lang === "ar")? {
  direction: 'rtl'  /* Right to Left */,
}: {

}

const { Element } = BannerAnim;
const BgElement = Element.BgElement;
export default function Banner() {
  const [isOpen, setIsopen] = useState(false)

  return (
      <div className="home">
 <BannerAnim
      autoPlay
      type="across"
      sync={true}
      autoPlaySpeed={10000}
      autoPlayEffect={false}
    children={VideoShow}
    >
      <Element key="aaa"
        prefixCls="banner-user-elem"
      >
        <BgElement
          key="bg"
          className="bg"
          style={{
            backgroundImage: `url(${PeliaBanner})`,
            backgroundSize: 'cover',
          }}
        />
       <div className="overlay-banner"></div>
        <TweenOne animation={{ y: 50, opacity: 0, type: 'from', delay: 200 }} name="TweenOne">
        <VideoShow elm = {0} isOpen={isOpen} setIsopen={setIsopen} />
        </TweenOne>
      </Element>
      <Element key="bbb"
        prefixCls="banner-user-elem"
      >
        <BgElement
          key="bg"
          className="bg"
          style={{
            backgroundImage: `url(${PeliaBanner})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
       <div className="overlay-banner"></div>
        <TweenOne animation={{ y: 50, opacity: 0, type: 'from', delay: 200 }} name="TweenOne">
        <VideoShow elm = {1} isOpen={isOpen} setIsopen={setIsopen} />
        </TweenOne>

      </Element>
      <Element key="ccc"
        prefixCls="banner-user-elem"
      >
        <BgElement
          key="bg"
          className="bg"
          style={{
            backgroundImage: `url(${PeliaBanner})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="overlay-banner"></div>
        <TweenOne animation={{ y: 50, opacity: 0, type: 'from', delay: 200 }} name="TweenOne">
        <VideoShow elm = {2} isOpen={isOpen} setIsopen={setIsopen} />
        </TweenOne>


      </Element>
      
    </BannerAnim>
    {/* <ModalVideo channel='youtube' isOpen={isOpen} videoId='lCcBEDPTk4o' onClose={() => setIsopen(false)} /> */}

      </div>

   
  );
}


function VideoShow(props) {
    return(
        <div className="container" style={{marginTop:"11%"}}>
        <div className="row">

              <div className="home-info">
                    <h1 data-wow-duration="700ms" data-wow-delay="500ms" 
                        className="wow bounceInDown animated" 
                        style={{color:'white'}}
                    >
                      <span className="bannerPelia" style={{fontFamily:'Pacifico',fontSize:'90px'}} >Pelia </span>
                      {content.title[props.elm][lang]}
                    </h1>
                    <Link style={style} data-wow-duration="700ms" data-wow-delay="500ms" to="/login" className="btn inscription-btn smoothScroll wow slideInUp animated"> <span > {content.button[lang]} </span> </Link>
              </div>
                {/* <div className="video-popup d-flex align-items-center">
                    <div className="play-video video-play-button animate" onClick={() => props.setIsopen(true)}>
                        <span><FiPlay color="#000" size="1.1rem" /></span>
                    </div>
                    <div className="watch">
                        <h4 style={style}>{content.video[lang]}</h4>
                        <p style={style}>{content.amuser[lang]} <span role="img" aria-label="souriant" >&#128513;</span></p>
                    </div>
                </div> */}

        </div>
    </div>
    )
    
}
const content ={
    title : [
        {
        ar: " تمنحك فرصة الاتصال بطبيب من المنزل" , 
        fr:" vous donne la possibilité de communiquer avec un médecin de chez vous"
    },{
        ar: "مع pelia لن تضطر إلى مغادرة منزلك لرؤية طبيبك" , 
        fr:"  ne vous laisse pas quitter votre domicile pour voir votre médecin"
    },{
        ar: " تقديم المشورة لك وتجعلك على دراية بمرضك" ,
        fr:"   vous conseille et vous sensibilisez envers votre maladie"
    }
],
    button: {ar:"ابدأ المغامرة", fr:"Commencer"},
    video:{ar: "شاهد الفيديو التوضيحي", fr:"Regarder la vidéo descriptive"},
    amuser:{ar:"مشاهدة ممتعة", fr:"Vision agréable !"}
}
