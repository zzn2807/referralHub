const express = require('express');
const nodemailer = require("nodemailer");
const router = express.Router();
const scheduling_db = require('../models/scheduling_db');
const {therapists} = scheduling_db.models;
const {therapist_schedule} = scheduling_db.models;
const {user, pass} = require('../env');
const fs = require('fs');
const busboy = require('connect-busboy');
const {
    timeConvert24to12,
    parseBody
} = require('../includes/helpers')

// Create a test account or replace with real credentials.
const transporter = nodemailer.createTransport({
    host: "smtp-mail.outlook.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: user,
      pass: pass,
    },
  });


//Routes
router.get('/',(req,res)=>{
    //Find all possible services provided by the therapists and list them in a select menu
    therapists.findAll({
            attributes: [[scheduling_db.fn('DISTINCT',scheduling_db.col('service')),'Service']]
        })
        .then((services)=>{//Return distinct list of services
            return services.map(service => {
                return service.toJSON()['Service'];
            });
        }).then((services)=>{

            res.render('index',{services});
        });
    
});

router.post('/time_slots',(req,res)=>{
    //Find all time slots that aren't booked on the specified date for the specified service
    const service = req.body['user-service'];
    const date = req.body['user-date'];
    if(service && date){
        scheduling_db.query(`select therapists.first_name, therapists.last_name, therapist_schedule.start_time, therapist_schedule.end_time, therapist_schedule.app_date
from therapists inner join therapist_schedule on therapists.id = therapist_schedule.therapist_id
where service = '${service}' and therapist_schedule.booked = 0 and app_date = '${date}';`)
.then(([result, metadata])=>{
    //Configure the resulting data into key value pairs where the keys are the therapists and the values are their free slots
    let available_times = {};
    for(slot of result){
        let name = `${slot.first_name} ${slot.last_name}`; 
        let start_time = slot.start_time;
        let end_time = slot.end_time;
        //Convert slot times to 12 hour format  
        start_time = timeConvert24to12(start_time); 
        end_time = timeConvert24to12(end_time);
          
        slot.start_time = start_time;
        slot.end_time = end_time;
        //If this is a slot belonging to a therapist already in the dictionary, add the slot to the therapist
        if(available_times.hasOwnProperty(name)){
            available_times[name].push(slot);
        }
        //If this is a new therapist being added to the dictionary, add them then add the slot
        else{
            available_times[name] = [];
            available_times[name].push(slot);
        }
    }
    res.render('time_slots', {available_times});
})
        
    }
    else{
        //Return to home if info is missing
        res.redirect('/');
    }
     
});

//Send time slot info to form page
router.post('/form',(req,res)=>{
    res.render('form',{slot: JSON.parse(req.body.slot)}); 
});

//Read all form info submitted including time slot selected
router.post('/form_submit',(req,res)=>{
    let body = {};
    let attachments = [];
    //Path where files will be uploaded
    let path = __dirname + `/files_${Date.now()}/`;
    if (!fs.existsSync(path)){
        fs.mkdirSync(path);
    }
    else{
        fs.rmdirSync(path,{recursive: true});
        fs.mkdirSync(path);
    }
    if(req.busboy){
        let fstream;
        req.pipe(req.busboy);
        req.busboy.on('file', function (fieldname, file, filename) {
            //Only add attachments if files exist to attach
            if(filename.filename){
                attachments.push({
                    filename: filename.filename,
                    path: path + filename.filename
                });
            }
                console.log("Uploading: " + filename.filename);
                fstream = fs.createWriteStream(path + filename.filename);
                file.pipe(fstream);
                fstream.on('close', function () {    
                    console.log("Upload Finished of " + filename.filename);               
                });
            
            
        });
        req.busboy.on('field',(name,value,info)=>{
            body[name] = value;
            // console.log(`${name}: ${value}`);
        });
        req.busboy.on('finish',()=>{
            console.log(body);
            // Wrap in an async IIFE so we can use await.
            (async () => {
                const info = await transporter.sendMail({
                from: '"Referral Hub" <dnwokolo@hopehealthsystems.com>',
                to: "nwokolodz@gmail.com",
                subject: "Referral Hub Form Submission",
                // text: "Hello world?", // plain‑text body
                html: parseBody(body), // HTML body
                attachments: attachments
                });
            
                console.log("Message sent:", info.messageId);
                fs.rm(path,{recursive: true},()=>{console.log('File path deleted!')});
            })();
        
            res.render('thanks');
        })
    }
    
});

module.exports = router;