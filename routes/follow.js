'user strict'

const express=require('express');
const FollowController=require('../controllers/follow.js')
const api=express.Router();
const md_auth=require('../middlewares/autenticate.js')

api.post('/follow',md_auth.ensureAuth,FollowController.saveFollow)
api.delete('/follow/:id',md_auth.ensureAuth,FollowController.deleteFollow)
api.get('/following/:id?/:page?',md_auth.ensureAuth,FollowController.getFollowingUsers)
api.get('/followed/:id?/:page?',md_auth.ensureAuth,FollowController.getFollowedUsers)
api.get('/get-my-follows/:followed?',md_auth.ensureAuth,FollowController.getMyFollows)

module.exports=api;