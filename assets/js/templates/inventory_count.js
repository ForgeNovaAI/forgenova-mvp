// Inventory Count template
(function(){
  window.TEMPLATES = window.TEMPLATES || [];
  window.TEMPLATES.push({
    name:'Inventory Count', badge:'Inventory', desc:'Cycle counts with variance analysis.',
    fields:[
      {label:'item_id', key:'item_id', type:'text', required:true},
      {label:'item_name', key:'item_name', type:'text'},
      {label:'category', key:'category', type:'text'},
      {label:'location', key:'location', type:'text'},
      {label:'date', key:'date', type:'date', required:true},
      {label:'counted_qty', key:'counted_qty', type:'number', required:true},
      {label:'system_qty', key:'system_qty', type:'number'},
      {label:'variance', key:'variance', type:'number'},
      {label:'unit_cost', key:'unit_cost', type:'number'},
      {label:'counter_name', key:'counter_name', type:'text'},
      {label:'notes', key:'notes', type:'textarea'},
      {label:'variance_value', key:'variance_value', type:'number'}
    ]
  });
})();


