// Safety Audit template
(function(){
  window.TEMPLATES = window.TEMPLATES || [];
  window.TEMPLATES.push({
    name:'Safety Audit', badge:'EHS', desc:'Safety findings, severity and corrective actions.',
    fields:[
      {label:'Audit ID', key:'audit_id', type:'text'},
      {label:'Date', key:'date', type:'date', required:true},
      {label:'Area', key:'area', type:'text', required:true},
      {label:'Auditor', key:'auditor', type:'text'},
      {label:'Findings Count', key:'findings_count', type:'number'},
      {label:'Highest Severity', key:'highest_severity', type:'select', options:['Low','Medium','High']},
      {label:'Corrective Actions Required', key:'corrective_actions_required', type:'checkbox'},
      {label:'Status', key:'status', type:'select', options:['Open','In Progress','Closed']},
      {label:'Notes', key:'notes', type:'textarea'}
    ]
  });
})();


