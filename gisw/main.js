import './style.css';
import {Map, View} from 'ol';
import VectorSource from 'ol/source/Vector.js';
import ImageWMS from 'ol/source/ImageWMS.js';
import {GeoJSON, WFS} from 'ol/format.js';
import OSM from 'ol/source/OSM';
import {Stroke, Style,Fill,Circle,Icon} from 'ol/style.js';
import Projection from 'ol/proj/Projection.js';
import {Tile as TileLayer, Vector as VectorLayer, Image as ImageLayer,Group as LayerGroup} from 'ol/layer.js';
import { Point } from 'ol/geom';
import Overlay from 'ol/Overlay.js';
import XYZ from 'ol/source/XYZ.js';
import {toLonLat,transform,useGeographic} from 'ol/proj.js';
import {toStringHDMS} from 'ol/coordinate.js';
import { compose } from 'ol/transform';
import {filterDialogCreate,filterCreateOptions,updateWMSFilter,filterVectorLayer} from './Filter'

import {
  and as andFilter,
  equalTo as equalToFilter,
  like as likeFilter,
} from 'ol/format/filter.js';

useGeographic();

var pumpeNameFilter = '';
var pumpeFeatures;

const pro = new Projection({
  code: 'EPSG:4326',
  units: 'degrees',
  axisOrientation: 'neu'
});

const container = document.getElementById('popup');
const content = document.getElementById('popup-content');
const closer = document.getElementById('popup-closer');



function eventCheckBox(event)
{
  vectorPruge.setVisible(document.getElementById('Opcija1').checked);
  vectorPumpe.setVisible(document.getElementById('Opcija2').checked);
  imageGranice.setVisible(document.getElementById('Opcija3').checked);
  PuteviNis.setVisible(document.getElementById('Opcija4').checked);
  vectorFCD.setVisible(document.getElementById('Opcija5').checked);
  imageEmissions.setVisible(document.getElementById('Opcija6').checked);

}

// function eventFilterTekst(event)
// {
//   pumpeNameFilter = document.getElementById('testTekst').value

//   const filtritanePruge = pumpeFeatures.filter(function (n){
//     if(pumpeNameFilter.length === 0)
//     {return true;}
//     else
//     {
//       return n.values_.name === pumpeNameFilter;
//     }
//   });
//   pumpeSource.clear();
//   pumpeSource.addFeatures(filtritanePruge);
//   pumpeSource.changed();
// }


document.getElementById('Opcija1').addEventListener('change', eventCheckBox);
document.getElementById('Opcija2').addEventListener('change', eventCheckBox);
document.getElementById('Opcija3').addEventListener('change', eventCheckBox);
document.getElementById('Opcija4').addEventListener('change', eventCheckBox);
document.getElementById('Opcija5').addEventListener('change', eventCheckBox);
document.getElementById('Opcija6').addEventListener('change', eventCheckBox);


const overlay = new Overlay({
  element: container,
  autoPan: {
    animation: {
      duration: 250,
    },
  },
});

const prugeSource = new VectorSource();
const vectorPruge = new VectorLayer({
  source: prugeSource,
  style: new Style({
    stroke: new Stroke({
      color: 'rgba(0, 0, 0, 1.0)',
      width: 2,
    }),
  }),
});

const pumpeSource = new VectorSource();
const vectorPumpe = new VectorLayer({
  source: pumpeSource,
  style: new Style({
     image: new Circle({
       radius: 4,
       fill: new Fill({color: '#ffad33'}),
       stroke: new Stroke({color: '#f91615', width: 1.5}), })
  }),
});

const FCDSource = new VectorSource();
const vectorFCD = new VectorLayer({
  source: FCDSource,
  style: new Style({
     image: new Circle({
       radius: 4,
       fill: new Fill({color: '#07fc03'}),
       stroke: new Stroke({color: '#039dfc', width: 1.5}), })
  }),
});

const PuteviNISSource = new VectorSource();
const PuteviNis = new VectorLayer({
  source: PuteviNISSource,
  style: new Style({
    stroke: new Stroke({
      color: '#257325',
      width: 1,
    }),
  }),
});



const imageGranice = new ImageLayer({
  source: new ImageWMS({
    url: 'http://localhost:8080/geoserver/faks/wms',
    params: {'LAYERS': 'faks:Granice','FORMAT': 'image/png'},
    ratio: 1,
    serverType: 'geoserver',
  }),
});

