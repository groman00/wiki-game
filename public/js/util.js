(function(win, doc, $){

    //global utility functions
    var util = win['UTIL'] = {};

    //form helpers
    var form = (function(){

        return {
            serializeObject: function(form){
                var obj = {};        
                $(form).serializeArray().map(function(field){
                    obj[field.name] = field.value;
                });
                return obj;
            }
        }

    })();

    util.form = form;
    
})(window, document, jQuery);