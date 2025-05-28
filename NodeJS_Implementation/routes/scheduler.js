const express = require('express');
const router = express.Router();
const scheduling_db = require('../models/scheduling_db');
const {therapists} = scheduling_db.models;
const {therapist_schedule} = scheduling_db.models;

//Helper functions
async function queryBuilder(table, data){
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
        console.log(data);   
    }
}

router.get('/therapists',(req,res)=>{
    res.render('therapist');
});

router.post('/therapists',(req,res)=>{
    queryBuilder(therapists,req.body).then(()=>{
        let msg = {msg:'Action Completed', msgType:'posMsg'};
        res.render('therapist',msg);
    });
    
})

module.exports = router;