const express = require('express');
const router = express.Router();
const scheduling_db = require('../models/scheduling_db');
const {therapists} = scheduling_db.models;
const {therapist_schedule} = scheduling_db.models;

//Helper functions
const {
    scheduleHandler,
    therapistHandler
} = require('../includes/helpers')



router.get('/therapists',(req,res)=>{
    res.render('therapist');
});

router.post('/therapists',(req,res)=>{
    therapistHandler(therapists,req.body).then((msg)=>{

        res.render('therapist',msg);
    });
    
});

router.get('/schedule',(req,res)=>{
    therapists.findAll({
        attributes: ['id', 'first_name', 'last_name']
    })
    .then((result)=>{
        let therapists = JSON.parse(JSON.stringify(result)); 
        res.render('schedule',{therapists});
    });
});

router.post('/schedule',(req,res)=>{
    res.redirect(`/schedule/${req.body.therapist}`);
});

router.get('/schedule/:id',(req,res)=>{
    therapists.findAll({
        attributes: ['id', 'first_name', 'last_name'],
        where: {
            id: req.params.id
        }
    })
    .then((result)=>{
        let therapist = JSON.parse(JSON.stringify(result));
        if(therapist.length> 0){
            res.render('schedule', {therapist: therapist[0]});
        }
        else{
            let msg = {msg:'This therapist does not exist', msgType:'negMsg'};
            res.render('schedule',msg);
        }
    });
    
});

router.post('/schedule/:id',(req,res)=>{
    therapists.findAll({
        attributes: ['id', 'first_name', 'last_name'],
        where: {
            id: req.params.id
        }
    })
    .then((result)=>{
        let therapist = JSON.parse(JSON.stringify(result));
        if(therapist.length> 0){
            scheduleHandler(therapist_schedule,{id: req.params.id, ...req.body})
            .then((msg)=>{
                res.render('schedule', {therapist: therapist[0],...msg});
            });
            
        }
        else{
            let msg = {msg:'This therapist does not exist', msgType:'negMsg'};
            res.render('schedule',msg);
        }
    });
});

router.get('/test',(req,res)=>{
    console.log(therapist_schedule.findAll());
});

module.exports = router;