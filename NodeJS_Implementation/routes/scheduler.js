const express = require('express');
const router = express.Router();
const scheduling_db = require('../models/scheduling_db');
const {therapists} = scheduling_db.models;
const {therapist_schedule} = scheduling_db.models;

//Helper functions
async function queryBuilder(table, data){
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
    queryBuilder(therapists,req.body).then((msg)=>{
        console.log(msg);
        res.render('therapist',msg);
    });
    
})

module.exports = router;