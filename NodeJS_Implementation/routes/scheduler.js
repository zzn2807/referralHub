const express = require('express');
const router = express.Router();
const scheduling_db = require('../models/scheduling_db');
const {therapists} = scheduling_db.models;
const {therapist_schedule} = scheduling_db.models;

router.get('/therapists',(req,res)=>{
    res.render('therapist');
});

module.exports = router;