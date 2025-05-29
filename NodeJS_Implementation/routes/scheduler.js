const express = require('express');
const router = express.Router();
const scheduling_db = require('../models/scheduling_db');
const {therapists} = scheduling_db.models;
const {therapist_schedule} = scheduling_db.models;
const { Op } = require('sequelize');
//Helper functions
function timeDifference(start_time,end_time){
    return (+end_time.split(':')[0] - +start_time.split(':')[0])+ (+end_time.split(':')[1] - +start_time.split(':')[1])/60 ;
}
async function scheduleHandler(table, data){
    let msg = {msg:'Action Completed', msgType:'posMsg'};
    //Make sure time and date ranges are valid
    if(timeDifference(data.time_range_start,data.time_range_end)<=0){
        msg = {msg:'Time range end must be after time range start', msgType:'negMsg'};
        return msg;
    }
    if(new Date(`${data.date_range_end} EST`) - new Date(`${data.date_range_start} EST`)<=0){
        msg = {msg:'Date range end must be after date range start. The end date is not inclusive', msgType:'negMsg'};
        return msg;
    }
    if(data['user-action'].toLowerCase() === 'add'){
        data =  (({'user-action': user_action, ...object})=>object)(data);
        let days = [];
        let slots = [];
        let day = new Date(`${data.date_range_start} EST`);
        while(day.toISOString().split('T')[0]!=data.date_range_end){
            days.push(day.toISOString().split('T')[0]);
            day.setDate(day.getDate()+1);
        }
        if(timeDifference(data.time_range_start,data.time_range_end)<1){
            let slot = {
                therapist_id: data.id,
                start_time: data.time_range_start, 
                end_time: data.time_range_end, 
                booked: +data.booked, 
                client_first_name: data.client_first_name,
                client_last_name: data.client_last_name
            }

            slots.push(slot);
        }
        else{
            let time = data.time_range_start;
            while(timeDifference(time,data.time_range_end)>=1){
                let slot = {
                    therapist_id: data.id,
                    start_time: `${time}:00`, 
                    end_time: `${(+time.split(':')[0]+1).toString().padStart(2,'0')}:${time.split(':')[1]}:00`, 
                    booked: +data.booked, 
                    client_first_name: data.client_first_name,
                    client_last_name: data.client_last_name
                }

                slots.push(slot);
                time = `${(+time.split(':')[0]+1).toString().padStart(2,'0')}:${time.split(':')[1]}`;
            }    
        }
        console.log(days);
        console.log(slots);
        for(let day of days){
            for(let slot of slots){
                //Look for overlapping slots
                let overlap = await table.findAll({
                    where: {
                        app_date: day,
                        [Op.or]: [
                            {
                                [Op.and]: [{start_time:{[Op.lte]: slot.start_time}},{end_time:{[Op.gt]: slot.start_time}}]
                            },
                            {
                                [Op.and]: [{start_time:{[Op.lte]: slot.end_time}},{end_time:{[Op.gt]: slot.end_time}}]
                            }
                        ]
                    }
                });
                if(overlap.length===0){
                    slot = {app_date: day, ...slot};
                    let newSlot = table.build(slot);
                    console.log(JSON.stringify(newSlot));
                    // newSlot.save();
                }
                else{
                    msg = {msg:'Some of the slots you created overlap with others that exist so were not added.', msgType:'negMsg'};
                }
            }
        }
    }
    return msg;
}

async function therapistHandler(table, data){
    let msg = {msg:'Action Completed', msgType:'posMsg'};
    if(data['user-action'].toLowerCase() === 'add'){
        let tableData =  (({'user-action': user_action, ...object})=>object)(data);
        const newRow = await table.build(tableData);
        await newRow.save();
    }
    else if(data['user-action'].toLowerCase() === 'delete'){
        let tableData =  (({'user-action': user_action, ...object})=>object)(data);
        for(key of Object.keys(tableData)){
            if(tableData[key]===''){
                delete tableData[key];
            }
        }
        console.log(tableData);
        await table.destroy({
            where: tableData
        });
    }
    else if(data['user-action'].toLowerCase() === 'update'){
        let tableData =  (({'user-action': user_action, ...object})=>object)(data);
        let filter = {};
        for(key of Object.keys(tableData)){
            if(key.includes('check')){
                //Add the checked column to the filter so it searches for that value in the update
                let filterCol = key.replace('-check',''); 
                filter[filterCol] = tableData[filterCol];
                if(filter[filterCol]==='' || filter[filterCol]=== undefined){
                    msg.msg = "Your filter field must contain info";
                    msg.msgType = "negMsg";
                    return msg;
                }
                delete tableData[key];
                delete tableData[filterCol];
            }
            if(tableData[key]===''){
                delete tableData[key];
            }
        }
        await table.update(
            tableData,
            {
                where: filter
            }
        );
        console.log(filter);
        console.log(tableData);   
    }
    else if(data['user-action'].toLowerCase() === 'view'){
        let tableData =  (({'user-action': user_action, ...object})=>object)(data);
        for(key of Object.keys(tableData)){
            if(tableData[key]===''){
                delete tableData[key];
            }
        }
        let res = await table.findAll({
            where: tableData
        });
        return {view: JSON.parse(JSON.stringify(res))};
        
    }
    return msg;
}

router.get('/therapists',(req,res)=>{
    res.render('therapist');
});

router.post('/therapists',(req,res)=>{
    therapistHandler(therapists,req.body).then((msg)=>{
        console.log(msg);
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
                console.log({therapist: therapist[0],...msg});
                res.render('schedule', {therapist: therapist[0],...msg});
            });
            
        }
        else{
            let msg = {msg:'This therapist does not exist', msgType:'negMsg'};
            res.render('schedule',msg);
        }
    });
});

module.exports = router;