var anyToJSON = require("anytojson");


//
//#### loadData()
//Loads data using the type and path specified in ```public/config/dataSource.json```.
//Currently supports
// * JSON
// * CSV
// * REST JSON
// * REST CSV
//
//The system can be extended to support more types using ```loadDataSources.js```
//
function loadData(dataSources, processData)
{
  for(var dataSource in dataSources){
    var type=  dataSources[dataSource].type;
    var options = dataSources[dataSource].options;
    if(type== "json"){
      anyToJSON.json(options, processData);
    } else if(type == "csv") {
      anyToJSON.csv(options, processData);
    } else if(type == "rest/json") {
      anyToJSON.restJson(options, processData);
    } else if (type == "rest/csv"){
      anyToJSON.restCsv(options, processData);
    } else if (type == "odbc") {
      anyToJSON.odbc(options, processData);
    }
  }
}
module.exports = loadData;