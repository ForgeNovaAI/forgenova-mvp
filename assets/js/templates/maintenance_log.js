// Maintenance Log template
(function(){
  window.TEMPLATES = window.TEMPLATES || [];
  window.TEMPLATES.push({
    name:'Maintenance Log', badge:'Operations', desc:'Track downtime by machine, shift, and reason.',
    fields:[
      {label:'Machine ID', key:'machine_id', type:'text', required:true},
      {label:'Date', key:'date', type:'date', required:true},
      {label:'Shift', key:'shift', type:'select', options:['A','B','C']},
      {label:'Downtime (min)', key:'downtime_min', type:'number'},
      {label:'Reason', key:'reason', type:'select', options:['Electrical','Mechanical','Operator','Planned','Other']},
      {label:'Notes', key:'notes', type:'textarea'}
    ]
  });
})();


