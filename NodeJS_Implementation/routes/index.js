const express = require('express');
const router = express.Router();
const scheduling_db = require('../models/scheduling_db');
const {therapists} = scheduling_db.models;
const {therapist_schedule} = scheduling_db.models;

//Helper functions
function timeConvert24to12(time){
    //Convert database 24 hour format to more user friendly 12 hour format
    return `${+time.split(':')[0]>12?+time.split(':')[0]-12:+time.split(':')[0]}:${time.split(':')[1]}:${+time.split(':')[0]>=12?'PM':'AM'}`;
}
function timeConvert12to24(time){
    //Convert 12-hour format back to 24 hour hh:mm:ss format
    time = time.toUpperCase();
    return `${time.includes("PM")?(+time.split(':')[0]%12+12).toString().padStart(2,'0'):(+time.split(':')[0]%12).toString().padStart(2,'0')}:${time.split(':')[1].slice(0,2)}:00`;
}

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
        if(available_times.hasOwnProperty(name)){
            available_times[name].push(slot);
        }
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
    console.log(req.body);
    res.render('thanks');
});

module.exports = router;