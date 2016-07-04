var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var async = require('async');
var swig = require('swig');
var uuid = require('node-uuid');
var config = require('./config/config');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var server = require('http').createServer(app);
var io = require('socket.io')(server);


app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));

app.engine('html', swig.renderFile);

app.set('view engine', 'html');
app.set('views', __dirname + '/views');

app.set('view cache', false);
swig.setDefaults({
  cache: false
});

mongoose.connect(config.main.db, function(err) {
  if (err) {
    throw err;
  }
  else {
    console.log('Connected to database');
  }
});

var stepsSchema = new Schema({
  name: String,
  script: String
});

var notebookModel = mongoose.model('notebookModel', {
  name: String,
  createdAt: Date,
  steps: [stepsSchema]
});

const appPrefix = 'zzz_Notebook_';

// var parent = new notebookModel({ name: 'test',createdAt: new Date(),   
//   steps: [{ name: 'Matt', createdAt: new Date(), script: 's1' }, { name: 'Matt1', createdAt: new Date(), script: 's2' }] 
// });
// parent.save(function(err, doc) {
//   console.log(doc);
// });

app.get('/test1', function(req, res) {

  notebookModel.findOne({
    _id: '5766d4ff11564cce089b849c'
  }, function(err, doc) {
    //var tpl = swig.compileFile( __dirname + '/views/step.html');
    //var template = tpl( { notebookId: doc._id, steps: doc.steps } );
    console.log(JSON.stringify(doc.steps));
    var template = swig.renderFile(__dirname + '/views/step.html', {
      notebookId: doc._id.toString(),
      steps: doc.steps
    });

    res.send(template);

  });
});

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/notebooks', function(req, res) {
  notebookModel.find({}, function(err, docs) {
    res.send(docs);
  });
});

app.get('/deleteNotebook/:notebookId', function(req, res) {
  notebookModel.findOne({
    _id: req.params.notebookId
  }, function(err, doc) {
    res.send(doc);
  });
});

app.get('/notebook/:notebookId', function(req, res) {
  res.sendFile(__dirname + '/public/notebook.html');
  //dbNotebook.findOne( { _id: req.params.notebookId }, function (err, doc) {
  //  res.send(doc);
  //});
});

app.get('/notebookDetails/:notebookId', function(req, res) {
  notebookModel.findOne({
    _id: req.params.notebookId
  }, function(err, doc) {
    //console.log(req.params.notebookId);
    res.send(doc.name);
  });
});

app.post('/createNotebook', function(req, res) {
  var data = req.body;
  var doc = {
    name: data.name,
    createdAt: new Date(),
    steps: []
  };

  var notebook = new notebookModel(doc);
  notebook.save(function(err, newNotebook) {
    res.send(newNotebook);
  });

});

app.post('/notebook/addStep', function(req, res) {
  //var data = req.body;
  var notebookId = req.body.notebookId;
  var appName = req.body.appName;
  var script = req.body.script;

  notebookModel.findOne({
    _id: notebookId
  }, function(err, doc) {

    var subdoc = doc['steps'].create({
      name: appName,
      script: script
    });
    doc['steps'].push(subdoc);

    //doc.steps.push( {name: appName, script: script });
    doc.save(function(err, doc) {
      res.send(subdoc);
    });
  });

});

app.get('/notebook/step/getStatus/:notebookId/:stepId', function(req, res) {
  var notebookId = req.params.notebookId;
  var stepId = req.params.stepId;

  var present = Math.random() < 0.5 ? true : false;

  res.send({
    status: present
  });
});

app.get('/notebook/getSteps/:notebookId', function(req, res) {

  notebookModel.findOne({
    _id: req.params.notebookId
  }, function(err, doc) {
    res.send(doc.steps);
  });

});

app.post('/saveStep', function(req, res) {
  var notebookId = req.body.notebookId;
  var stepId = req.body.stepId;
  var script = req.body.script;

  // notebookModel.find({"steps._id": ObjectId(stepId)}, {'steps.$': 1}, function(err, step) {
  //   console.log(step);
  //   res.send(step)
  // })

  notebookModel.findById(notebookId, function(err, doc) {
    var step = doc.steps.id(stepId);
    step.script = script;
    doc.save(function(err, d) {
      res.send(d);
    });
  });
});

app.post('/deleteStep', function(req, res) {
  //var data = req.body;
  var notebookId = req.body.notebookId;
  var stepId = req.body.stepId;

  notebookModel.findById(notebookId, function(err, doc) {
    var step = doc.steps.id(stepId).remove();

    doc.save(function(err, d) {
      res.send(d);
    });
  });
});

