$(document).ready(function() {

    $('#addScript').on('click', function() {
        createNotebook();
    });

    $(document).on("click", ".delete", function() {
        var notebookId = $(this).parents().eq(0).attr('id');
        //$(parentPanel).remove();
         $.get("deleteNotebook/" + notebookId, function(data, status){
         });
    });
    
    $(document).on("click", ".open", function() {
        var notebookId = $(this).parents().eq(0).attr('id');
        window.location.href = '/notebook/' + notebookId;
    });

    getAllNotebooks();
    
    function getAllNotebooks() {
         $.get("notebooks", function(notebooks, status){
             notebooks.forEach( function(notebook) {
                $('#notebooks').append('<a href="#" class="list-group-item notebook" id="'+ notebook._id +'"><span class="badge">' + notebook.steps +'</span> '+ 
                '<span class="badge open">Open</span>' +
                '<span class="badge delete">Delete</span>' +
                notebook.name +'</a>');
             });
         });
    }

    function createNotebook() {
        $.post("createNotebook",
        {
            name: "my new notebook"
        },
        function(data, status){
            console.log(data);
        });    
    }
});