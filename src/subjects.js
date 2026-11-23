export const subjects = [
 {name:'Reinforcement Learning',code:'231CM7T01'},
 {name:'Human Resources & Project Management',code:'231HS7T04'},
 {name:'Blockchain Technology',code:'231CS7E02'},
 {name:'Big Data Analytics',code:'231IT7E03'},
 {name:'Electronic Measurements and Instrumentations',code:'231EC7O03'},
 {name:'Operations Management',code:'231ME7O09'}
];
const normalize=value=>String(value||'').toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]/g,'');
const aliases={ '231CM7T01':['rl','reinforcementlearning'], '231HS7T04':['hrpm','hrandprojectmanagement','humanresourcesprojectmanagement'], '231CS7E02':['blockchain'], '231IT7E03':['bda','bigdataanalytics'], '231EC7O03':['emi','electronicmeasurementsinstrumentations'], '231ME7O09':['om','operationsmanagement'] };
export function findSubject(value){const text=String(value||''),n=normalize(text);return subjects.find(s=>text.toUpperCase().includes(s.code)||normalize(s.name)===n||(aliases[s.code]||[]).includes(n));}
export function canonicalSubject(value){return findSubject(value)?.name||value;}