app.get('/notebook/reloadAllAfter/:notebookId/:stepId', function(req, res) {
  var notebookId = req.params.notebookId;
  var stepId = req.params.stepId;

  notebookModel.findById(notebookId, function(err, doc) {

    var steps = doc.steps;
    var found = false;
    var stepsToProcess = [];

    async.each(steps, function(step, callback) {

      if (step.name == stepId) {
        found = true;
        stepsToProcess.push(step.name);
        callback();
      }
      else {
        if (found == true) {
          stepsToProcess.push(step.name);
          callback();
        }
        else {
          callback();
        }
      }
      //callback();
    }, function(err) {
      if (err) {

      }

      res.send(stepsToProcess);

    });


  });
});


io.on('connection', function(client) {
  console.log('Client connected...');

  client.on('join', function(data) {
    console.log(data);
    client.emit('messages', 'Hello from server');
  });

  client.on('subscribe', function(room) {
    console.log('joining room', room);
    client.join(room);
    //io.sockets.in(room).emit('message', '123456');
  });
  
  client.on('unsubscribe', function(room) {
    console.log('LEAVING room', room);
    client.leave(room);
    //io.sockets.in(room).emit('message', '123456');
  });  

  client.on('send', function(data) {
    console.log('sending message');
    io.sockets.in(room).emit('message', data);
  });

  client.on('reloadApp', function(stepId, notebookId) {
    reloadApp( notebookId, stepId, function(result) {
      
    })
  });
  
  
  function reloadApp(notebookId, stepId, callback) {
    var count = 0;
    var intervalObject = setInterval(function() {
      count++;
      io.sockets.in(stepId).emit('reloadmessage', {
        stepId: stepId,
        message: '<br>' + count + ' --> ' + stepId
      });
      
      if (count == 5) {
        clearInterval(intervalObject);
        callback();
      }
    }, 1000);    
  }

  client.on('reloadFromApp', function(stepId, notebookId) {
    notebookModel.findById(notebookId, function(err, doc) {
      var steps = doc.steps;
      var found = false;
      var stepsToProcess = [];

      async.each(steps, function(step, callback) {

        if (step._id == stepId) {
          found = true;
          stepsToProcess.push(step._id);
          // reloadApp( notebookId, step._id, function(result) {
          //   callback();
          // });
        }
        else {
          if (found == true) {
            // reloadApp( notebookId, step._id, function(result) {
            //   callback();
            // });
            stepsToProcess.push(step._id);
          }
          else {
            callback();
          }
        }
        //callback();
      }, function(err) {
  
      });

    async.each(stepsToProcess, function(step, callback) {
      reloadApp( notebookId, step, function(result) {
        callback();
      });    
    }, function(err) {
  
    });      

    });
  });



  client.on('getSteps', function(notebookId, callback) {
    notebookModel.findOne({
      _id: notebookId
    }, function(err, notebook) {
      var template = swig.renderFile(__dirname + '/views/step.html', {
        notebookId: notebook._id.toString(),
        steps: notebook.steps
      });

      callback(template);
    });
  });

  client.on('addStep', function(notebookId, callback) {
    var appName = appPrefix + uuid.v4();
    notebookModel.findOne({
      _id: notebookId
    }, function(err, notebook) {
      var step = notebook['steps'].create({
        name: appName,
        script: '// new scrpt'
      });


      notebook['steps'].push(step);

      notebook.save(function(err, doc) {
        var template = swig.renderFile(__dirname + '/views/step.html', {
          notebookId: notebookId,
          steps: [{
            id: step._id.toString(),
            name: step.name,
            script: step.script
          }]
        });

        callback(template);
      });
    });
  });

  client.on('deleteStep', function(stepId, notebookId, callback) {
    notebookModel.findById(notebookId, function(err, doc) {
      var step = doc.steps.id(stepId).remove();

      doc.save(function(err, d) {
        callback('ok');
      });
    });
  });


  client.on('saveStepLocal', function(stepId, notebookId, script, callback) {

    notebookModel.findById(notebookId, function(err, doc) {
      var step = doc.steps.id(stepId);
      step.script = script;
      doc.save(function(err, d) {
        callback('ok');
      });
    });

  });


});


server.listen(process.env.PORT, process.env.IP, function() {
  console.log('Example app listening on port ' + process.env.PORT);
});
/*
const qsocks = require('qsocks');


  qsocks.Connect().then(function(global) {
    return global;
  }).then( function(global) {
    return global.getDocList()
  }).then(function(docList) {
   docList.forEach(function(doc) {
      console.log(doc)
    });
  });
*/