const imageEmissions = new ImageLayer({
  source: new ImageWMS({
    url: 'http://localhost:8080/geoserver/faks/wms',
    params: {'LAYERS': 'faks:EM_Nis','FORMAT': 'image/png'},
    ratio: 1,
    serverType: 'geoserver',
  }),
});

imageEmissions.getSource().updateParams({
  'FILTER': null,
  'CQL_FILTER': 'timestep_time=0',
  'FEATUREID': null
});
imageEmissions.getSource().changed();

const layerList = [[ vectorPruge, 'Pruge',0,'',0,1],[vectorPumpe, 'Pumpe',0,'',0,1],[ PuteviNis, 'Putevi Nis',0,'',0,1],[imageGranice, 'Granice',1,'',0,1],[imageEmissions,'Emisija autombila',1,'',0,936],
[vectorFCD,'Automobili',0,'',0,941]]; //treci parametar je tip promenjljive //Cetvrti sluzi za URL(WFS)


const map = new Map({
  layers: [imageGranice,PuteviNis,vectorPruge,vectorPumpe,imageEmissions,vectorFCD],
  target: 'map',
  view: new View({
    center: [21, 43],
    maxZoom: 50,
    zoom: 2,
    projection: pro,
  }),
  overlays: [overlay],
});


//Funkcije za generisanje teksta // Posebno filtriranje trebalo je drugacije ali tako uvezo inicijalno

function getDataVektor(coordinate,vektroWFS,tip,naziv)
{
  
  var distance = [2000,2000]; //u m;
  distance = toLonLat(distance);
  var okvirniBox = [coordinate.at(0) - distance[0],coordinate.at(1) - distance[1],coordinate.at(0) + distance[0],coordinate.at(1) + distance[1]];

  var view = map.getView();
  //var viewResolution = view.getResolution();
  var obj = vektroWFS.getFeaturesInExtent(okvirniBox);
  if(obj)
  {
    obj.forEach(element => {
      if(element.values_)
      {
        if(tip == 1)
        {
          //content.innerHTML += "<p class='informacija'> " + naziv + " - ID:" + element.values_.way_id  + " Tip: " +element.values_.type+ '</p>';
          var paragraf = document.createElement('p');
          paragraf.innerHTML += ' ' + naziv + " - ID:" + element.values_.way_id  + " Tip: " +element.values_.type;
          var nazivi  = Object.keys(element.values_);
          nazivi.forEach(e => {
            if(e != 'tags' && e != 'geometry')
            {
              paragraf.innerHTML += '  - ' + e + element.values_[e];
            }
          });
          content.appendChild(paragraf);
          overlay.setPosition(coordinate);
        }
        else //if(tip == 2)
        {
          var ime = element.values_.name?element.values_.name:'NEPOZNAT';
          var paragraf = document.createElement('p');
          paragraf.className = 'informacija';
          paragraf.innerHTML += ' ' + naziv + " - ID:" + element.values_.node_id  + " Naziv: " +ime;
          var nazivi  = Object.keys(element.values_);
          nazivi.forEach(e => {
            if(e != 'tags' && e != 'geometry')
            {
              paragraf.innerHTML += '  - ' + e + element.values_[e];
            }
          });

          content.appendChild(paragraf);
          overlay.setPosition(coordinate);
        }
      }
    });

  }
     

}

function getDataRaster(coordinate,rasterWMS,naziv)
{
  var view = map.getView();
  var viewResolution = view.getResolution();
  var source = rasterWMS.getSource();
  var url = source.getFeatureInfoUrl(
    coordinate, viewResolution, view.getProjection(),
    {'INFO_FORMAT': 'application/json', 'FEATURE_COUNT': 50});
  if (url) {
    return fetch(url)
      .then(function (response) { return response.text(); })
      .then(function (json) {
        var obj = JSON.parse(json);
        if(obj)
        {
          if(obj.features)
          {
            obj.features.forEach(element => 
            {
                var tagovi = JSON.parse(element.properties.tags)
                content.innerHTML += "<p class='informacija'> " + naziv +" ID:" + element.properties.area_id  + " Naziv: " +tagovi.name+ '</p>';
                overlay.setPosition(coordinate);
            });
          }
        }
      });
  }
}
 

