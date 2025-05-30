const express = require('express');
const router = express.Router();
const scheduling_db = require('../models/scheduling_db');
const {therapists} = scheduling_db.models;
const {therapist_schedule} = scheduling_db.models;
const { Op } = require('sequelize');
//Helper functions
function timeConvert24to12(time){
    //Convert database 24 hour format to more user friendly 12 hour format
    return `${(+time.split(':')[0]>12?+time.split(':')[0]-12:+time.split(':')[0]).toString().padStart(2,'0')}:${time.split(':')[1]}:${+time.split(':')[0]>=12?'PM':'AM'}`;
}
function timeDifference(start_time,end_time){
    return (+end_time.split(':')[0] - +start_time.split(':')[0])+ (+end_time.split(':')[1] - +start_time.split(':')[1])/60 ;
}
async function scheduleHandler(table, data){
    let msg = {msg:'Action Completed', msgType:'posMsg'};
    let action = data['user-action'].toLowerCase();
    data =  (({'user-action': user_action, ...object})=>object)(data);
    //Make sure time and date ranges are valid
    if(timeDifference(data.time_range_start,data.time_range_end)<=0){
        msg = {msg:'Time range end must be after time range start', msgType:'negMsg'};
        return msg;
    }
    if(new Date(`${data.date_range_end} EST`) - new Date(`${data.date_range_start} EST`)<=0){
        msg = {msg:'Date range end must be after date range start. The end date is not inclusive', msgType:'negMsg'};
        return msg;
    }
    //save days in range for slots to be added
    let days = [];
    //save hours that will be added to each day
    let slots = [];
    let day = new Date(`${data.date_range_start} EST`);
    while(day.toISOString().split('T')[0]!=data.date_range_end){
        days.push(day.toISOString().split('T')[0]);
        day.setDate(day.getDate()+1);
    }
    //if the slot size is less than the average 1 hour slot size
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
    //If the time range is gte 1 hour, divide into as many 1 hour blocks as can fit in range
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

    //If adding slots
    if(action === 'add'){
        //Add all slots to each day in list of days
        for(let day of days){
            if([0,6].includes(new Date(`${day} EST`).getDay())){
                continue
            }
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
                                [Op.and]: [{start_time:{[Op.lt]: slot.end_time}},{end_time:{[Op.gte]: slot.end_time}}]
                            }
                        ]
                    }
                });
                //If there are no overlapping slots, add
                if(overlap.length===0){
                    slot = {app_date: day, ...slot};
                    let newSlot = table.build(slot);
                    newSlot.save();
                }
                else{
                    msg = {msg:'Some of the slots you created overlap with others that exist so were not added.', msgType:'negMsg'};
                }
            }
        }
    }
    else if(action === 'update'){
        for(let day of days){
            for(let slot of slots){
                //No need to check for overlap or existing slots. If they don't exist, update command is ignored
                slot = {app_date: day, ...slot};
                //Columns to be updated
                let update = {
                    client_first_name: slot.client_first_name,
                    client_last_name: slot.client_last_name,
                    booked: slot.booked
                }
                //Search parameters for the rows to be updated
                let filter = {
                    start_time: slot.start_time,
                    end_time: slot.end_time,
                    app_date: slot.app_date,
                    therapist_id:  slot.therapist_id
                }
                
                await table.update(update,{
                    where: filter
                });
            }
        }
    }
    else if(action === 'delete'){
        for(let day of days){
            for(let slot of slots){
                //No need to check for overlap or existing slots. If they don't exist, update command is ignored
                slot = {app_date: day, ...slot};
                
                //Search parameters for the rows to be deleted
                let filter = {
                    start_time: slot.start_time,
                    end_time: slot.end_time,
                    app_date: slot.app_date,
                    therapist_id:  slot.therapist_id
                }
                //Only specify names if they are defined
                slot.client_first_name!=''?filter['client_first_name'] = slot.client_first_name: null;
                slot.client_last_name!=''?filter['client_last_name'] = slot.client_last_name: null; 
                
                await table.destroy({
                    where: filter
                });
            }
        }
    }
    else if(action === 'view'){
        let view = {};
        for(let day of days){
            //No need to check for overlap or existing slots. If they don't exist, update command is ignored
            //Skip weekends
            if([0,6].includes(new Date(`${day} EST`).getDay())){
                continue
            }
            //Search parameters for the rows to be selected
            let filter = {
                app_date: day,
                therapist_id:  data.id,
                start_time: {
                    [Op.between]: [data.time_range_start,data.time_range_end]
                }
            }
            //Only specify names if they are defined
            data.client_first_name!=''?filter['client_first_name'] = data.client_first_name: null;
            data.client_last_name!=''?filter['client_last_name'] = data.client_last_name: null; 
            
            let result = await table.findAll({
                where: filter
            });
            result = JSON.parse(JSON.stringify(result));
            result = result.map(function(slot){
                slot.start_time = timeConvert24to12(slot.start_time);
                slot.end_time = timeConvert24to12(slot.end_time);
                return slot;
            });
            view[day] = result;
        }

        return {view};
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