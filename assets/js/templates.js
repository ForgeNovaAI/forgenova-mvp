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
      primaryKey: ['batch_id', 'date', 'shift'], // Composite key: batch + date + shift
      fields:[
        {label:'Batch ID', key:'batch_id', type:'text', required:true},
        {label:'Date', key:'date', type:'date', required:true},
        {label:'Shift', key:'shift', type:'select', options:['A','B','C']},
        {label:'Inspector', key:'inspector', type:'text'},
        {label:'Units Sampled', key:'units_sampled', type:'number'},
        {label:'Defects Total', key:'defects_total', type:'number'},
        {label:'Top Defect Type', key:'top_defect_type', type:'text'},
        {label:'Status', key:'status', type:'select', options:['Pass','Fail','Pending']},
        {label:'Rework Required', key:'rework_required', type:'checkbox'},
        {label:'Notes', key:'notes', type:'textarea'},
        {label:'Defect Rate %', key:'defect_rate_pct', type:'number'}
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
      primaryKey: ['audit_id'], // Primary key: unique audit ID
      fields:[
        {label:'Audit ID', key:'audit_id', type:'text', required:true},
        {label:'Date', key:'date', type:'date', required:true},
        {label:'Area', key:'area', type:'text', required:true},
        {label:'Auditor', key:'auditor', type:'text'},
        {label:'Findings Count', key:'findings_count', type:'number'},
        {label:'Highest Severity', key:'highest_severity', type:'select', options:['Low','Medium','High']},
        {label:'Corrective Actions Required', key:'corrective_actions_required', type:'checkbox'},
        {label:'Status', key:'status', type:'select', options:['Open','In Progress','Closed']},
        {label:'Notes', key:'notes', type:'textarea'}
      ]
    }
  ];
})();


