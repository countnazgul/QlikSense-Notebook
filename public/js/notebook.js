$(document).ready(function() {

    const debugMode = true;
    var scriptDebug;
    var notebookId = window.location.href.split('/');
    notebookId = notebookId[notebookId.length - 1];
    notebookId = notebookId.split('#');
    notebookId = notebookId[0];

    //.replace('#', '');

    if (debugMode == true) {
        scriptDebug = '//New script';
    }

    const appPrefix = 'zzz_Notebook_';
    // 
    var panelTemplate = `
    <div class="panel panel-default">
      <div class="panel-heading">
      <div class="container-fluid">
      
      <div class="row"">
       <div class="col-lg-7">
        <button data-original-title="Reload current" data-placement="bottom" data-toggle="tooltip" type="button" class="btn btn-default qsreload qstooltip">
          <span class="glyphicon glyphicon-refresh"></span>
        </button>      
        <button data-original-title="Reload all after this" data-placement="bottom" data-toggle="tooltip" type="button" class="btn btn-default qsreloadall qstooltip">
          <span class="glyphicon glyphicon-forward"></span>
        </button>              
        <button data-original-title="Local save" data-placement="bottom" data-toggle="tooltip" type="button" class="btn btn-default qssave qstooltip" name="<%stepId%>">
          <span class="glyphicon glyphicon-floppy-save"></span>
        </button>                      
        <button data-original-title="Engine save" data-placement="bottom" data-toggle="tooltip" type="button" class="btn btn-default qssaveengine qstooltip" name="<%stepId%>">
          <span class="glyphicon glyphicon-transfer"></span>
        <button data-original-title="Delete step" data-placement="bottom" data-toggle="tooltip" type="button" class="btn btn-default qsremove qstooltip" name="<%stepId%>">
          <span class="glyphicon glyphicon-remove "></span>
        </button>
        <a data-toggle="collapse" data-target="#<%name%>" class="collapsed" href="#<%name%>">
            <span class="qsapp" ><%name%></span>
        </a>
        
        </div>

         <div class="col-lg-5" style="text-align: right">
            <div>
                <span class="qsmsg" style="display: none"> Status1 </span>
                <span class="qsstatus" style="display: none"> Status </span>
            </div>
        </div> 
        </div>
       </div> 

      </div>    
      <div id="<%name%>" class="panel-collapse collapse">
      <div class="panel-body">
        Script <br>
        <textarea class="form-control qsscript" rows="5"><%script%></textarea> <br>
        Reload result <br>
        <textarea class="form-control qsscript" rows="5"></textarea>
      </div>   
      </div>
      <!-- <div class="panel-footer">Panel Footer</div> -->
    </div>
    `;

    //$('#mainPanel').append(panelTemplate);
    // $.get("/notebook/getSteps/" + notebookId, function(steps, status){
    //     console.log(steps);
    // });

    var socket = io();
    //var socket = io.connect('https:///countnazgul-countnazgul.c9.io');

    socket.on('connect', function(data) {
        socket.emit('join', 'Hello World from client');
        getSteps();
    });

    socket.on('reloadmessage', function(data) {
        console.log(data);
        $('.qsreloadresult[data-stepid="' + data.stepId + '"]').append(data.message);
    });

    //socket.emit('subscribe', 'roomOne');



    $.get("/notebookDetails/" + notebookId, function(notebookName, status) {
        $('#notebookName').text(notebookName);
    });

    //var sessionApps = [];
    // $('#createNewApp').on('click', function () {
    //     createApp();        
    // })

    $('#deleteAll').on('click', function() {
        deleteAllApps();
    });


    $(document).on("click", ".qsremove", function() {
        deleteStep($(this).data('stepid'), $(this).data('notebookid'));
    });

    $(document).on("click", ".qssave", function() {
        var stepId = $(this).data('stepid');
        var script = $("#scripttext_" + stepId).siblings();
        script = $(script)[0].CodeMirror;
        script = script.getValue();
        saveStepLocal($(this).data('stepid'), $(this).data('notebookid'), script);
    });

    $(document).on("click", ".qsreload", function() {
        reloadApp($(this).data('stepid'), $(this).data('notebookid'));
    });

    $(document).on("click", ".qsreloadall", function() {
        reloadFromApp($(this).data('stepid'), $(this).data('notebookid'));
    });

    $(document).on("click", ".qsapp", function() {
        //console.log('scripttext_' + $(this).data('stepid'))

        editor('scripttext_' + $(this).data('stepid'));

    });

    $('#addStep').on('click', function() {
        addStep();
    });


    function getSteps() {
        socket.emit('getSteps', notebookId, function(steps) {
            $('#mainPanel').empty();
            $('#mainPanel').append(steps);
            var qsMainPanel = $('.qsMainPanel');
            for (var i = 0; i < qsMainPanel.length; i++) {
                socket.emit('subscribe', $(qsMainPanel[i]).data('stepid'))
                    //console.log( 'scripttext_' + $(qsMainPanel[i]).data('stepid') )

            }

            $('.qstooltip').tooltip();



            // var myCodeMirror = CodeMirror.fromTextArea(myTextArea);
        });
    }

    function addStep() {
        socket.emit('addStep', notebookId, function(step) {
            //console.log(step)
            $('#mainPanel').append(step);
            socket.emit('subscribe', $(step).data('stepid'));

            $('.qstooltip').tooltip();
        });
    }

    function deleteStep(stepId, notebookId) {
        socket.emit('deleteStep', stepId, notebookId, function(result) {
            var panels = $('.qsMainPanel');

            for (var i = 0; i < panels.length; i++) {
                if (stepId == $(panels[i]).data('stepid')) {
                    $(panels[i]).remove();
                    socket.emit('unsubscribe', stepId)

                }
            }
        });
    }

    function saveStepLocal(stepId, notebookId, script) {
        var progress = $('.qsmsg[data-stepid="' + stepId + '"]');
        $(progress).text('Saving ...');
        $(progress).css('display', 'inline-block');
        socket.emit('saveStepLocal', stepId, notebookId, script, function(result) {
            $(progress).text('Saved local');
            $(progress).fadeOut("slow");
        });
    }

    function reloadApp(stepId, notebookId) {
        socket.emit('reloadApp', stepId, notebookId);
    }

    function reloadFromApp(stepId, notebookId) {

        socket.emit('reloadFromApp', stepId, notebookId);
    }

    function editor(id) {
        
        if ( $('#' + id).hasClass('cm')) {
            
        } else {
            var edit = CodeMirror.fromTextArea(document.getElementById(id), {
                mode: "text",
                lineNumbers: true,
                tabMode: "indent",
                class: 'tttttt'
            });

            setTimeout(function() {
                edit.refresh();
            }, 1);

            $('#' + id).addClass('cm');

        }
    }



    /*function getSteps() {
        $.get("/notebook/getSteps/" + notebookId, function(steps, status){
            //console.log(steps);
            steps.forEach(function(step) {
                //console.log(step.name)
                socket.emit('subscribe', step.name)
                var newPanelTemplate = panelTemplate.replace(/<%name%>/g, step.name);
                newPanelTemplate = newPanelTemplate.replace(/<%stepId%>/g, step._id);
                newPanelTemplate = newPanelTemplate.replace('<%script%>', step.script);
                $('#mainPanel').append(newPanelTemplate);
            });
            
            $('.qstooltip').tooltip();
            
            steps.forEach(function(step) {
                $.get("/notebook/step/getStatus/" + notebookId + '/' + step._id, function(stepStatus, status){
                    //console.log(stepStatus);
                    var obj = $('[name="'+ step._id +'"]');
                    statusDisplay( obj[1], stepStatus.status );
                });
            });
        });
    }
    */

    /*
    function createApp() {
        var config = {
            appName: ''
        };
        
        var newAppName = appPrefix + '' + guid();
        
        $.post("addStep",
            {
                notebookId: notebookId,
                appName: newAppName,
                script: scriptDebug
            },
            function(data, status){
                //console.log(data);

        if (debugMode == false) {
            var appName = appPrefix + '' + guid();
            var mainGlobal;
            qsocks.Connect(config).then(function(global) {
                mainGlobal = global;
                return global;
            }).then(function(global) {
                return global.createApp(appName);
            }).then(function(app) {
                console.log(app);
                return mainGlobal.openDoc(app.qAppId);
            }).then(function(app) {
                return app.getScript();
            }).then(function(script) {
                var newPanelTemplate = panelTemplate.replace('<%name%>', appName);
                //newPanelTemplate = newPanelTemplate.replace(/<%stepId%>/g, step._id);
                newPanelTemplate = newPanelTemplate.replace('<%script%>', script);

                $('#mainPanel').append(panelTemplate);

            });
        }
        else {
            
            //console.log(newAppName);
            var newPanelTemplate = panelTemplate.replace(/<%name%>/g, newAppName);
            newPanelTemplate = newPanelTemplate.replace(/<%stepId%>/g, data._id);
            newPanelTemplate = newPanelTemplate.replace('<%script%>', scriptDebug);
            $('#mainPanel').append(newPanelTemplate);
        }
            });        
    }
*/

    /*function deleteAllApps() {
        var config = {
            appName: ''
        };

        var mainGlobal;
        qsocks.Connect(config).then(function(global) {
            mainGlobal = global;
            return global;
        }).then(function(global) {
            return global.getDocList();
        }).then(function(docList) {

            docList.forEach(function(doc) {
                if (doc.qDocName.indexOf('zzz_Notebook_') > -1) {
                    mainGlobal.deleteApp(doc.qDocName).then(function(result) {
                        console.log(result);
                    });
                }
            });
        });
    }*/

    function guid() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
            s4() + '-' + s4() + s4() + s4();
    }

    function msgDisplay(obj, message, fadeOut) {
        var msg = $(obj).parent().parent().children();
        msg = msg[1];
        msg = $(msg).children();
        msg = msg[0];
        msg = $(msg).children()[0];
        $(msg).text(message);
        $(msg).css('display', 'inline-block');

        if (fadeOut === true) {
            $(msg).fadeOut("slow");
        }
    }

    function statusDisplay(obj, status) {
        var msg = $(obj).parent().parent().children();
        msg = msg[1];
        msg = $(msg).children();
        msg = msg[0];
        msg = $(msg).children()[1];
        //console.log(status)
        if (status.status == true) {
            $(msg).text(status);
        }
        else {
            $(msg).text(status);
        }

        $(msg).css('display', 'inline-block');

    }


});