let action = document.querySelector('#action');
['load', 'change'].forEach((event)=>{
    action.addEventListener('change',(e)=>{
        let checkboxes = document.getElementsByClassName('checkbox');
        if(action.value.toLowerCase() === 'update'){
            for(let box of checkboxes){
                box.classList.remove('hidden');
            }
            
        }
        else{  
            for(let box of checkboxes){
                box.checked = false;
                box.classList.add('hidden');
            }
        }
    });
});