map.on('singleclick', function(evt) {

  const coordinate = evt.coordinate;
  console.log(coordinate);
  //const hdms = toStringHDMS(coordinate);
  //transform(coordinate, 'EPSG:4326','EPSG:3857');
  content.innerHTML = "";
  overlay.setPosition(undefined);
  closer.blur();
  if(imageGranice.isVisible())
  {
    getDataRaster(coordinate,imageGranice,'Granice');
  }
  if(vectorPruge.isVisible())
  {
    getDataVektor(coordinate,prugeSource,1,'Pruge');
  }
  if(vectorPumpe.isVisible())
  {
    getDataVektor(coordinate,pumpeSource,2,'Pumpe');
  }
  if(vectorFCD.isVisible())
  {
    getDataVektor(coordinate,FCDSource,2,'FCD');
  }
  if(imageEmissions.isVisible())
  {
    getDataRaster(coordinate,imageEmissions,'Emisije');
  }
  if(PuteviNis.isVisible())
  {
    getDataVektor(coordinate,PuteviNISSource,2,'Putevi Nis');
  }
  
});


const featureRequestZeleznice = new WFS().writeGetFeature({
  srsName: 'EPSG:4326',
  featureNS: 'http://www.vladimirGIS.org/faks',
  featurePrefix: 'faks',
  featureTypes: ['railway'],
  outputFormat: 'application/json',
});

const prugeURL = "http://localhost:8080/geoserver/faks/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=faks%3Arailway&outputFormat=application%2Fjson";
layerList[0][3] = prugeURL;

fetch(/*'http://localhost:8080/geoserver/wfs'*/ prugeURL, {
  method: 'GET',
})
  .then(function (response) {
    return response.json();
  })
  .then(function (json) {
    const features = new GeoJSON().readFeatures(json);
    prugeSource.addFeatures(features);
    map.getView().fit(prugeSource.getExtent());
  });
  //Zeleznice
  const featureRequestPumpe = new WFS().writeGetFeature({
    srsName: 'EPSG:4326',
    featureNS: 'http://www.vladimirGIS.org/faks',
    featurePrefix: 'faks',
    featureTypes: ['Pumpe'],
    outputFormat: 'application/json',
  });
  
  const pumpeURL = "http://localhost:8080/geoserver/faks/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=faks%3APumpe&outputFormat=application%2Fjson";
  layerList[1][3] = pumpeURL;

  fetch(pumpeURL, {
    method: 'GET',
  })
  .then(function (response) {
    return response.json();
  })
  .then(function (json) {  
    pumpeFeatures = new GeoJSON().readFeatures(json);
    pumpeSource.addFeatures(pumpeFeatures);
    map.getView().fit(pumpeSource.getExtent());
  });

  //FCD

  const FCDURL = "http://localhost:8080/geoserver/faks/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=faks%3AFCD_Nis&outputFormat=application%2Fjson";
  layerList[5][3] = FCDURL;

  fetch(FCDURL + "&cql_filter=timestep_time=0", {
    method: 'GET',
  })
  .then(function (response) {
    return response.json();
  })
  .then(function (json) {  
    var FCDFeature = new GeoJSON().readFeatures(json);
    FCDSource.addFeatures(FCDFeature);
    map.getView().fit(FCDSource.getExtent());
  });

  const NISURL = "http://localhost:8080/geoserver/faks/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=faks%3ANIS_Putevi&outputFormat=application%2Fjson";
  layerList[2][3] = NISURL;

  fetch(NISURL, {
    method: 'GET',
  })
  .then(function (response) {
    return response.json();
  })
  .then(function (json) {  
    var nisfeature = new GeoJSON().readFeatures(json);
    PuteviNISSource.addFeatures(nisfeature);
  });


    closer.onclick = function () {
      overlay.setPosition(undefined);
      closer.blur();
      return false;
    };

    //Obrada Dijaloga

    function filterDialogEvent(event)
    {
      filterDialogCreate(event,layerList);
      filterFillOption(null);
    }

    function filterDialogOK(event)
    {
      var selekcija = document.getElementById('filterSlojevi').value;
      
      if(layerList[selekcija][2] == 1)
      {
        updateWMSFilter(layerList[selekcija][0].getSource(),selekcija);
      }
      else
      {
        if(selekcija == 4)
        {
          var link = layerList[selekcija][3];
        }
        else
        {
          var link = layerList[selekcija][3];
        }
        filterVectorLayer(layerList[selekcija][0].getSource(),selekcija,link);
      }
      document.getElementById("filterDialog").close(); 
    }

    function filterFillOption(event)
    {
      var selkcija = Number(document.getElementById('filterSlojevi').value);
      filterCreateOptions(layerList[selkcija],document.getElementById('filterSlojevi').value,(selkcija > 3));
    }

    document.getElementById('filterDialogButton').addEventListener('click',filterDialogEvent);
    document.getElementById('filterDialogOK').addEventListener('click',filterDialogOK);
    document.getElementById('filterSlojevi').addEventListener('change',filterFillOption);
    