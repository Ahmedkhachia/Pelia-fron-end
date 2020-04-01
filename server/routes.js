const express = require('express');
const VideoCallController = require('./VideoCallController');
const AuthMiddlewhere = require('./middleware/auth')
const router = express.Router();

const {  body } = require('express-validator');

router.post('/video-call/start', AuthMiddlewhere, VideoCallController.lanceVideocall);


router.post('/login' , [
    body('password').isLength({ min: 6}),
    body('email').isEmail().isLength({ min: 10})
  ], VideoCallController.auth);


router.post('/video-call/patient', VideoCallController.authPatient);


module.exports = router;