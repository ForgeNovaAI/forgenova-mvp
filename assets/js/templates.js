// Template definitions extracted from index.html
// Exposes a global `window.TEMPLATES` used by the app
(function(){
  window.TEMPLATES = [
    { name:'Maintenance Log', badge:'Operations', desc:'Track downtime by machine, shift, and reason.',
      primaryKey: ['machine_id', 'date', 'shift'], // Composite key: machine + date + shift
      fields:[
        {label:'Machine ID', key:'machine_id', type:'text', required:true},
        {label:'Date', key:'date', type:'date', required:true},
        {label:'Shift', key:'shift', type:'select', options:['A','B','C']},
        {label:'Downtime (min)', key:'downtime_min', type:'number'},
        {label:'Reason', key:'reason', type:'select', options:['Electrical','Mechanical','Operator','Planned','Other']},
        {label:'Notes', key:'notes', type:'textarea'}
      ]
    },
    { name:'Production QC', badge:'Quality', desc:'Log batch-level inspections and defects.',
      primaryKey: ['batch_id', 'date'], // Composite key: batch + date
      fields:[
        {label:'Batch ID', key:'batch_id', type:'text', required:true},
        {label:'Date', key:'date', type:'date', required:true},
        {label:'Inspector', key:'inspector', type:'text'},
        {label:'Defects', key:'defects', type:'number'},
        {label:'Passed', key:'passed', type:'checkbox'},
        {label:'Notes', key:'notes', type:'textarea'}
      ]
    },
    { name:'Inventory Count', badge:'Inventory', desc:'Cycle counts with variance analysis.',
      primaryKey: ['item_id', 'date'], // Composite key: item + date
      fields:[
        {label:'Item ID', key:'item_id', type:'text', required:true},
        {label:'Item Name', key:'item_name', type:'text'},
        {label:'Category', key:'category', type:'text'},
        {label:'Location', key:'location', type:'text'},
        {label:'Date', key:'date', type:'date', required:true},
        {label:'Counted Qty', key:'counted_qty', type:'number', required:true},
        {label:'System Qty', key:'system_qty', type:'number'},
        {label:'Variance', key:'variance', type:'number'},
        {label:'Unit Cost', key:'unit_cost', type:'number'},
        {label:'Counter Name', key:'counter_name', type:'text'},
        {label:'Notes', key:'notes', type:'textarea'},
        {label:'Variance Value', key:'variance_value', type:'number'}
      ]
    },
    { name:'Safety Audit', badge:'EHS', desc:'Track findings, severity, and resolution.',
      primaryKey: ['area', 'date'], // Composite key: area + date
      fields:[
        {label:'Area', key:'area', type:'text', required:true},
        {label:'Inspection Date', key:'date', type:'date', required:true},
        {label:'Issues Found', key:'issues', type:'number'},
        {label:'Severity', key:'severity', type:'select', options:['Low','Medium','High']},
        {label:'Resolved', key:'resolved', type:'checkbox'},
        {label:'Notes', key:'notes', type:'textarea'}
      ]
    }
  ];
})();


