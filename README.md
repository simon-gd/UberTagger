# UberTagger

UberTagger is an desktop application for exploratory analysis of sequntial data that combines annotation and visual analytics, assisted by a recommender system. UberTagger is designed to help researchers explore large datasets of sequantial data such as interface micro-interactions, sensor data, simulation results, health data, and more. We implement a novel tagging system to support the data transformations specified in the principles of Exploratory Sequential Data Analysis. Tags can label different media types (e.g., subsets of a time-series or cells in a table) but exist in a common searchable environment. This approach further supports meta-tags, tag structures and hierarchies, and meta-analysis of the annotation process. This unique tagging approach, for data analysis, annotation, and algorithms, can help with the detection and design of micro-interactions for hypothesis generation.

For more infomation see these publications:


![UberTagger](https://https://github.com/sbreslav/UberTagger/raw/master/doc/screenshot.png)


## Building Steps (Windows)
0. npm install -g nw-gyp
1. npm install
2. npm update --save in the mongoose folder
2. Rebuld mongoose\mongodb\kerberos,bson:
- cd to dirs with binding.gyp
- nw-gyp rebuild --target=0.10.5 --msvs_version=2012
- repeat for each
2. bower install
3. git clone https://github.com/geo8bit/nodebob.git nodebob
4. gulp build
5. gulp
6. in package.json set "env" to "dev" or "prod" to control if source is uglified or not, and set "window.toolbar" to true or false to show or hide the debug toolbar

## Notes
- To add a new bower package and add to the bower.json file call `bower install --save <package name>`
- To add a new node package and add to the package.json file call `npm install <package name> --save` or `npm install <package name> --save-dev` depending which list of packages it should be added to, dev is used only for local development 


## How to Creating a dataset
See example datasets for examples of the configurations

- Working:
- [dataset-hotel-simulation](https://git.autodesk.com/breslas/dataset-hotel-simulation)
- [dataset-user-interactions-mimic](https://git.autodesk.com/breslas/dataset-user-interactions-mimic)
- In-progress:
- [dataset-user-interactions-mammography](https://git.autodesk.com/breslas/dataset-user-interactions-mammography)
- [dataset-health-monitoring](https://git.autodesk.com/breslas/dataset-health-monitoring)
- [dataset-building-sensors](https://git.autodesk.com/breslas/dataset-building-sensors)
- [dataset-business-transactions](https://git.autodesk.com/breslas/dataset-business-transactions)

Here are some basic points:

1. Dataset has to include package.json
2. package.json needs to include an object called "uber-tagger", 
3. The dataset needs be imported into MongoDB or tingoDB
4. The dataset needs to define a schema based on Mongoose Schema rules.
	- Some meta fields to make sure to use:
		- Required:
			- id
			- field
			- name
			- dtype: uint8, uint16, uint32, int8, int16, int32, float32, float64, boolean, string, timeseries, object
		- Required for timeseries only
			-time-scale: ms, s (currently not used, assuems ms)
			- time-dtype
			- display-dtype
			- series-dtype
			- series-units
			- filter: interp, hist

## Links
- [node-webkit](https://github.com/rogerwang/node-webkit)
- [nodebob](https://github.com/geo8bit/nodebob)
- [Node.js](http://nodejs.org/)
- [Gulp](http://gulpjs.com/)
- [NPM](https://www.npmjs.org): Package Manager for nodejs packages 
- [Bower](http://bower.io/): Package Manager for client side javascript libraries
- [MongoDB](http://www.mongodb.org/)
- [tingoDB](http://www.tingodb.com/)
- [mongoosejs](http://mongoosejs.com/)
- [tungus](https://github.com/sergeyksv/tungus)

#### JS Libs Used
- [w2ui](http://w2ui.com/web/docs)
- [jquery](http://jquery.com/)
- [d3](http://d3js.org/)
- [Bootstrap](http://getbootstrap.com/)
- [Font Awesome](http://fortawesome.github.io/Font-Awesome/whats-new/)
- [natural](https://github.com/NaturalNode/natural)
- [wordpos](https://github.com/moos/wordpos)
- [statkit](https://github.com/rigtorp/statkit)
- [ndarray](https://github.com/mikolalysenko/ndarray)
- [numbers](https://github.com/sjkaliski/numbers.js)

#### JS+R Integreationg
- [node-rio](https://github.com/albertosantini/node-rio)
- [rserve-js](https://github.com/cscheid/rserve-js)

#### Not used, but interesting JS Libs
- [Timeseries analysis](https://github.com/26medias/timeseries-analysis)
- [numericjs](http://www.numericjs.com/)
- [cytoscape](https://github.com/cytoscape/cytoscape.js)
- [jsonLD](https://github.com/digitalbazaar/jsonld.js)



