//JSON Schema validation
var Validator = require("jsonschema").Validator;
var schemaValidator = new Validator();
var fs = require("fs");


var interactiveFilters = require("./interactiveFilters");

var visualization = (function(){


    var visualizationConfig = {},
        ndx = {},
        visualizations = [], //array containing information about all the visualizations
        visualizationConfigPath = "public/config/visualization.json";

    var splomFilters = function(ndx, visualization){
        var attributes=visualization.attributes;
        for(var i=0; i<attributes.length; i++){
            for(var j=1; j<attributes.length; j++){
                var xAttr = attributes[i].attributeName;
                var yAttr = attributes[j].attributeName;
                var dimension = ndx.dimension(function(d){
                    return( [ +d[xAttr], +d[yAttr] ]);
                });
               
                var group = dimension.group();
                //console.log(xAttr);
                interactiveFilters.addDimension(xAttr + "-"+ yAttr, dimension);
                interactiveFilters.addGroup(xAttr + "-" + yAttr, group);


            }
        }
        for(var i=0; i< attributes.length; i++){
            var attribute = attributes[i].attributeName;
            var dimension = ndx.dimension(function(d){
                return d[attribute];
            });
            var group = {};
            var binFactor = attributes[i].binFactor;
            //console.log(binFactor)
            if(binFactor){
                group = dimension.group(function(d){
                    return Math.floor(d/binFactor)*binFactor;
                })
            } else {
                group=  dimension.group();
            }
            interactiveFilters.addDimension(attribute, dimension);
            interactiveFilters.addGroup(attribute, group);
        }
        
    };
    var imageGridFilters = function (ndx, visualization){
        var dimension;
        for(var attr in visualization.attributes){
            var attribute = visualization.attributes[attr];
            if(attribute.type == "image"){  
                dimension = attribute.attributeName;
                dimension = ndx.dimension(function(d){
                    return d[attribute.attributeName];        
                });
            }

        }

        interactiveFilters.addDimension("imageGrid", dimension);
        interactiveFilters.addGroup("imageGrid", dimension.group());
    };

    var heatMapFilters = function(ndx, visualization){
        var xAttr, yAttr;
        for(var attr in visualization.attributes){
            var attribute = visualization.attributes[attr];
            if(attribute.type == "x"){  
                xAttr = attribute.attributeName;
            } else if(attribute.type == "y"){
                yAttr = attribute.attributeName;
            }
        }

        var dimension = ndx.dimension(function(d) {
            return ([+d[xAttr]*1, +d[yAttr]*1]);
        });
        //var group = dimension.group();
        interactiveFilters.addDimension("heatMap", dimension);
        interactiveFilters.addGroup("heatMap", dimension.group());
    };
    var bubbleChartFilters = function(){
        var xAttr;
        var yAttr;
        var rAttr;
        var colorAttr;
        var dimension;
        for(var attr in visualization.attributes){
            var attribute = visualization.attributes[attr];
            if(attribute.dimension){  
                dimension = attribute.name;
                dimension["visualization"] = ndx.dimension(function(d){
                    return d[attribute.name];        
                });
            }
            if(attribute.type == "x"){
                xAttr = attribute.name;
            }
            if(attribute.type == "y"){
                yAttr = attribute.name;
            }
            if(attribute.type == "r"){
                rAttr = attribute.name;
            }
            if(attribute.type == "color"){
                colorAttr = attribute.name;
            }
        }
        var dimensions = {};
        var groups = {};
        groups["visualization"] = dimensions[dimension].group().reduce(
            function(p,v){
                p[xAttr] += v[xAttr];
                p[yAttr] += v[yAttr];
                p[rAttr] += v[rAttr];
                p[colorAttr] += v[colorAttr];
                return p;
            },
            function(p,v){
                p[xAttr] -= v[xAttr];
                p[yAttr] -= v[yAttr];
                p[rAttr] -= v[rAttr];
                p[colorAttr] -= v[colorAttr];
                return p;
            },
            function(){
                var obj = {};
                obj[xAttr] = 0;
                obj[yAttr] = 0;
                obj[rAttr] = 0;
                obj[colorAttr] = 0;
                return obj;
            }
        ); 
    };

    var markerMap = function (ndx, visualization) {
        var attributeName = visualization.attributeName;

        var dimension = ndx.dimension(function (d) {
                return d[attributeName];
            });

        interactiveFilters.addDimension(attributeName, dimension);
        interactiveFilters.addGroup(attributeName, dimension.group().reduceCount());
    }

    var geoChoroplethMap = function (ndx, visualization) {
        var attributeName = visualization.attributeName;

        var dimension = ndx.dimension(function (d) {
                return d[attributeName];
            });

        interactiveFilters.addDimension(attributeName, dimension);
        interactiveFilters.addGroup(attributeName, dimension.group().reduceCount());
    }

    var _loadConfig = function(path) {
        visualizationConfigPath = path || visualizationConfigPath;
        visualizationConfig = fs.readFileSync(visualizationConfigPath);
        visualizationConfig = JSON.parse(visualizationConfig);
        return visualizationConfig;
    };

    var _init = function(path){

        var config  = _loadConfig(path);
        visualizations = [];
        for (var i in config) {
            visualizations.push(config[i]);

        }

        //_visualizationFilters();
        return config;
    };

    var _applyCrossfilter = function(){
        var ndx = interactiveFilters.getndx();

        for(var i in visualizations){
            var vis = visualizations[i];

            switch(vis.visualizationType){
            case "imageGrid":
                imageGridFilters(ndx,vis);
                break;
            case "heatMap":
                heatMapFilters(ndx,vis);
                break;
            case "SPLOM":
                splomFilters(ndx,vis);
                break;
            case "geoChoroplethMap":
                geoChoroplethMap(ndx, vis);
                break;
            case "markerMap":
                markerMap(ndx, vis);
                break;
            }
        }


    };

    return{
        init: _init,
        applyCrossfilter: _applyCrossfilter,
        //Returns an array of attributes corresponding to the visualization
        getAttributes: function(visualizationType){

            for(var i in visualizations){
                var visualization = visualizations[i];
                if(visualization.visualizationType == visualizationType){
                    return visualization.attributes;
                }
            }
        },
        getVisualizationType: function(){
            return visualizationConfig.type;
        }, 
        hasVisualization: function(visualizationType){
            for(var i in visualizations){
                var visualization = visualizations[i];
                if(visualization.visualizationType == visualizationType){
                    return true;
                }
            }
            return false;
        }
    };
})();
 
module.exports = visualization;
