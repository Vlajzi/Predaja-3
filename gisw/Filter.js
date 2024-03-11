import {Stroke, Style,Fill,Circle,Icon} from 'ol/style.js';
import {GeoJSON, WFS} from 'ol/format.js';

var selectedType = -1;
var prethodniFilter = ['','','','','',''];

var operacijePoredjenjeNumber = ['=','<','>','<=','>=','!='];
var operacijePoredjenjeString = ['=','!=','contains'];

var sliderStartValue = [0,0,0,0,0,0];
var sliderStartValueMin = [0,0,0,0,0,0];


var atributLsitIDs = ['','','',''];

 
export function filterDialogCreate(event,layerList)
{

  var filterLsit = document.getElementById("filterSlojevi");
  filterLsit.innerHTML = '';
  var i = 0;
  layerList.forEach(element => {
   var option = document.createElement('option');
   option.value = i++;
   option.text = element[1];
   filterLsit.appendChild(option);
  });
  document.getElementById("filterDialog").showModal(); 
  
}


export function filterCreateOptions(layer,selekciaj,isTime)
{
  var quryDIV = document.getElementById("mainQueryDialog");
  quryDIV.innerHTML = "";
  if(layer[2] == 0)
  {
    //Promen planana CQL

    var input = document.createElement('input');
    input.id = "QueryString";
    input.value = prethodniFilter[Number(selekciaj)];
    var labela = document.createElement('label');
    labela.innerHTML = "QCL qury: ";
    labela.htmlFor = "QueryString";
    quryDIV.appendChild(labela);
    quryDIV.appendChild(input);

    if(isTime)
    {
      createSlder(quryDIV,layer,selekciaj);
    }

    selectedType = 0;
  }
  else 
  {

    var input = document.createElement('input');
    input.id = "QueryString";
    input.value = prethodniFilter[Number(selekciaj)];
    var labela = document.createElement('label');
    labela.innerHTML = "QCL qury: ";
    labela.htmlFor = "QueryString";
    quryDIV.appendChild(labela);
    quryDIV.appendChild(input);

    if(isTime)
    {
      createSlder(quryDIV,layer,selekciaj);
    }
    selectedType = 1;
  }
}

export function updateWMSFilter(layerSource,selekcija,time)
{

  var filter = document.getElementById("QueryString").value;
  prethodniFilter[Number(selekcija)] = filter;

  filter = addDualTimerFilter(filter);

  var slider = document.getElementById('tiemSlider');
  var slider2 = document.getElementById('tiemSliderMin');

  if(slider && slider2)
  {
    sliderStartValue[Number(selekcija)] = slider.value;
    sliderStartValueMin[Number(selekcija)] = slider2.value;
  }

  var filterParams = {
    'FILTER': null,
    'CQL_FILTER': null,
    'FEATUREID': null
  };

  if (filter.replace(/^\s\s*/, '').replace(/\s\s*$/, '') != "") 
  {
      filterParams["CQL_FILTER"] = filter;
  }

  layerSource.updateParams(filterParams);
  layerSource.changed()

}


function CreateDropdovnOptions(conteiner,element,type)
{
    var sel = document.createElement('select');

    sel.id = "operacija_" + element;

    var i = 0;
    var operations = operacijePoredjenjeNumber;
    if(!type)
    {
      operations = operacijePoredjenjeString;
    }  
    operations.forEach(el => {
      var op = document.createElement('option');
      op.value = i++;
      op.text = el;
      sel.appendChild(op);
    });

    conteiner.appendChild(sel);
}


export function filterVectorLayer(featureSource,selekcija,connString)
{

  var filter = document.getElementById("QueryString").value;
  prethodniFilter[Number(selekcija)] = filter;

  filter = addDualTimerFilter(filter);
  var slider = document.getElementById('tiemSlider');
  var slider2 = document.getElementById('tiemSliderMin');

  if(slider && slider2)
  {
    sliderStartValue[Number(selekcija)] = slider.value;
    sliderStartValueMin[Number(selekcija)] = slider2.value;
  }

  fetch(connString + '&CQL_filter='+ filter, {
    method: 'GET',
  })
    .then(function (response) {
      return response.json();
    })
    .then(function (json) {  
      var Features = new GeoJSON().readFeatures(json);
      featureSource.clear(true);
      featureSource.addFeatures(Features);
      featureSource.changed();
    });

}

function comaprisonOperationResultNumber(op,value1,value2)
{
  var rez = true;
  if(value1 && value2)
  {
    switch(op)
    {
      case 0: rez = value1 == value2; break;
      case 1: rez = value1 < value2; break;
      case 2: rez = value1 > value2; break;
      case 3: rez = value1 <= value2; break;
      case 4: rez = value1 >= value2; break;
      case 5: rez = value1 != value2; break;
      default: rez = false;
    }
  }
  return rez;
}

