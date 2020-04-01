import React, { useState } from 'react';
import Avatar from '@material-ui/core/Avatar';
import CssBaseline from '@material-ui/core/CssBaseline';
import TextField from '@material-ui/core/TextField';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Link from '@material-ui/core/Link';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
// import LockOutlinedIcon from '@material-ui/icons/LockOutlined';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';

import {Row} from 'react-bootstrap'
import Button  from './../components/Button/index';

import {MdLockOpen, MdPersonAdd} from 'react-icons/md'
import PeliaBanner from './../assets/img/pelia_banner.jpg'
// import Axios
import Axios  from 'axios';
import { Redirect } from 'react-router-dom';
import Cookie from 'js-cookie'

const useStyles = makeStyles(theme => ({
 
  image: {
    backgroundImage: `url(${PeliaBanner})` ,
    backgroundRepeat: 'no-repeat',
    backgroundColor:
      theme.palette.type === 'dark' ? theme.palette.grey[900] : theme.palette.grey[50],
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  },
  paper: {
    margin: theme.spacing(8, 4),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  avatar: {
    margin: theme.spacing(1),
    backgroundColor: theme.palette.secondary.main,
  },
  form: {
    width: '100%', // Fix IE 11 issue.
    marginTop: theme.spacing(1),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
}));

export default function SignInSide() {
  const classes = useStyles();
  const [email, setPhone]= useState("")
  const [authentified, setAuthentified] = useState(false)
  const [pass, setPass]= useState("")
  const [success, setSuccess]= useState(false)
  const [sending, setSending]= useState(false)

  const handleChangephone = ( e ) =>{
    setPhone(e.target.value)
  }
  const handleChangePass = ( e ) =>{
    setPass(e.target.value)
  }
  const loginSending =(e) =>{
    e.preventDefault( )
    setSending(true)
    let data={
      email:email,
      password:pass
    }
    Axios.post(`http://localhost:5000/login` , data, {headers: {'Content-Type': 'application/json'}})
    .then(res => {
        Cookie.set("token",res.data.token);
        Cookie.set("user",res.data.user);
        Cookie.set("medecinAuth", res.data.user.nom)
        setAuthentified(true)
        setSuccess(true)
        setSending(false)

    })
    .catch((error) =>{ console.log(error)})
  }
  if(authentified){
    return (<Redirect to="/video-call" />)
  }
  return (
    <Grid container component="main" >
      <CssBaseline />
      <Grid item xs={false} sm={4} md={7} className={classes.image} />
      <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square>
        <div className={classes.paper}>
          <Avatar className={classes.avatar}>
            <MdLockOpen />
          </Avatar>
          <Typography component="h1" variant="h5">
            Se connecter
          </Typography>
          <form className={classes.form} noValidate onSubmit={loginSending}>
            <TextField
              margin="normal"
              required
              value={email}
              onChange={handleChangephone}
              fullWidth
              id="email"
              label="email"
              name="email"
              autoComplete="email"
              autoFocus
            />
            <TextField
              margin="normal"
              required
              value={pass}
              onChange={handleChangePass}
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
            />
            <FormControlLabel
              control={<Checkbox value="remember" color="primary" />}
              label="Remember me"
            />
            <Row className="align-items-center justify-content-around mt-4">
                <Button success={success} type="submit" icone={MdPersonAdd} sending={sending} valeur="S'authentifier" />
            </Row>
            <Grid container>
              <Grid item xs>
                <Link to="/login" variant="body2">
                  Mot de passe oublié?
                </Link>
              </Grid>
              <Grid item>
                <Link to="/login" variant="body2">
                  {"Vous n'avez pas un compte ? S'inscrire"}
                </Link>
              </Grid>
            </Grid>
            
          </form>
        </div>
      </Grid>
    </Grid>
  );
}