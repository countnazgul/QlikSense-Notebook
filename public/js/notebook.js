$(document).ready(function () {

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


    //$('#mainPanel').append(panelTemplate);
    // $.get("/notebook/getSteps/" + notebookId, function(steps, status){
    //     console.log(steps);
    // });

    var socket = io();
    //var socket = io.connect('https:///countnazgul-countnazgul.c9.io');

    $(document).bind('keydown', function (e) {
        if (e.ctrlKey && (e.which == 83)) {
            e.preventDefault();
            alert('Ctrl+S');
            return false;
        }
    });

    socket.on('connect', function (data) {
        socket.emit('join', 'Hello World from client');
        getSteps();
    });

    socket.on('reloadmessage', function (data) {
        console.log(data);
        $('.qsreloadresult[data-stepid="' + data.stepId + '"]').append(data.message);
    });

    socket.on('reloadProgress', function (data) {
        //console.log(data.scriptProgress);
        $('.qsreloadresult[data-stepid="' + data.stepId + '"]').html('');
        var script = data.scriptProgress.join('<br>').replace(/\n/g, '<br>');
        $('.qsreloadresult[data-stepid="' + data.stepId + '"]').html(script);
    });
    //socket.emit('subscribe', 'roomOne');



    $.get("/notebookDetails/" + notebookId, function (notebookName, status) {
        $('#notebookName').text(notebookName);
    });

    //var sessionApps = [];
    // $('#createNewApp').on('click', function () {
    //     createApp();        
    // }) 

    $('#deleteAll').on('click', function () {
        deleteAllApps();
    });


    $(document).on("click", ".qsremove", function () {
        deleteStep($(this).data('stepid'), $(this).data('notebookid'));
    });

    $(document).on("click", ".qssave", function () {
        var stepId = $(this).data('stepid');
        var script = $("#scripttext_" + stepId).siblings();
        script = $(script)[0].CodeMirror;
        script = script.getValue();
        saveStepLocal($(this).data('stepid'), $(this).data('notebookid'), script);

    });

    $(document).on("click", ".qsreload", function () {
        var stepId = $(this).data('stepid');
        $('.qsreloadresult[data-stepid="' + stepId + '"]').val('');
        reloadApp(stepId, $(this).data('notebookid'));
    });

    $(document).on("click", ".qsreloadall", function () {
        reloadFromApp($(this).data('stepid'), $(this).data('notebookid'));
    });

    $(document).on("click", ".qsapp", function () {
        editor('scripttext_' + $(this).data('stepid'));
    });

    $(document).on("click", ".qsvalidate", function () {
        //$(this).data('stepid'));
        validateScript($(this).data('stepid'));
    });

    $('#addStep').on('click', function () {
        addStep();
    });

    var allSteps;
    function getSteps() {
        socket.emit('getSteps', notebookId, function (stepshtml, steps) {
            allSteps = steps;
            //            console.log(steps)
            $('#mainPanel').empty();
            $('#mainPanel').append(stepshtml);
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
        socket.emit('addStep', notebookId, allSteps[allSteps.length - 1].name, function (step) {
            //console.log(step)
            $('#mainPanel').append(step);
            socket.emit('subscribe', $(step).data('stepid'));

            $('.qstooltip').tooltip();
        });
    }

    function deleteStep(stepId, notebookId) {
        socket.emit('deleteStep', stepId, notebookId, function (result) {
            var panels = $('.qsMainPanel');
            console.log(result);
            for (var i = 0; i < panels.length; i++) {
                if (stepId == $(panels[i]).data('stepid')) {
                    $(panels[i]).remove();
                    socket.emit('unsubscribe', stepId)

                }
            }
        });
    }

    function saveStepLocal(stepId, notebookId, script) {
        buttonsToggle(stepId, true);
        progressMsg(stepId, 'Saving ...', false);

        socket.emit('saveStepLocal', stepId, notebookId, script, function (result) {
            progressMsg(stepId, 'Saved local', true);
            buttonsToggle(stepId, false);
        });
    }

    function reloadApp(stepId, notebookId) {
        buttonsToggle(stepId, true);
        progressMsg(stepId, 'Reloading ...', false);

        socket.emit('reloadApp', stepId, notebookId, function (result) {
            progressMsg(stepId, 'Reloaded', true);
            buttonsToggle(stepId, false);
        });
    }

    function reloadFromApp(stepId, notebookId) {
        socket.emit('reloadFromApp', stepId, notebookId, function (result) {
            console.log(result)
        });
    }

    var marks = [];
    function validateScript(stepId) {
        var test = $("#scripttext_" + stepId);
        var editor = $("#scripttext_" + stepId).siblings();
        editor = $(editor)[0].CodeMirror;
        var script = editor.getValue();

        var m = editor.getAllMarks(); 
        for(var i = 0; i <m.length; i++) {
            m[i].clear();
        }

        //$('#test').removeClass('marked')
        buttonsToggle(stepId, true);
        socket.emit('validateScript', script, function (validationResult) {
            console.log(validationResult);
            progressMsg(stepId, validationResult.length + ' error(s)', true);
            buttonsToggle(stepId, false);

            for (var i = 0; i < validationResult.length; i++) {
                editor.getDoc().markText({
                    line: validationResult[i].qLineInTab,
                    ch: validationResult[i].qColInLine
                }, {
                        line: validationResult[i].qLineInTab,
                        ch: validationResult[i].qErrLen + validationResult[i].qColInLine
                    }, {
                        //css: "background-color : red"
                        className: 'marked'
                    });
            }

        });
    }

    function editor(id) {

        if ($('#' + id).hasClass('cm')) {

        } else {
            var edit = CodeMirror.fromTextArea(document.getElementById(id), {
                mode: "text/x-mysql",
                lineNumbers: true,
                tabMode: "indent"
            });

            setTimeout(function () {
                edit.refresh();

                // edit.getDoc().markText({
                //     line: 0,
                //     ch: 3
                // }, {
                //         line: 0,
                //         ch: 10
                //     }, {
                //         css: "background-color : red"
                //     });

            }, 1);

            $('#' + id).addClass('cm');

            //edit.setOption('mode', 'sql');

        }
    }

    // function getlineNumberofChar(data, index) {
    //     var perLine = data.split('\n');
    //     var total_length = 0;
    //     for (i = 0; i < perLine.length; i++) {
    //         total_length += perLine[i].length;
    //         if (total_length >= index)
    //             return i + 1;
    //     }
    // }

    function buttonsToggle(stepId, disable) {
        var buttons = $('.qstooltip[data-stepid="' + stepId + '"]');

        for (var i = 0; i < buttons.length; i++) {
            $(buttons[i]).prop('disabled', disable);
        }
    }

    function progressMsg(stepId, msg, fadeOut) {
        var progress = $('.qsmsg[data-stepid="' + stepId + '"]');
        $(progress).text(msg);
        $(progress).css('display', 'inline-block');

        if (fadeOut == true) {
            $(progress).fadeOut(3000);
        }
    }

    function guid() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
            s4() + '-' + s4() + s4() + s4();
    }


});