function comaprisonOperationResultString(op,value1,value2)
{
  var rez = true;
  if(value1 && value2)
  {
    switch(op)
    {
      case 0: rez = value1 == value2; break;
      case 1: rez = value1 != value2; break;
      case 2: rez = value1.includes(value2); break;
      default: rez = false;
    }
  }
  return rez;
}

//da se limitira unos
function isNumber(value) {
  return typeof value === 'number';
}

function createSlder(quryDIV,layer,selekciaj)
{
  quryDIV.appendChild(document.createElement('br'));
  quryDIV.appendChild(document.createElement('br'));

  var slider =  document.createElement('input');
  slider.type = "range";
  slider.min = layer[4];
  slider.max = layer[5];
  slider.value = sliderStartValue[Number(selekciaj)];
  slider.className = "tiemSliderClass";
  slider.id = "tiemSlider";


  var slider2 =  document.createElement('input');
  slider2.type = "range";
  slider2.min = layer[4];
  slider2.max = layer[5];
  slider2.value = sliderStartValueMin[Number(selekciaj)];
  slider2.className = "tiemSliderClass";
  slider2.id = "tiemSliderMin";


  slider.addEventListener('change',inputChange);
  slider.addEventListener('input',inputChange);
  slider2.addEventListener('change',inputChange);
  slider2.addEventListener('input',inputChange);
  
  quryDIV.appendChild(slider);

  var labelValeu = document.createElement('input');
  labelValeu.min = layer[4];
  labelValeu.max = layer[5];
  labelValeu.value = slider.value;
  labelValeu.type = 'number'
  labelValeu.id = 'sliderValue';

  var labelValeuMin = document.createElement('input');
  labelValeuMin.min = layer[4];
  labelValeuMin.max = layer[5];
  labelValeuMin.value = slider2.value;
  labelValeuMin.type = 'number'
  labelValeuMin.id = 'sliderValueMin';

  labelValeu.addEventListener('change',inputChange);
  labelValeuMin.addEventListener('change',inputChange);


  var labela = document.createElement('label');
  labela.innerHTML = "Min  ";
  labela.htmlFor = "sliderValueMin";

  var labela2 = document.createElement('label');
  labela2.innerHTML = "  Max ";
  labela2.htmlFor = "sliderValue";

  quryDIV.appendChild(slider2);
  quryDIV.appendChild(document.createElement('br'));
  quryDIV.appendChild(slider);
  quryDIV.appendChild(document.createElement('br'));
  quryDIV.appendChild(labela);
  quryDIV.appendChild(labelValeuMin);
  quryDIV.appendChild(labela2);
  quryDIV.appendChild(labelValeu);
}

function sliderEvent(event)
{
  var slider =  document.getElementById('tiemSlider');
  var labelValeu = document.getElementById('sliderValue');

  var trigerElement = document.getElementById(event.target.id);
  slider.value = trigerElement.value;
  labelValeu.value = slider.value;
}

function inputChange(event)
{
  var sliderMax =  document.getElementById('tiemSlider');
  var labelValeuMax = document.getElementById('sliderValue');
  var sliderMin =  document.getElementById('tiemSliderMin');
  var labelValeuMin = document.getElementById('sliderValueMin');

  var targetElement = document.getElementById(event.target.id)
  if(event.target.id.includes('Min') )
  {
    if(Number(targetElement.value) >= Number(sliderMax.value))
    {
      targetElement.value = sliderMax.value;
    }
    sliderMin.value = targetElement.value;
    labelValeuMin.value = sliderMin.value; 
  }
  else
  {
    if(Number(targetElement.value) <= Number(sliderMin.value))
    {
      targetElement.value = sliderMin.value;
    }
    sliderMax.value = targetElement.value;
    labelValeuMax.value = sliderMax.value;
  }

}

function addTimeToFilter(filter)
{
  var slider =  document.getElementById('tiemSlider');
  if(slider)
  {
    //Ima vremenske komponente //Ime je zakucano

    if(filter != '')
    {
      filter += ' and timestep_time=' + slider.value;
    }
    else
    {
      filter += 'timestep_time=' + slider.value;
    }
  }

  return filter;
}

function addDualTimerFilter(filter)
{
  var slider =  document.getElementById('tiemSlider');
  var slider2 =  document.getElementById('tiemSliderMin');

  if(slider && slider2)
  {
    //Ima vremenske komponente //Ime je zakucano

    if(filter != '')
    {
      filter += ' and timestep_time >= ' + slider2.value + ' and timestep_time <= ' + slider.value;
    }
    else
    {
      filter += 'timestep_time >= ' + slider2.value + ' and timestep_time <= ' + slider.value;
    }
  }

  return filter;
}
