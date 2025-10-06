// Production QC template
(function(){
  window.TEMPLATES = window.TEMPLATES || [];
  window.TEMPLATES.push({
    name:'Production QC', badge:'Quality', desc:'Batch inspections and quality metrics.',
    fields:[
      {label:'Batch ID', key:'batch_id', type:'text', required:true},
      {label:'Date', key:'date', type:'date', required:true},
      {label:'Shift', key:'shift', type:'text'},
      {label:'Inspector', key:'inspector', type:'text'},
      {label:'Units Sampled', key:'units_sampled', type:'number'},
      {label:'Defects Total', key:'defects_total', type:'number'},
      {label:'Top Defect Type', key:'top_defect_type', type:'text'},
      {label:'Status', key:'status', type:'select', options:['Pass','Fail']},
      {label:'Rework Required', key:'rework_required', type:'checkbox'},
      {label:'Notes', key:'notes', type:'textarea'},
      {label:'Defect Rate %', key:'defect_rate_pct', type:'number', readonly:true}
    ]
  });
})();


